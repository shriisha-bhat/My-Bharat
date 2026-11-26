import { STATES, REGIONS } from "../data/states.js";
import { DESTINATIONS, CATEGORIES, GROUPS } from "../data/destinations.js";
import { FESTIVALS } from "../data/festivals.js";
import { CITIES } from "../data/cities.js";
import { ADS, AD_CONTACT } from "../data/ads.js";
import { STR, MONTHS, REGION_NAMES } from "./i18n.js";
import { THEMES, applyTheme } from "./themes.js";
import { planTrip, roadKm } from "./planner.js";

// ─────────────────────────── state ───────────────────────────
// Everything lives in memory only. No cookies, no localStorage, no analytics.
const S = {
  lang: "en",
  q: "", region: "", state: "", month: 0, gems: false,
  cats: new Set(), groups: new Set(),
  from: null,                       // {name, lat, lng}
  pinned: [],                       // destination objects
  tripRegions: new Set(),
  theme: "follow", mapStyle: "satellite", terrain: false,
  lastTrip: null,
};
const $ = (s) => document.querySelector(s);
const t = (k) => STR[S.lang][k] ?? STR.en[k] ?? k;
const byName = new Map(DESTINATIONS.map((d) => [d.name, d]));
const CAT_COLORS = { D: "#ff9933", H: "#c084fc", C: "#38bdf8", B: "#ef4444", F: "#22c55e", W: "#a3e635", S: "#06b6d4", M: "#f1f5f9", A: "#f97316" };
const ACCESS_RANK = { e: 0, m: 1, t: 2 };
const isMobile = () => matchMedia("(max-width: 820px)").matches;

// ─────────────────────────── map ───────────────────────────
const TILE = {
  satellite: {
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    labels: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    maxzoom: 19,
  },
  street: {
    tiles: ["a", "b", "c"].map((s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`),
    attribution: "© OpenStreetMap contributors © CARTO",
    maxzoom: 20,
  },
  night: {
    tiles: ["a", "b", "c"].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`),
    attribution: "© OpenStreetMap contributors © CARTO",
    maxzoom: 20,
  },
};

function buildStyle(kind) {
  const k = TILE[kind];
  const sources = { base: { type: "raster", tiles: k.tiles, tileSize: 256, attribution: k.attribution, maxzoom: k.maxzoom } };
  const layers = [
    { id: "bg", type: "background", paint: { "background-color": "#05070d" } },
    { id: "base", type: "raster", source: "base" },
  ];
  if (k.labels) {
    sources.labels = { type: "raster", tiles: k.labels, tileSize: 256, maxzoom: 19 };
    layers.push({ id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.9 } });
  }
  return {
    version: 8,
    projection: { type: "globe" },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sky: {
      "sky-color": "#0b1d3a", "horizon-color": "#f6b70f", "fog-color": "#0b1d3a",
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
    },
    sources, layers,
  };
}

const map = new maplibregl.Map({
  container: "map",
  style: buildStyle(S.mapStyle),
  center: [80, 20], zoom: 1.6, maxPitch: 75,
  attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

let popup = null;

function addOverlays() {
  if (!map.getSource("dem")) {
    map.addSource("dem", {
      type: "raster-dem", encoding: "terrarium", tileSize: 256, maxzoom: 14,
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      attribution: "Terrain: Mapzen / AWS Open Data",
    });
  }
  map.addSource("dest", { type: "geojson", data: fc([]) });
  map.addSource("route", { type: "geojson", data: fc([]) });
  map.addSource("stops", { type: "geojson", data: fc([]) });

  map.addLayer({ id: "route-line", type: "line", source: "route",
    paint: { "line-color": "#ffd21f", "line-width": 3, "line-dasharray": [2, 1.5], "line-opacity": 0.9 } });
  map.addLayer({ id: "dest-dot", type: "circle", source: "dest",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 3.5, 6, 6, 10, 9],
      "circle-color": ["match", ["get", "cat"], ...Object.entries(CAT_COLORS).flat(), "#ffffff"],
      "circle-stroke-color": ["case", ["==", ["get", "gem"], 1], "#ffd21f", "#111111"],
      "circle-stroke-width": ["case", ["==", ["get", "gem"], 1], 2.5, 1],
      "circle-opacity": ["case", ["==", ["get", "off"], 1], 0.45, 1],
    } });
  map.addLayer({ id: "dest-label", type: "symbol", source: "dest", minzoom: 5,
    layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 12,
      "text-offset": [0, 1.1], "text-anchor": "top", "text-optional": true },
    paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1.4 } });
  map.addLayer({ id: "stop-num", type: "circle", source: "stops",
    paint: { "circle-radius": 11, "circle-color": "#d4141c", "circle-stroke-color": "#ffd21f", "circle-stroke-width": 2 } });
  map.addLayer({ id: "stop-num-t", type: "symbol", source: "stops",
    layout: { "text-field": ["to-string", ["get", "n"]], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-allow-overlap": true },
    paint: { "text-color": "#fff" } });

  setTerrain(S.terrain);
  refresh();
  if (S.lastTrip) drawTrip(S.lastTrip);
}

