// Long-trip planner: builds a day-by-day route from a start city across chosen regions,
// from a weekend up to ~90 days. Runs fully in the browser; nothing is sent anywhere.

export const ROAD_FACTOR = 1.3;          // straight-line → rough road distance
const KM_PER_TRAVEL_DAY = 400;           // a full day on the road

export function haversine(a, b) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export const roadKm = (a, b) => Math.round(haversine(a, b) * ROAD_FACTOR);

// Under ~250 km you travel on the morning of arrival; longer hops get dedicated travel days.
// Very long hops (> 900 km) assume train or flight, so they cost at most 1 day.
export function travelDaysFor(km) {
  if (km <= 250) return 0;
  if (km > 900) return 1;
  return Math.min(2, Math.ceil((km - 250) / KM_PER_TRAVEL_DAY));
}
export const modeFor = (km) => (km > 900 ? "train / flight" : km > 250 ? "road / train" : "road");

const PACE_DAYS ={ relaxed: 3, normal: 2, fast: 1 };

/**
 * @param {object} o
 *  start: {name, lat, lng}
 *  days: number
 *  startDate: Date
 *  pace: 'relaxed'|'normal'|'fast'
 *  pool: destinations already filtered by the user's categories / groups / regions
 *  pinned: destinations the user must visit
 *  wantCats: Set of category letters the user likes (for scoring)
 */
export function planTrip({ start, days, startDate, pace, pool, pinned, wantCats }) {
  const stay = PACE_DAYS[pace] || 2;
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const candidates = [...new Map([...pinned, ...pool].map((d) => [d.id, d])).values()];
  const monthOf = (n) => new Date(startDate.getTime() + (n - 1) * 864e5).getMonth() + 1;
  const nightsAt = (d) => Math.max(1, stay - (d.gem ? 1 : 0));

  // 1 ─ pick stops greedily (interest + season + closeness) until the days are used up
  const chosen = [], used = new Set();
  let here = start, dayNo = 1;
  while (dayNo <= days) {
    const month = monthOf(dayNo);
    let best = null, bestScore = -Infinity;
    for (const d of candidates) {
      if (used.has(d.id)) continue;
      // high-altitude / tough places off-season usually mean closed passes or snowed-in roads
      if (d.access === "t" && !d.months.includes(month) && !pinnedIds.has(d.id)) continue;
      const km = roadKm(here, d);
      const need = travelDaysFor(km) + (km < 20 ? 1 : nightsAt(d));
      if (dayNo + need - 1 > days && !pinnedIds.has(d.id)) continue;
      const score = d.cats.filter((c) => wantCats.has(c)).length * 2
        + (d.months.includes(month) ? 3 : -8) + (d.gem ? 1 : 0)
        + (pinnedIds.has(d.id) ? 12 : 0) - km / 60;
      if (score > bestScore) { bestScore = score; best = { d, need }; }
    }
    if (!best) break;
    used.add(best.d.id); chosen.push(best.d);
    dayNo += best.need; here = best.d;
  }

  // 2 ─ untangle the route (2-opt, start fixed, open path) so it doesn't zigzag
  const order = twoOpt(start, chosen);

  // 3 ─ lay out the days; drop the least interesting non-pinned stop while it overflows
  let res = schedule(order);
  while (res.lastDay > days && order.some((d) => !pinnedIds.has(d.id))) {
    let worst = -1, worstScore = Infinity;
    order.forEach((d, i) => {
      if (pinnedIds.has(d.id)) return;
      const sc = d.cats.filter((c) => wantCats.has(c)).length * 2 + (d.gem ? 1 : 0);
      if (sc < worstScore) { worstScore = sc; worst = i; }
    });
    order.splice(worst, 1);
    res = schedule(twoOpt(start, order));
  }
  return { plan: res.plan.filter((p) => p.day <= days), totalKm: res.totalKm, stops: res.plan.filter((p) => p.type === "stay" && p.day <= days).map((p) => p.dest) };

  function schedule(stops) {
    const plan = []; let n = 1, prev = start, totalKm = 0;
    for (const d of stops) {
      const km = roadKm(prev, d), td = travelDaysFor(km);
      totalKm += km;
      for (let i = 0; i < td; i++) plan.push({ day: n++, type: "travel", from: prev.name, to: d.name, km: i === 0 ? km : 0, mode: modeFor(km) });
      // a second sight in the same city (< 20 km) only needs one more night
      const nights = Math.min(km < 20 ? 1 : nightsAt(d), Math.max(1, days - n + 1));
      plan.push({ day: n, nights, type: "stay", dest: d, km: td ? 0 : km, inSeason: d.months.includes(monthOf(n)) });
      n += nights; prev = d;
    }
    return { plan, totalKm, lastDay: n - 1 };
  }
}

function twoOpt(start, stops) {
  const path = [start, ...stops];
  const dist = (a, b) => haversine(a, b);
  let improved = true, guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 1; i < path.length - 1; i++) {
      for (let k = i + 1; k < path.length; k++) {
        const a = path[i - 1], b = path[i], c = path[k], d = path[k + 1];
        const before = dist(a, b) + (d ? dist(c, d) : 0);
        const after = dist(a, c) + (d ? dist(b, d) : 0);
        if (after + 1e-6 < before) { path.splice(i, k - i + 1, ...path.slice(i, k + 1).reverse()); improved = true; }
      }
    }
  }
  return path.slice(1);
}
