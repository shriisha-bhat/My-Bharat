import { Bx, Cy, Co, Dm, GR, ST, GD } from './prims.js';

/** Vidhana Soudha: colonnaded block with a central dome. Used for Bengaluru. */
export default () => [
  [Bx(4, 0.4, 2), GR, 0, 0.2, 0],
  [Bx(3.6, 1.4, 1.6), ST, 0, 1.1, 0],
  ...[-1.25, -0.75, -0.25, 0.25, 0.75, 1.25].map((x) => [
    Cy(0.08, 0.08, 1.3),
    0xf4efe0,
    x,
    1.05,
    0.9,
  ]),
  [Bx(3, 0.25, 0.5), ST, 0, 1.9, 0.8],
  [Cy(0.55, 0.55, 0.5, 12), ST, 0, 2.05, 0],
  [Dm(0.6), 0xeee8d6, 0, 2.3, 0],
  [Co(0.08, 0.45), GD, 0, 3.1, 0],
  [Dm(0.28), 0xeee8d6, -1.4, 1.8, 0],
  [Dm(0.28), 0xeee8d6, 1.4, 1.8, 0],
];