map.on("style.load", addOverlays);
map.on("load", () => !S.lastTrip && map.flyTo({ center: [80.5, 22], zoom: isMobile() ? 3.2 : 3.9, duration: 3500, essential: true }));

for (const layer of ["dest-dot", "stop-num"]) {
  map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
}
map.on("click", "dest-dot", (e) => openPopup(DESTINATIONS[e.features[0].properties.id]));
map.on("click", "stop-num", (e) => openPopup(DESTINATIONS[e.features[0].properties.id]));

function setTerrain(on) {
  if (!map.getSource("dem")) return;
  map.setTerrain(on ? { source: "dem", exaggeration: 1.5 } : null);
  if (on && map.getPitch() < 40) map.easeTo({ pitch: 60, duration: 800 });
  if (!on && map.getPitch() > 0) map.easeTo({ pitch: 0, duration: 800 });
}

const fc = (features) => ({ type: "FeatureCollection", features });
const pt = (d, props) => ({ type: "Feature", geometry: { type: "Point", coordinates: [d.lng, d.lat] }, properties: props });

// ─────────────────────────── filtering ───────────────────────────
function groupRule() {
  if (!S.groups.size) return null;
  let maxA = 2; const cats = new Set();
  for (const g of S.groups) {
    maxA = Math.min(maxA, ACCESS_RANK[GROUPS[g].maxAccess]);
    for (const c of GROUPS[g].cats) cats.add(c);
  }
  return { maxA, cats };
}

function matches(d, { ignore = [] } = {}) {
  const st = STATES[d.state];
  if (!ignore.includes("q") && S.q) {
    const q = S.q.toLowerCase();
    if (!(d.name.toLowerCase().includes(q) || st[0].toLowerCase().includes(q) || st[1].includes(S.q) || st[2].includes(S.q) || d.note.toLowerCase().includes(q))) return false;
  }
  if (!ignore.includes("region") && S.region && st[3] !== S.region) return false;
  if (!ignore.includes("state") && S.state && d.state !== S.state) return false;
  if (S.cats.size && !d.cats.some((c) => S.cats.has(c))) return false;
  const g = groupRule();
  if (g && (ACCESS_RANK[d.access] > g.maxA || !d.cats.some((c) => g.cats.has(c)))) return false;
  if (!ignore.includes("month") && S.month && !d.months.includes(S.month)) return false;
  if (S.gems && !d.gem) return false;
  return true;
}

function filtered() {
  const list = DESTINATIONS.filter((d) => matches(d));
  if (S.from) {
    for (const d of list) d._km = roadKm(S.from, d);
    list.sort((a, b) => a._km - b._km);
  } else {
    list.sort((a, b) => STATES[a.state][0].localeCompare(STATES[b.state][0]) || b.gem - a.gem || a.name.localeCompare(b.name));
  }
  return list;
}

function refresh() {
  const list = filtered();
  $("#count").textContent = list.length;
  const src = map.getSource("dest");
  if (src) src.setData(fc(list.map((d) => pt(d, { id: d.id, name: d.name, cat: d.cats[0], gem: d.gem ? 1 : 0, off: 0 }))));
  renderList(list);
  renderAds();
}

