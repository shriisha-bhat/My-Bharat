import { Bx, Cy, Sp, GR } from './prims.js';

/** Monolithic statue: plinth, standing figure, shoulders and head in grey stone. */
export default () => [
  [Bx(1.3, 0.6, 1.3), GR, 0, 0.3, 0],
  [Cy(0.35, 0.5, 1.9, 8), 0xa3adb5, 0, 1.55, 0],
  [Bx(1.1, 0.25, 0.3), 0xa3adb5, 0, 2.1, 0],
  [Sp(0.34), 0xa3adb5, 0, 2.8, 0],
];
