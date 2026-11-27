/**
 * Landmark registry: one builder per model kind, and `merge()` which flattens a list of parts
 * into a single vertex-coloured BufferGeometry so each place is one draw call.
 */
import * as THREE from 'three';
import soudha from './soudha.js';
import palace from './palace.js';
import gumbaz from './gumbaz.js';
import chariot from './chariot.js';
import gopura from './gopura.js';
import hoysala from './hoysala.js';
import shikhara from './shikhara.js';
import fort from './fort.js';
import peak from './peak.js';
import falls from './falls.js';
import beach from './beach.js';
import wild from './wild.js';
import stupa from './stupa.js';
import statue from './statue.js';
import dam from './dam.js';
import lighthouse from './lighthouse.js';
import city from './city.js';
import lake from './lake.js';
import church from './church.js';

/** @typedef {[THREE.BufferGeometry, number, number?, number?, number?]} Part geometry, colour, x, y, z */

/** Builders by model kind. Keys match the `model` enum in schemas/common.schema.json. */
export const KIT = {
  soudha,
  palace,
  gumbaz,
  chariot,
  gopura,
  hoysala,
  shikhara,
  fort,
  peak,
  falls,
  beach,
  wild,
  stupa,
  statue,
  dam,
  lighthouse,
  city,
  lake,
  church,
};

/** Base-disc colour per primary category (matches the CSS category colours). */
export const PC = { D: 0xff9d45, C: 0x41c9bb, B: 0xc4a2ff, F: 0x86d672, H: 0x7cc4ff };

/**
 * Merge parts into one geometry with per-vertex colours.
 * @param {Part[]} parts
 */
export function merge(parts) {
  const pos = [],
    nor = [],
    col = [],
    c = new THREE.Color();
  parts.forEach(([g, hex, x, y, z]) => {
    const q = g.index ? g.toNonIndexed() : g;
    q.translate(x || 0, y || 0, z || 0);
    const pa = q.attributes.position.array,
      na = q.attributes.normal.array;
    c.set(hex);
    for (let k = 0; k < pa.length; k += 3) {
      pos.push(pa[k], pa[k + 1], pa[k + 2]);
      nor.push(na[k], na[k + 1], na[k + 2]);
      col.push(c.r, c.g, c.b);
    }
  });
  const b = new THREE.BufferGeometry();
  b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  b.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  b.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return b;
}