// ─────────────────────────── rendering ───────────────────────────
const catIcons = (d) => d.cats.map((c) => CATEGORIES[c].icon).join(" ");
const stateName = (code) => STATES[code][{ en: 0, kn: 1, hi: 2 }[S.lang]];
const monthRange = (d) => (d.months.length === 12 ? "All year" : `${MONTHS[S.lang][d.months[0] - 1]} – ${MONTHS[S.lang][d.months.at(-1) - 1]}`);
const accessLabel = (a) => ({ e: t("easy"), m: t("moderate"), t: t("tough") })[a];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function renderList(list) {
  const ol = $("#list");
  if (!list.length) { ol.innerHTML = `<li class="fine">${t("noResults")}</li>`; return; }
  ol.innerHTML = list.slice(0, 250).map((d) => `
    <li data-id="${d.id}">
      <div class="t"><span>${esc(d.name)}</span>${d.gem ? `<span class="badge">💎 ${t("gem")}</span>` : ""}</div>
      <div class="s">${catIcons(d)} · ${stateName(d.state)}${S.from ? ` · ${d._km} ${t("kmAway")}` : ""} · ${monthRange(d)}</div>
    </li>`).join("");
}

function nearbyOf(d, n = 5, maxKm = 160) {
  return DESTINATIONS.filter((x) => x.id !== d.id)
    .map((x) => [x, roadKm(d, x)]).filter(([, k]) => k <= maxKm)
    .sort((a, b) => a[1] - b[1]).slice(0, n);
}

function openPopup(d, fly = true) {
  if (fly) flyTo(d);
  const pinned = S.pinned.some((p) => p.id === d.id);
  const near = nearbyOf(d);
  const inSeason = S.month ? d.months.includes(S.month) : null;
  const html = `
    <div class="pop">
      <h3>${esc(d.name)}</h3>
      <div class="meta">${stateName(d.state)} · ${accessLabel(d.access)}${d.gem ? ` · 💎 ${t("gem")}` : ""}</div>
      <div>${esc(d.note)}</div>
      <div class="cats">${d.cats.map((c) => `${CATEGORIES[c].icon} ${CATEGORIES[c][S.lang]}`).join(" · ")}</div>
      <div class="meta">${t("bestTime")}: ${monthRange(d)}
        ${inSeason === null ? "" : `<span class="badge ${inSeason ? "" : "off"}">${inSeason ? t("inSeason") : t("offSeason")}</span>`}
        ${S.from ? ` · ${roadKm(S.from, d)} ${t("kmAway")}` : ""}</div>
      <div class="btns">
        <button class="add" data-act="pin" data-id="${d.id}">${pinned ? t("removeTrip") : t("addTrip")}</button>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}" target="_blank" rel="noopener">🧭 Maps</a>
      </div>
      ${near.length ? `<div class="near"><b>${t("nearby")}:</b> ${near.map(([x, k]) => `<a data-act="go" data-id="${x.id}">${esc(x.name)}${x.gem ? " 💎" : ""} (${k} km)</a>`).join(", ")}</div>` : ""}
      <div class="ad-slot" data-slot="popup" data-state="${d.state}" data-cats="${d.cats.join("")}"></div>
    </div>`;
  popup?.remove();
  popup = new maplibregl.Popup({ offset: 12, maxWidth: "300px" }).setLngLat([d.lng, d.lat]).setHTML(html).addTo(map);
  renderAds(popup.getElement());
  popup.getElement().addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const x = DESTINATIONS[+el.dataset.id];
    if (el.dataset.act === "pin") { togglePin(x); openPopup(x, false); }
    if (el.dataset.act === "go") openPopup(x);
  });
}

function flyTo(d) {
  map.flyTo({ center: [d.lng, d.lat], zoom: S.terrain ? 12.5 : 10, pitch: S.terrain ? 62 : 35, bearing: S.terrain ? -20 : 0, duration: 2200, essential: true });
  if (S.theme === "follow") applyTheme(STATES[d.state][6]);
}

