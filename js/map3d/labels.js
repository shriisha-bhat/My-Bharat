// Text sprites for the relief: district names (zoomed out) and place names (zoomed in).
import * as THREE from "three";
import { px, pz } from "./proj.js";

export function label(txt, lon, lat, size, color, yAt) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), f = "600 44px 'Baloo Tamma 2', Mukta, 'Noto Sans', sans-serif";
  x.font = f;
  const w = Math.ceil(x.measureText(txt).width) + 16;
  c.width = w; c.height = 68;
  x.font = f; x.textBaseline = "middle"; x.lineWidth = 7; x.strokeStyle = "rgba(8,18,24,.9)";
  x.strokeText(txt, 8, 36); x.fillStyle = color; x.fillText(txt, 8, 36);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, sizeAttenuation: false }));
  s.scale.set((size * w) / 60, (size * 68) / 60, 1);
  s.position.set(px(lon), 0, pz(lat));
  s.userData.hm = yAt(lon, lat);
  s.renderOrder = 5;
  return s;
}

export function disposeSprite(s) { s.material.map.dispose(); s.material.dispose(); }
