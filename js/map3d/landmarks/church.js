import { Bx, Co, WT } from './prims.js';

/** Church: nave with a brown roof, a bell tower with a spire, and shallow water around it. */
export default () => [
  [Bx(1.2, 1.2, 2.4), 0xcfc6b4, 0, 0.6, 0],
  [Bx(1.3, 0.45, 2.5), 0x8a5a44, 0, 1.42, 0],
  [Bx(0.75, 2.3, 0.75), 0xcfc6b4, 0, 1.15, 1.35],
  [Co(0.6, 1, 4), 0x8a5a44, 0, 2.8, 1.35],
  [Bx(3.4, 0.06, 3.4), WT, 0, 0.03, 0.3],
];