// ─────────────────────────── ads ───────────────────────────
function pickAd(state, cats) {
  const ok = ADS.filter((a) => (!a.states?.length || a.states.includes(state)) && (!a.cats?.length || a.cats.some((c) => cats.includes(c))));
  return ok.length ? ok[Math.floor(Math.random() * ok.length)] : null;
}
function renderAds(root = document) {
  root.querySelectorAll(".ad-slot").forEach((slot) => {
    const st = slot.dataset.state || S.state || "";
    const cats = slot.dataset.cats || [...S.cats].join("");
    const ad = pickAd(st, cats);
    slot.innerHTML = ad
      ? `<a href="${esc(ad.link)}" target="_blank" rel="noopener sponsored"><div class="ad-label">Ad</div><b>${esc(ad.title)}</b><br>${esc(ad.text)}</a>`
      : `<a class="ad-empty" href="mailto:${AD_CONTACT}?subject=${encodeURIComponent("Advertise on sanNchari Bharat")}"><div class="ad-label">Ad</div><b>${t("adHere")}</b> — ${AD_CONTACT}</a>`;
  });
}

// ─────────────────────────── trip ───────────────────────────
function togglePin(d) {
  const i = S.pinned.findIndex((p) => p.id === d.id);
  i >= 0 ? S.pinned.splice(i, 1) : S.pinned.push(d);
  renderPinned();
}
function renderPinned() {
  const ul = $("#pinned");
  ul.innerHTML = S.pinned.length
    ? S.pinned.map((p) => `<li><span>${esc(p.name)} <span class="fine">${stateName(p.state)}</span></span><button data-id="${p.id}">✕</button></li>`).join("")
    : `<li class="fine">${t("noPinned")}</li>`;
}

function tripStart() {
  const v = $("#tripFrom").value;
  if (v === "me" && S.from) return S.from;
  const c = CITIES[+v] || CITIES[0];
  return { name: c[0], lat: c[1], lng: c[2] };
}

function runPlanner() {
  const start = tripStart();
  const days = Math.max(2, Math.min(90, +$("#tripDays").value || 30));
  const startDate = $("#tripDate").value ? new Date($("#tripDate").value + "T00:00") : new Date();
  const pool = DESTINATIONS.filter((d) => matches(d, { ignore: ["q", "region", "state", "month"] }))
    .filter((d) => !S.tripRegions.size || S.tripRegions.has(STATES[d.state][3]));
  const wantCats = S.cats.size ? S.cats : new Set(groupRule()?.cats || ["H", "D", "C", "M", "W", "S"]);
  const res = planTrip({ start, days, startDate, pace: $("#tripPace").value, pool, pinned: S.pinned, wantCats });
  S.lastTrip = { ...res, start, startDate, days };
  renderItinerary(S.lastTrip);
  drawTrip(S.lastTrip);
  writeHash();
}

function dateFor(startDate, day) {
  const d = new Date(startDate.getTime() + (day - 1) * 864e5);
  return `${d.getDate()} ${MONTHS[S.lang][d.getMonth()]}`;
}

function renderItinerary(trip) {
  const { plan, totalKm, stops, start, startDate } = trip;
  if (!plan.length) { $("#itinerary").innerHTML = `<p class="fine">${t("noResults")}</p>`; return; }
  $("#itinerary").innerHTML = `
    <div class="itin-sum"><b>${start.name}</b> → ${stops.length} ${t("stops")} · ${t("totalDistance")}: <b>${totalKm.toLocaleString("en-IN")} km</b></div>
    <ol class="itin">${plan.map((p) => p.type === "travel"
      ? `<li class="travel"><div class="d">${t("day")} ${p.day} · ${dateFor(startDate, p.day)}</div>🚆 ${t("travelDay")}: ${esc(p.from)} → ${esc(p.to)}${p.km ? ` (~${p.km} km, ${p.mode})` : ""}</li>`
      : `<li data-id="${p.dest.id}"><div class="d">${t("day")} ${p.day}${p.nights > 1 ? `–${p.day + p.nights - 1}` : ""} · ${dateFor(startDate, p.day)}${p.km ? ` · ${p.km} km` : ""}</div>
           <b>${esc(p.dest.name)}</b> <span class="fine">${stateName(p.dest.state)}</span> ${catIcons(p.dest)}
           ${p.inSeason ? "" : `<span class="badge off">${t("offSeason")}</span>`}${p.dest.gem ? " 💎" : ""}</li>`).join("")}
    </ol>
    <div class="btn-row">
      <button class="ghost" id="copyTrip">${t("copy")}</button>
      <button class="ghost" id="printTrip">${t("print")}</button>
      <button class="ghost" id="shareTrip">${t("share")}</button>
    </div>`;
}

