import { Bx, Cy, Sp, GN } from './prims.js';

/** Wildlife: grass disc, three trees and a boxy grey elephant. */
export default () => [
  [Cy(1.6, 1.6, 0.1, 12), 0x5b7f3f, 0, 0.05, 0],
  ...[
    [-0.9, -0.5],
    [0.2, -0.9],
    [-0.3, 0.7],
  ].flatMap(([x, z]) => [
    [Cy(0.08, 0.1, 0.9, 6), 0x7a5a3a, x, 0.45, z],
    [Sp(0.5), GN, x, 1.15, z],
  ]),
  [Bx(0.9, 0.6, 0.5), 0x7d7d7d, 0.7, 0.65, 0.4],
  [Bx(0.35, 0.42, 0.4), 0x7d7d7d, 1.25, 0.78, 0.4],
  [Bx(0.12, 0.5, 0.12), 0x7d7d7d, 1.42, 0.45, 0.4],
];
