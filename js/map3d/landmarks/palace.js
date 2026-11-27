import { Bx, Cy, Co, Dm, RD, GD } from './prims.js';

/** Indo-Saracenic palace: long block, central tower, four corner turrets with red domes. */
export default () => [
  [Bx(4, 1.3, 1.4), 0xe9dcb9, 0, 0.65, 0],
  [Bx(0.8, 1.6, 0.8), 0xe9dcb9, 0, 2.1, 0],
  [Dm(0.5), RD, 0, 2.9, 0],
  [Co(0.07, 0.4), GD, 0, 3.6, 0],
  ...[
    [-1.9, 0.6],
    [1.9, 0.6],
    [-1.9, -0.6],
    [1.9, -0.6],
  ].flatMap(([x, z]) => [
    [Cy(0.25, 0.25, 2, 8), 0xe9dcb9, x, 1, z],
    [Dm(0.3), RD, x, 2, z],
  ]),
  [Dm(0.26), RD, -0.95, 1.3, 0],
  [Dm(0.26), RD, 0.95, 1.3, 0],
];
