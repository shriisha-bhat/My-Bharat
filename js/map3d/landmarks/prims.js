/**
 * Primitive factories and the shared palette for the low-poly landmark models.
 * A model is a list of parts: [geometry, colourHex, x, y, z]; see landmarks/index.js.
 */
import * as THREE from 'three';

export const Bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const Cy = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 10);
export const Co = (r, h, n) => new THREE.ConeGeometry(r, h, n || 10);
export const Sp = (r) => new THREE.SphereGeometry(r, 10, 8);
/** Dome: the upper half of a sphere. */
export const Dm = (r) => new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);

/** Stone, gold, red, green, grey, water. */
export const ST = 0xd9d2bf;
export const GD = 0xe0b030;
export const RD = 0xb5432e;
export const GN = 0x3f7d3a;
export const GR = 0x8d8778;
export const WT = 0x4a9fd4;
