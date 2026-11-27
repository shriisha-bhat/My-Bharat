import { Bx, Cy, Co, Sp, GN, GD, WT } from './prims.js';

/** Lake or tank: water disc on grass, trees, a hill and a tiny shrine on the bank. */
export default () => [
  [Cy(1.75, 1.75, 0.08, 22), 0x5b7f3f, 0, 0.04, 0],
  [Cy(1.3, 1.3, 0.1, 22), WT, 0, 0.07, 0],
  [Sp(0.42), GN, -1.35, 0.5, 0.4],
  [Sp(0.36), GN, 1.25, 0.45, -0.6],
  [Co(0.55, 1.1, 6), 0x4f7a45, 0.9, 0.55, 1.05],
  [Bx(0.3, 0.35, 0.3), 0xe2cba2, 0, 0.3, 0],
  [Co(0.26, 0.3, 4), GD, 0, 0.62, 0],
];
