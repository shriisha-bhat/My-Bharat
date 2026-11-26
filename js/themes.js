// Art-form themes. Each one is a colour palette plus a simple geometric motif drawn in CSS,
// inspired by (not copied from) a traditional art form of the region.
export const THEMES = {
  yakshagana:  { en: "Yakshagana · Karnataka",  bg: "#1a0d05", panel: "#2a1408", ink: "#fbe9c6", accent: "#d4141c", accent2: "#f6b70f", motif: "crown" },
  kathakali:   { en: "Kathakali · Kerala",      bg: "#06180f", panel: "#0d2a1a", ink: "#f3f0e4", accent: "#1f9d55", accent2: "#e4372c", motif: "dots" },
  kolam:       { en: "Kolam · Tamil Nadu",      bg: "#2b120b", panel: "#3d1b10", ink: "#fff8ee", accent: "#c4572e", accent2: "#ffffff", motif: "kolam" },
  kalamkari:   { en: "Kalamkari · Andhra & Telangana", bg: "#0f1326", panel: "#1a1f38", ink: "#f2e8d5", accent: "#a63a24", accent2: "#d9a441", motif: "lines" },
  warli:       { en: "Warli · Maharashtra",     bg: "#3b2417", panel: "#4c2f1e", ink: "#fffaf0", accent: "#ffffff", accent2: "#d98c4a", motif: "warli" },
  bandhani:    { en: "Bandhani · Gujarat & Rajasthan", bg: "#2a0619", panel: "#3e0b26", ink: "#fff3d6", accent: "#ff3d7f", accent2: "#ffc61a", motif: "dots" },
  gond:        { en: "Gond · Madhya Pradesh",   bg: "#0c1a1f", panel: "#13282f", ink: "#f5f2e7", accent: "#f0a202", accent2: "#16a6a1", motif: "dots" },
  chikankari:  { en: "Chikankari · Uttar Pradesh", bg: "#1d2328", panel: "#2a3238", ink: "#fbfbf7", accent: "#d9c6a5", accent2: "#9fc5c0", motif: "lines" },
  aipan:       { en: "Aipan · Himalayas",       bg: "#2c0a07", panel: "#40120c", ink: "#fff6ea", accent: "#c0392b", accent2: "#ffffff", motif: "kolam" },
  phulkari:    { en: "Phulkari · Punjab & Haryana", bg: "#260a11", panel: "#3a101a", ink: "#fff1dc", accent: "#ff7a00", accent2: "#e0218a", motif: "crown" },
  madhubani:   { en: "Madhubani · Bihar & Jharkhand", bg: "#1b1208", panel: "#2b1d0d", ink: "#fff4d6", accent: "#e0301e", accent2: "#f7c600", motif: "lines" },
  pattachitra: { en: "Pattachitra · Odisha & Bengal", bg: "#24100a", panel: "#361911", ink: "#fbeed3", accent: "#c8102e", accent2: "#e8a33d", motif: "crown" },
  bihu:        { en: "Muga & Bihu · North-East", bg: "#1d1408", panel: "#2c1f0c", ink: "#fff5e1", accent: "#d32f2f", accent2: "#e9c46a", motif: "lines" },
};

const MOTIFS = {
  crown: (a, b) => `repeating-linear-gradient(135deg, ${a} 0 6px, transparent 6px 12px), repeating-linear-gradient(45deg, ${b} 0 6px, transparent 6px 12px)`,
  dots:  (a, b) => `radial-gradient(circle at 25% 50%, ${b} 2.5px, transparent 3px) 0 0/14px 14px, radial-gradient(circle at 75% 50%, ${a} 2.5px, transparent 3px) 7px 7px/14px 14px`,
  kolam: (a, b) => `radial-gradient(circle, ${b} 1.6px, transparent 2px) 0 0/12px 12px, repeating-linear-gradient(45deg, transparent 0 8px, ${a} 8px 9px)`,
  lines: (a, b) => `repeating-linear-gradient(90deg, ${a} 0 3px, transparent 3px 7px, ${b} 7px 9px, transparent 9px 14px)`,
  warli: (a, b) => `linear-gradient(135deg, transparent 45%, ${a} 45% 55%, transparent 55%) 0 0/16px 16px, linear-gradient(45deg, transparent 45%, ${b} 45% 55%, transparent 55%) 0 0/16px 16px`,
};

export function applyTheme(id) {
  const t = THEMES[id] || THEMES.yakshagana;
  const r = document.documentElement.style;
  r.setProperty("--bg", t.bg);
  r.setProperty("--panel", t.panel);
  r.setProperty("--ink", t.ink);
  r.setProperty("--accent", t.accent);
  r.setProperty("--accent2", t.accent2);
  r.setProperty("--motif", MOTIFS[t.motif](t.accent, t.accent2));
  document.documentElement.dataset.theme = id;
}
