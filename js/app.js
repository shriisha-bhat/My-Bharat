import { STATES, REGIONS } from "../data/states.js";
import { DESTINATIONS, CATEGORIES, GROUPS } from "../data/destinations.js";
import { FESTIVALS } from "../data/festivals.js";
import { CITIES } from "../data/cities.js";
import { ADS, AD_CONTACT } from "../data/ads.js";
import { STR, MONTHS, REGION_NAMES } from "./i18n.js";
import { THEMES, applyTheme } from "./themes.js";
import { planTrip, roadKm } from "./planner.js";
import { STATE_SHAPES } from "../data/india-states.js";
import { PROFILES } from "../data/state-profiles.js";

// ─────────────────────────── state ───────────────────────────
// Everything lives in memory only. No cookies, no localStorage, no analytics.
const S = {
  lang: "en",
  q: "", region: "", state: "", month: 0, gems: false,
  cats: new Set(), groups: new Set(),
  from: null,                       // {name, lat, lng}
  pinned: [],                       // destination objects
  tripRegions: new Set(),
  theme: "follow", mapStyle: "satellite", terrain: false, states3d: true, view: "3d", diet: "both", tripStates: [],
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

  // 3D India: every state is a raised block; the chosen one stands taller and the rest dim.
  map.addSource("states", { type: "geojson", data: STATE_SHAPES, promoteId: "code" });
  map.addSource("state-names", { type: "geojson", data: fc(Object.entries(STATES).map(([code, s]) =>
    ({ type: "Feature", geometry: { type: "Point", coordinates: [s[5], s[4]] }, properties: { code } }))) });
  map.addLayer({ id: "state-3d", type: "fill-extrusion", source: "states", maxzoom: 7.5,
    paint: { "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.82, 5.5, 0.6, 7.5, 0] } });
  map.addLayer({ id: "state-line", type: "line", source: "states",
    paint: { "line-color": "#fff3d6", "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 8, 0.25], "line-width": 0.8 } });
  map.addLayer({ id: "state-sel-line", type: "line", source: "states", filter: ["==", ["get", "code"], ""],
    paint: { "line-color": "#ffd21f", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2, 9, 3.5] } });
  map.addLayer({ id: "state-name", type: "symbol", source: "state-names", minzoom: 3.6, maxzoom: 6.5,
    layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 3.6, 10, 6, 14],
      "text-allow-overlap": false, "text-padding": 2 },
    paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,.75)", "text-halo-width": 1.6 } });
  paintStates();

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

// ─────────────────────────── 3D states ───────────────────────────
let hoverCode = null;
const SHAPE_BY = new Map(STATE_SHAPES.features.map((f) => [f.properties.code, f]));
function stateBounds(code) {
  const b = new maplibregl.LngLatBounds();
  const walk = (c) => (typeof c[0] === "number" ? b.extend(c) : c.forEach(walk));
  walk(SHAPE_BY.get(code).geometry.coordinates);
  return b;
}
function paintStates() {
  if (!map.getLayer("state-3d")) return;
  const sel = S.state, on = S.states3d;
  const hover = ["==", ["get", "code"], hoverCode || ""];
  map.setLayoutProperty("state-3d", "visibility", on ? "visible" : "none");
  map.setLayoutProperty("state-name", "visibility", on ? "visible" : "none");
  map.setPaintProperty("state-3d", "fill-extrusion-color", ["case", hover, "#ffd21f",
    sel ? ["case", ["==", ["get", "code"], sel], ["get", "c"], "#2a2a2a"] : ["get", "c"]]);
  map.setPaintProperty("state-3d", "fill-extrusion-height", ["case",
    sel ? ["==", ["get", "code"], sel] : false, 60000, hover, 34000, sel ? 6000 : 22000]);
  map.setFilter("state-sel-line", ["==", ["get", "code"], sel || ""]);
  map.getSource("state-names").setData(fc(Object.entries(STATES).map(([code, s]) => ({ type: "Feature",
    geometry: { type: "Point", coordinates: [s[5], s[4]] }, properties: { code, label: stateName(code) } }))));
}
function selectState(code, { fly = true, from3d = false } = {}) {
  S.state = code || "";
  if (S.state && S.region && STATES[S.state][3] !== S.region) S.region = "";
  fillSelects(); refresh(); paintStates(); renderGuide();
  if (M3 && !from3d) { closeCard(); S.state ? M3.open(S.state) : M3.globe(); }
  if (!S.state) return;
  popup?.remove();
  if (S.theme === "follow" && from3d) applyTheme(STATES[S.state][6]);
  if (fly && S.view === "sat") map.fitBounds(stateBounds(S.state), { padding: isMobile() ? 30 : 70, pitch: 45, bearing: -10, maxZoom: 8.5, duration: 2200 });
  if (S.theme === "follow") applyTheme(STATES[S.state][6]);
}
// Globe projection can't hit-test extruded shapes, so find the state under the cursor ourselves.
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const SHAPE_BOX = STATE_SHAPES.features.map((f) => [f, stateBounds(f.properties.code)]);
function stateAt(point) {
  if (!S.states3d || map.getZoom() > 7.5) return null;
  if (map.queryRenderedFeatures(point, { layers: ["dest-dot", "stop-num"] }).length) return null;
  const { lng, lat } = map.unproject(point);
  for (const [f, b] of SHAPE_BOX) {
    if (lng < b.getWest() || lng > b.getEast() || lat < b.getSouth() || lat > b.getNorth()) continue;
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of polys) if (inRing(lng, lat, p[0]) && !p.slice(1).some((h) => inRing(lng, lat, h))) return f.properties.code;
  }
  return null;
}
const tip = document.createElement("div");
tip.className = "state-tip"; tip.hidden = true; document.body.append(tip);
function setHover(code) {
  if (code === hoverCode) return;
  hoverCode = code;
  paintStates();
}
map.on("mousemove", (e) => {
  if (!map.getSource("states") || map.isMoving()) return;
  const code = stateAt(e.point);
  setHover(code);
  if (!code) { tip.hidden = true; if (!map.queryRenderedFeatures(e.point, { layers: ["dest-dot", "stop-num"] }).length) map.getCanvas().style.cursor = ""; return; }
  map.getCanvas().style.cursor = "pointer";
  const count = DESTINATIONS.filter((d) => d.state === code).length;
  tip.textContent = `${stateName(code)} · ${count} ${t("results")} — ${t("tapState")}`;
  tip.hidden = false;
  tip.style.transform = `translate(${e.originalEvent.clientX + 14}px, ${e.originalEvent.clientY + 14}px)`;
});
map.getCanvas().addEventListener("mouseleave", () => { setHover(null); tip.hidden = true; });
map.on("click", (e) => {
  const code = stateAt(e.point);
  if (!code) return;
  setHover(null); tip.hidden = true;
  selectState(code);
});

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
  M3?.sync(list.map((d) => d.id));
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
  if (S.view === "3d" && M3) return openCard(d, fly);
  if (fly) flyTo(d);
  popup?.remove();
  popup = new maplibregl.Popup({ offset: 12, maxWidth: "300px" }).setLngLat([d.lng, d.lat]).setHTML(popHTML(d)).addTo(map);
  renderAds(popup.getElement());
  popup.getElement().addEventListener("click", popClick);
}
function popClick(e) {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const x = DESTINATIONS[+el.dataset.id];
  if (el.dataset.act === "pin") { togglePin(x); openPopup(x, false); }
  if (el.dataset.act === "go") openPopup(x);
}
// 3D view: the same card, docked over the relief, while the camera flies to the landmark
function openCard(d, fly = true) {
  const card = $("#card3d");
  card.innerHTML = `<button class="x" aria-label="Close">×</button>${popHTML(d)}`;
  card.hidden = false;
  renderAds(card);
  if (fly) M3.focus(d);
  if (S.theme === "follow") applyTheme(STATES[d.state][6]);
}
function closeCard() { const c = $("#card3d"); if (c) { c.hidden = true; c.innerHTML = ""; } M3?.clearSel(); }
function popHTML(d) {
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
  return html;
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
  const res = S.tripStates.length
    ? planChain({ start, days, startDate, pace: $("#tripPace").value, wantCats })
    : planTrip({ start, days, startDate, pace: $("#tripPace").value, pool, pinned: S.pinned, wantCats });
  S.lastTrip = { ...res, start, startDate, days };
  renderItinerary(S.lastTrip);
  drawTrip(S.lastTrip);
  writeHash();
}

// Connected states: the days are shared out across the chosen states in order (at least two
// each, the rest by how many places a state has), and each state is planned in turn, starting
// where the last one ended. Days a state does not use roll over to the next.
function planChain({ start, days, startDate, pace, wantCats }) {
  for (const p of S.pinned) if (!S.tripStates.includes(p.state)) S.tripStates.push(p.state);
  renderTripStates();
  const chain = S.tripStates;
  const base = DESTINATIONS.filter((d) => matches(d, { ignore: ["q", "region", "state", "month"] }));
  const w = chain.map((c) => Math.sqrt(Math.max(1, base.filter((d) => d.state === c).length)));
  const W = w.reduce((a, b) => a + b, 0);
  let alloc;
  if (days >= chain.length * 2) {
    const rest = days - chain.length * 2, share = w.map((x) => (rest * x) / W);
    alloc = share.map((x) => 2 + Math.floor(x));
    let left = days - alloc.reduce((a, b) => a + b, 0);
    share.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { alloc[i]++; left--; } });
  } else alloc = chain.map((_, i) => (i < days ? 1 : 0));
  const plan = [], stops = [];
  let here = start, used = 0, carry = 0, totalKm = 0;
  chain.forEach((code, i) => {
    const d = alloc[i] + carry;
    if (d <= 0) return;
    const res = planTrip({ start: here, days: d, startDate: new Date(startDate.getTime() + used * 864e5), pace,
      pool: base.filter((x) => x.state === code), pinned: S.pinned.filter((x) => x.state === code), wantCats });
    const last = res.plan.reduce((m, p) => Math.max(m, p.day + (p.nights || 1) - 1), 0);
    res.plan.forEach((p) => { p.day += used; p.state = code; if (p.type === "stay") p.inSeason = p.dest.months.includes(new Date(startDate.getTime() + (p.day - 1) * 864e5).getMonth() + 1); });
    plan.push(...res.plan); stops.push(...res.stops); totalKm += res.totalKm;
    used += last; carry = d - last;
    if (res.stops.length) here = res.stops.at(-1);
  });
  return { plan, stops, totalKm, chain: [...chain], tight: days < chain.length * 2 };
}

// ─────────────────────────── state guide & food ───────────────────────────
const dishes = (list) => `<ul class="dishes">${list.map(([n, d]) => `<li><b>${esc(n)}</b> <span>${esc(d)}</span></li>`).join("")}</ul>`;
function guideHTML(code) {
  const p = PROFILES[code]; if (!p) return "";
  const inTrip = S.tripStates.includes(code), nm = stateName(code);
  const chips = (a) => `<div class="g-chips">${a.map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
  return `<div class="g-head"><h3>${esc(nm)}</h3>
      <button class="g-add ${inTrip ? "on" : ""}" data-act="trip" data-code="${code}">${(inTrip ? t("inTrip") : t("addToTrip")).replace("{s}", esc(nm))}</button></div>
    <p class="g-look">${esc(p.look)}</p>
    <dl><dt>${t("gLang")}</dt><dd>${esc(p.lang)}</dd><dt>${t("gDress")}</dt><dd>${esc(p.dress)}</dd></dl>
    <div class="g-sec">${t("gArts")}</div>${chips(p.arts)}
    <div class="g-sec">${t("gFest")}</div>${chips(p.fest)}
    <div class="g-sec">🍛 ${t("gFood")}</div>
    ${S.diet !== "non" ? `<div class="food veg"><div class="ft">${t("vegNote")}</div>${dishes(p.veg)}</div>` : ""}
    ${S.diet !== "veg" ? `<div class="food non"><div class="ft">${t("nonNote")}</div>${dishes(p.non)}</div>` : ""}`;
}
let guideOpen = true;
function renderGuide() {
  const g = $("#stateGuide");
  g.hidden = !S.state;
  g.innerHTML = S.state ? guideHTML(S.state) : "";
  const code = M3?.current(), g3 = $("#guide3d");
  g3.hidden = !(S.view === "3d" && code);
  if (!g3.hidden) {
    $("#guide3dBtn").textContent = t("guidePill").replace("{s}", stateName(code));
    $("#guide3dBody").hidden = !guideOpen;
    $("#guide3dBtn").hidden = guideOpen;
    $("#guide3dBody").innerHTML = `<button class="x" data-act="hide" aria-label="${t("hide")}">×</button>${guideHTML(code)}`;
  }
}
/** A few dishes for a state, by the traveller's food preference. */
function eatLine(code, n = 2) {
  const p = PROFILES[code]; if (!p) return "";
  const v = p.veg.slice(0, n).map((d) => d[0]), nv = p.non.slice(0, n).map((d) => d[0]);
  return [S.diet !== "non" && v.length ? `🥦 ${v.join(", ")}` : "", S.diet !== "veg" && nv.length ? `🍗 ${nv.join(", ")}` : ""].filter(Boolean).join(" · ");
}
/** One dish to try on a given stop, rotating through the state's list. */
function dishFor(code, k) {
  const p = PROFILES[code]; if (!p) return "";
  const list = S.diet === "veg" ? p.veg : S.diet === "non" ? p.non : [...p.veg, ...p.non].sort((a, b) => a[0].localeCompare(b[0]));
  return list.length ? list[k % list.length][0] : "";
}
function setDiet(v) {
  S.diet = v;
  $("#tripDiet").value = v;
  document.querySelectorAll("#diet .chip").forEach((b) => b.classList.toggle("on", b.dataset.k === v));
  renderGuide();
  if (S.lastTrip) renderItinerary(S.lastTrip);
}

// ─────────────────────────── connected states ───────────────────────────
const NEIGH = (() => {
  const key = (p) => p[0].toFixed(2) + "," + p[1].toFixed(2), pts = new Map(), cen = new Map();
  for (const f of STATE_SHAPES.features) {
    const set = new Set(), polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) for (const p of poly[0]) set.add(key(p));
    pts.set(f.properties.code, set);
    cen.set(f.properties.code, { lat: STATES[f.properties.code][4], lng: STATES[f.properties.code][5] });
  }
  const out = {};
  for (const [a, sa] of pts) {
    out[a] = [];
    for (const [b, sb] of pts) {
      if (a === b) continue;
      let n = 0;
      for (const k of sa) if (sb.has(k) && ++n > 2) break;
      if (n > 2) out[a].push(b);
    }
    // islands have no land neighbours: suggest the nearest states instead
    if (!out[a].length) out[a] = [...cen.keys()].filter((b) => b !== a).sort((x, y) => roadKm(cen.get(a), cen.get(x)) - roadKm(cen.get(a), cen.get(y))).slice(0, 3);
  }
  return out;
})();
function toggleTripState(code) {
  const i = S.tripStates.indexOf(code);
  if (i >= 0) S.tripStates.splice(i, 1); else S.tripStates.push(code);
  renderTripStates(); renderGuide();
}
function renderTripStates() {
  const byName2 = (a, b) => STATES[a][0].localeCompare(STATES[b][0]);
  $("#tripStates").innerHTML = S.tripStates.map((c, i) => `<li data-code="${c}"><span class="n">${i + 1}</span><span class="nm">${esc(stateName(c))}</span>
      ${i ? `<button data-act="up" aria-label="Move up">↑</button>` : ""}<button data-act="rm" aria-label="Remove">✕</button></li>`).join("");
  $("#addState").innerHTML = `<option value="">—</option>` + Object.keys(STATES).filter((c) => !S.tripStates.includes(c)).sort(byName2).map((c) => `<option value="${c}">${esc(stateName(c))}</option>`).join("");
  const last = S.tripStates.at(-1), nd = last ? NEIGH[last].filter((c) => !S.tripStates.includes(c)).sort(byName2) : [];
  $("#nextDoor").innerHTML = nd.length ? `<span class="fine">${t("nextDoor")} · ${esc(stateName(last))}:</span>` + nd.map((c) => `<button class="chip" data-k="${c}">＋ ${esc(stateName(c))}</button>`).join("") : "";
  M3?.setChain(S.tripStates);
}

function dateFor(startDate, day) {
  const d = new Date(startDate.getTime() + (day - 1) * 864e5);
  return `${d.getDate()} ${MONTHS[S.lang][d.getMonth()]}`;
}

/** A heading row in the itinerary whenever the trip enters a new state, with what to eat there. */
let headState = null;
function stateHead(p, k, plan) {
  const code = p.type === "stay" ? p.dest.state : plan.slice(k).find((x) => x.type === "stay")?.dest.state;
  if (!code || code === headState) return "";
  headState = code;
  return `<li class="st-head"><b>📍 ${esc(stateName(code))}</b><div class="fine">${t("eatIn").replace("{s}", esc(stateName(code)))}: ${esc(eatLine(code))}</div></li>`;
}
function renderItinerary(trip) {
  headState = null;
  const { plan, totalKm, stops, start, startDate } = trip;
  if (!plan.length) { $("#itinerary").innerHTML = `<p class="fine">${t("noResults")}</p>`; return; }
  $("#itinerary").innerHTML = `
    <div class="itin-sum"><b>${start.name}</b> → ${stops.length} ${t("stops")} · ${t("totalDistance")}: <b>${totalKm.toLocaleString("en-IN")} km</b></div>
    ${trip.tight ? `<p class="fine warn">${t("fewDays")}</p>` : ""}
    <ol class="itin">${plan.map((p, k) => (stateHead(p, k, plan)) + (p.type === "travel"
      ? `<li class="travel"><div class="d">${t("day")} ${p.day} · ${dateFor(startDate, p.day)}</div>🚆 ${t("travelDay")}: ${esc(p.from)} → ${esc(p.to)}${p.km ? ` (~${p.km} km, ${p.mode})` : ""}</li>`
      : `<li data-id="${p.dest.id}"><div class="d">${t("day")} ${p.day}${p.nights > 1 ? `–${p.day + p.nights - 1}` : ""} · ${dateFor(startDate, p.day)}${p.km ? ` · ${p.km} km` : ""}</div>
           <b>${esc(p.dest.name)}</b> <span class="fine">${stateName(p.dest.state)}</span> ${catIcons(p.dest)}
           ${p.inSeason ? "" : `<span class="badge off">${t("offSeason")}</span>`}${p.dest.gem ? " 💎" : ""}
           ${dishFor(p.dest.state, k) ? `<div class="try">🍽 ${t("tryFood")}: ${esc(dishFor(p.dest.state, k))}</div>` : ""}</li>`)).join("")}
    </ol>
    <div class="btn-row">
      <button class="ghost" id="copyTrip">${t("copy")}</button>
      <button class="ghost" id="printTrip">${t("print")}</button>
      <button class="ghost" id="shareTrip">${t("share")}</button>
    </div>`;
}

function drawTrip({ stops, start }) {
  if (S.view === "3d") setView("sat"); // routes are drawn on the satellite map
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
      : `Day ${p.day}${p.nights > 1 ? `-${p.day + p.nights - 1}` : ""} (${dateFor(tr.startDate, p.day)}): ${p.dest.name}, ${STATES[p.dest.state][0]}${dishFor(p.dest.state, tr.plan.indexOf(p)) ? ` · try ${dishFor(p.dest.state, tr.plan.indexOf(p))}` : ""}`);
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
    states: S.tripStates.join(","), diet: S.diet,
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
  (h.get("states") || "").split(",").filter((c) => STATES[c]).forEach((c) => S.tripStates.push(c));
  if (["veg", "non", "both"].includes(h.get("diet"))) S.diet = h.get("diet");
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
  fillSelects(); fillChips(); renderPinned(); renderFestivals(); refresh(); paintStates();
  if (S.lastTrip) renderItinerary(S.lastTrip);
  M3?.relabel(); exploreLabel();
  $("#diet").innerHTML = ["both", "veg", "non"].map((k) => `<button class="chip ${S.diet === k ? "on" : ""}" data-k="${k}">${{ both: "🍽", veg: "🥦", non: "🍗" }[k]} ${t(k === "non" ? "nonveg" : k)}</button>`).join("");
  $("#tripDiet").value = S.diet;
  renderTripStates(); renderGuide();
}

function bind() {
  $("#lang").addEventListener("change", (e) => { S.lang = e.target.value; applyLang(); });
  $("#search").addEventListener("input", (e) => { S.q = e.target.value.trim(); refresh(); });
  $("#region").addEventListener("change", (e) => { S.region = e.target.value; S.state = ""; fillSelects(); refresh(); paintStates(); });
  $("#state").addEventListener("change", (e) => selectState(e.target.value));
  $("#states3d").addEventListener("change", (e) => { S.states3d = e.target.checked; paintStates(); });
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
    fillSelects(); fillChips(); refresh(); paintStates();
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
  $("#diet").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) setDiet(b.dataset.k); });
  $("#tripDiet").addEventListener("change", (e) => setDiet(e.target.value));
  const guideClick = (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "trip") toggleTripState(b.dataset.code);
    if (b.dataset.act === "hide") { guideOpen = false; renderGuide(); }
  };
  $("#stateGuide").addEventListener("click", guideClick);
  $("#guide3dBody").addEventListener("click", guideClick);
  $("#guide3dBtn").addEventListener("click", () => { guideOpen = true; renderGuide(); });
  $("#addState").addEventListener("change", (e) => { if (e.target.value) toggleTripState(e.target.value); });
  $("#nextDoor").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) toggleTripState(b.dataset.k); });
  $("#tripStates").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const code = b.closest("li").dataset.code, i = S.tripStates.indexOf(code);
    if (b.dataset.act === "rm") S.tripStates.splice(i, 1);
    if (b.dataset.act === "up" && i > 0) [S.tripStates[i - 1], S.tripStates[i]] = [S.tripStates[i], S.tripStates[i - 1]];
    renderTripStates(); renderGuide();
  });
  $("#view3d").addEventListener("click", () => setView("3d"));
  $("#viewSat").addEventListener("click", () => setView("sat"));
  $("#z3globe").addEventListener("click", () => selectState(""));
  $("#z3explore").addEventListener("click", () => { if (!M3) return; if (picked) M3.dive(); else pickOnGlobe("KA"); });
  $("#card3d").addEventListener("click", (e) => { if (e.target.closest(".x")) return closeCard(); popClick(e); });
  $("#flyIndia").addEventListener("click", () => { popup?.remove(); selectState("", { fly: false }); map.flyTo({ center: [80.5, 22], zoom: isMobile() ? 3.2 : 3.9, pitch: 0, bearing: 0, duration: 2000 }); });
}

// ─────────────────────────── 3D view (sanNchari-style) ───────────────────────────
let M3 = null, picked = null;
function setView(v) {
  S.view = v;
  document.body.classList.toggle("sat", v === "sat");
  $("#view3d").classList.toggle("on", v === "3d");
  $("#viewSat").classList.toggle("on", v === "sat");
  if (v === "sat") { closeCard(); map.resize(); if (S.state) map.fitBounds(stateBounds(S.state), { padding: 60, pitch: 45, maxZoom: 8.5, duration: 0 }); }
  else popup?.remove();
  renderGuide();
}
function exploreLabel() {
  $("#z3explore").textContent = picked ? t("z3explore").replace("{s}", stateName(picked)) : t("z3pickIndia");
  $("#z3hint").textContent = t("z3hint");
}
function pickOnGlobe(code) { picked = code; M3?.pick(code); exploreLabel(); }
async function boot3D() {
  try {
    const [{ init3D }, world] = await Promise.all([import("./map3d/index.js"), fetch("data/world.json").then((r) => r.json())]);
    const tip3 = $("#z3tip");
    M3 = init3D({
      stage: $("#stage3d"), canvas: $("#gl3d"), shapes: STATE_SHAPES, world, places: DESTINATIONS, cities: CITIES, stateName, t,
      onPickState: pickOnGlobe,
      onEnterState: (code) => { picked = code; exploreLabel(); guideOpen = true; if (S.state !== code) selectState(code, { fly: false, from3d: true }); else renderGuide(); },
      onGlobe: () => { closeCard(); if (S.state) { S.state = ""; fillSelects(); refresh(); } renderGuide(); },
      onPlace: (id) => openCard(DESTINATIONS[id], true),
      onHover: (code, e) => {
        if (!code || !e) { tip3.hidden = true; return; }
        const n = DESTINATIONS.filter((d) => d.state === code).length;
        tip3.textContent = `${stateName(code)} · ${n} ${t("results")} — ${t("tapState")}`;
        tip3.hidden = false;
        tip3.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
      },
    });
    pickOnGlobe(S.state || "KA");
    M3.setChain(S.tripStates);
    refresh();
    if (S.state) M3.open(S.state);
  } catch (err) {
    console.error(err);
    $(".z3fail").hidden = false;
    setTimeout(() => setView("sat"), 1500);
  }
}

// ─────────────────────────── boot ───────────────────────────
applyTheme("yakshagana");
$("#tripDate").value = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const hadTrip = readHash();
$("#lang").value = S.lang;
bind();
applyLang();
if (isMobile()) $("#panel").classList.add("open");
if (hadTrip) setView("sat"); else boot3D();
if (hadTrip) {
  document.querySelector('.tab[data-tab="trip"]').click();
  runPlanner();                      // the route is drawn as soon as the map style is ready
}