function drawTrip({ stops, start }) {
  if (!map.getSource("route")) return;
  const coords = [[start.lng, start.lat], ...stops.map((d) => [d.lng, d.lat])];
  map.getSource("route").setData(fc([{ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} }]));
  map.getSource("stops").setData(fc(stops.map((d, i) => pt(d, { id: d.id, n: i + 1 }))));
  if (coords.length > 1) {
    const b = coords.reduce((bb, c) => bb.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
    map.fitBounds(b, { padding: isMobile() ? 40 : { top: 60, bottom: 60, left: 60, right: 60 }, pitch: 0, duration: 2000, maxZoom: 7 });
  }
}

function tripText() {
  const tr = S.lastTrip; if (!tr) return "";
  const lines = [`sanNchari Bharat — ${tr.days}-day trip from ${tr.start.name}`, ""];
  for (const p of tr.plan) {
    lines.push(p.type === "travel"
      ? `Day ${p.day} (${dateFor(tr.startDate, p.day)}): Travel ${p.from} → ${p.to}${p.km ? ` ~${p.km} km` : ""}`
      : `Day ${p.day}${p.nights > 1 ? `-${p.day + p.nights - 1}` : ""} (${dateFor(tr.startDate, p.day)}): ${p.dest.name}, ${STATES[p.dest.state][0]}`);
  }
  lines.push("", `Approx. road distance: ${tr.totalKm} km`, location.href);
  return lines.join("\n");
}

// Share link: trip settings go in the URL hash only (never sent to a server).
function writeHash() {
  const h = new URLSearchParams({
    from: $("#tripFrom").value === "me" ? "0" : $("#tripFrom").value,
    days: $("#tripDays").value, date: $("#tripDate").value, pace: $("#tripPace").value,
    regions: [...S.tripRegions].join(","), pins: S.pinned.map((p) => p.id).join(","),
    cats: [...S.cats].join(""), groups: [...S.groups].join(","), lang: S.lang,
  });
  history.replaceState(null, "", "#" + h.toString());
}
function readHash() {
  if (!location.hash.includes("days=")) return false;
  const h = new URLSearchParams(location.hash.slice(1));
  S._tripFrom = h.get("from") || "0";
  $("#tripDays").value = h.get("days") || 30;
  if (h.get("date")) $("#tripDate").value = h.get("date");
  $("#tripPace").value = h.get("pace") || "normal";
  (h.get("regions") || "").split(",").filter(Boolean).forEach((r) => S.tripRegions.add(r));
  (h.get("pins") || "").split(",").filter(Boolean).forEach((id) => DESTINATIONS[+id] && S.pinned.push(DESTINATIONS[+id]));
  (h.get("cats") || "").split("").filter((c) => CATEGORIES[c]).forEach((c) => S.cats.add(c));
  (h.get("groups") || "").split(",").filter((g) => GROUPS[g]).forEach((g) => S.groups.add(g));
  if (STR[h.get("lang")]) S.lang = h.get("lang");
  return true;
}

// ─────────────────────────── festivals ───────────────────────────
let festMonth = new Date().getMonth() + 1;
function renderFestivals() {
  $("#festMonths").innerHTML = MONTHS[S.lang].map((m, i) => `<button class="chip ${i + 1 === festMonth ? "on" : ""}" data-m="${i + 1}">${m}</button>`).join("");
  const list = FESTIVALS.filter((f) => f[2].includes(festMonth));
  $("#festList").innerHTML = list.map((f) => `
    <li data-place="${esc(f[3])}">
      <div class="t"><span>🎉 ${esc(f[0])}</span>${f[4] ? `<span class="badge">${esc(f[4])}</span>` : ""}</div>
      <div class="s">${stateName(f[1])} · ${esc(f[3])}</div>
    </li>`).join("") || `<li class="fine">—</li>`;
}

