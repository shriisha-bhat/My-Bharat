import { Bx, Cy, Co, RD } from './prims.js';

/** Town: a few blocks of different heights and a small temple spire. Default for family places. */
export default () => [
  [Bx(0.8, 1.6, 0.8), 0xb9c2c9, -0.9, 0.8, 0],
  [Bx(0.7, 2.4, 0.7), 0xd8dde1, 0, 1.2, -0.3],
  [Bx(0.8, 1.1, 0.8), 0xa8b1b8, 0.9, 0.55, 0.2],
  [Bx(0.6, 0.7, 0.6), 0xc9b79a, 0.1, 0.35, 0.7],
  [Cy(0.14, 0.14, 2.6, 8), 0xe9dcb9, -0.2, 1.3, 0.9],
  [Co(0.2, 0.4, 8), RD, -0.2, 2.8, 0.9],
];
