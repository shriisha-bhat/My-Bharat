import { Bx, Cy, Dm } from './prims.js';

/** Deccan tomb: cube with a great dome and four corner minarets (Gol Gumbaz). */
export default () => [
  [Bx(2.4, 2, 2.4), 0x8f8370, 0, 1, 0],
  [Dm(1.25), 0xa39783, 0, 2, 0],
  ...[
    [-1.2, -1.2],
    [1.2, -1.2],
    [-1.2, 1.2],
    [1.2, 1.2],
  ].flatMap(([x, z]) => [
    [Cy(0.28, 0.28, 2.6, 8), 0x8f8370, x, 1.3, z],
    [Dm(0.33), 0xa39783, x, 2.6, z],
  ]),
];