// ─────────────────────────── controls ───────────────────────────
function fillSelects() {
  const keepState = S.state, keepRegion = S.region;
  $("#region").innerHTML = `<option value="">${t("allRegions")}</option>` + REGIONS.map((r) => `<option value="${r}">${REGION_NAMES[S.lang][r]}</option>`).join("");
  const codes = Object.keys(STATES).filter((c) => !S.region || STATES[c][3] === S.region).sort((a, b) => STATES[a][0].localeCompare(STATES[b][0]));
  $("#state").innerHTML = `<option value="">${t("allIndia")}</option>` + codes.map((c) => `<option value="${c}">${stateName(c)}</option>`).join("");
  $("#region").value = keepRegion; $("#state").value = codes.includes(keepState) ? keepState : "";
  $("#month").innerHTML = `<option value="0">${t("anyMonth")}</option>` + MONTHS[S.lang].map((m, i) => `<option value="${i + 1}">${m}</option>`).join("");
  $("#month").value = S.month;
  const cityOpts = CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join("");
  const me = S.from?.name === "📍" ? `<option value="me">📍</option>` : "";
  const fromVal = $("#from").value, tripVal = $("#tripFrom").value;
  $("#from").innerHTML = `<option value="">—</option>` + me + cityOpts;
  $("#from").value = fromVal;
  $("#tripFrom").innerHTML = me + cityOpts;
  $("#tripFrom").value = tripVal || S._tripFrom || "0";
  $("#theme").innerHTML = `<option value="follow">${t("followState")}</option>` + Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v.en}</option>`).join("");
  $("#theme").value = S.theme;
}

function fillChips() {
  $("#cats").innerHTML = Object.entries(CATEGORIES).map(([k, v]) => `<button class="chip ${S.cats.has(k) ? "on" : ""}" data-k="${k}">${v.icon} ${v[S.lang]}</button>`).join("");
  $("#groups").innerHTML = Object.entries(GROUPS).map(([k, v]) => `<button class="chip ${S.groups.has(k) ? "on" : ""}" data-k="${k}">${v[S.lang]}</button>`).join("");
  $("#tripRegions").innerHTML = REGIONS.map((r) => `<button class="chip ${S.tripRegions.has(r) ? "on" : ""}" data-k="${r}">${REGION_NAMES[S.lang][r]}</button>`).join("");
}

function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll("[data-i]").forEach((el) => (el.textContent = t(el.dataset.i)));
  $("#search").placeholder = t("search");
  $("#adMail").href = `mailto:${AD_CONTACT}?subject=${encodeURIComponent("Advertise on sanNchari Bharat")}`;
  fillSelects(); fillChips(); renderPinned(); renderFestivals(); refresh();
  if (S.lastTrip) renderItinerary(S.lastTrip);
}

function bind() {
  $("#lang").addEventListener("change", (e) => { S.lang = e.target.value; applyLang(); });
  $("#search").addEventListener("input", (e) => { S.q = e.target.value.trim(); refresh(); });
  $("#region").addEventListener("change", (e) => { S.region = e.target.value; S.state = ""; fillSelects(); refresh(); });
  $("#state").addEventListener("change", (e) => {
    S.state = e.target.value; refresh();
    if (S.state) {
      const s = STATES[S.state];
      map.flyTo({ center: [s[5], s[4]], zoom: ["DL", "CH", "PY", "GA"].includes(S.state) ? 8.5 : 5.8, pitch: 20, duration: 2000 });
      if (S.theme === "follow") applyTheme(s[6]);
    }
  });
  $("#month").addEventListener("change", (e) => { S.month = +e.target.value; refresh(); });
  $("#gems").addEventListener("change", (e) => { S.gems = e.target.checked; refresh(); });
  $("#from").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === "") S.from = null;
    else if (v !== "me") { const c = CITIES[+v]; S.from = { name: c[0], lat: c[1], lng: c[2] }; }
    refresh();
  });
  $("#geo").addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      S.from = { name: "📍", lat: p.coords.latitude, lng: p.coords.longitude };
      fillSelects(); $("#from").value = "me"; $("#tripFrom").value = "me"; refresh();
    });
  });
  $("#reset").addEventListener("click", () => {
    Object.assign(S, { q: "", region: "", state: "", month: 0, gems: false, from: null });
    S.cats.clear(); S.groups.clear();
    $("#search").value = ""; $("#gems").checked = false; $("#from").value = "";
    fillSelects(); fillChips(); refresh();
  });
  const chipToggle = (sel, set, after) => $(sel).addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    set.has(b.dataset.k) ? set.delete(b.dataset.k) : set.add(b.dataset.k);
    b.classList.toggle("on"); after();
  });
  chipToggle("#cats", S.cats, refresh);
  chipToggle("#groups", S.groups, refresh);
  chipToggle("#tripRegions", S.tripRegions, () => {});

  $("#list").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]"); if (!li) return;
    openPopup(DESTINATIONS[+li.dataset.id]);
    if (isMobile()) $("#panel").classList.remove("open");
  });
  $("#festMonths").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; festMonth = +b.dataset.m; renderFestivals(); });
  $("#festList").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-place]"); const d = li && byName.get(li.dataset.place); if (!d) return;
    openPopup(d); if (isMobile()) $("#panel").classList.remove("open");
  });

  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tabpane").forEach((x) => x.classList.remove("active"));
    b.classList.add("active"); $(`#tab-${b.dataset.tab}`).classList.add("active");
  }));

  $("#pinned").addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) togglePin(DESTINATIONS[+b.dataset.id]); });
  $("#planBtn").addEventListener("click", runPlanner);
  $("#clearTrip").addEventListener("click", () => {
    S.pinned = []; S.lastTrip = null; renderPinned(); $("#itinerary").innerHTML = "";
    map.getSource("route")?.setData(fc([])); map.getSource("stops")?.setData(fc([]));
    history.replaceState(null, "", location.pathname + location.search);
  });
  $("#itinerary").addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) { openPopup(DESTINATIONS[+li.dataset.id]); if (isMobile()) $("#panel").classList.remove("open"); return; }
    if (e.target.id === "copyTrip") { await navigator.clipboard?.writeText(tripText()); e.target.textContent = t("copied"); }
    if (e.target.id === "printTrip") window.print();
    if (e.target.id === "shareTrip") {
      writeHash();
      if (navigator.share) navigator.share({ title: "sanNchari Bharat trip", text: tripText().split("\n")[0], url: location.href }).catch(() => {});
      else { await navigator.clipboard?.writeText(location.href); e.target.textContent = t("copied"); }
    }
  });

  $("#theme").addEventListener("change", (e) => { S.theme = e.target.value; applyTheme(S.theme === "follow" ? (S.state ? STATES[S.state][6] : "yakshagana") : S.theme); });
  $("#mapStyle").addEventListener("change", (e) => { S.mapStyle = e.target.value; popup?.remove(); map.setStyle(buildStyle(S.mapStyle)); });
  $("#terrain").addEventListener("change", (e) => { S.terrain = e.target.checked; setTerrain(S.terrain); });
  $("#menuBtn").addEventListener("click", () => $("#panel").classList.toggle("open"));
  $("#flyIndia").addEventListener("click", () => { popup?.remove(); map.flyTo({ center: [80.5, 22], zoom: isMobile() ? 3.2 : 3.9, pitch: 0, bearing: 0, duration: 2000 }); });
}

// ─────────────────────────── boot ───────────────────────────
applyTheme("yakshagana");
$("#tripDate").value = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const hadTrip = readHash();
$("#lang").value = S.lang;
bind();
applyLang();
if (isMobile()) $("#panel").classList.add("open");
if (hadTrip) {
  document.querySelector('.tab[data-tab="trip"]').click();
  runPlanner();                      // the route is drawn as soon as the map style is ready
}
