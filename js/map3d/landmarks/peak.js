import { Bx, Cy, Co } from './prims.js';

/** Hill or ghat: three green cones and a summit flag. Default for bike-ride and chill-out places inland. */
export default () => [
  [Co(1.5, 2.6, 7), 0x4f7a45, 0, 1.3, 0],
  [Co(1, 1.8, 6), 0x5d8a4f, 1.1, 0.9, 0.3],
  [Co(0.8, 1.3, 6), 0x6a9558, -1, 0.65, 0.4],
  [Cy(0.03, 0.03, 0.7, 6), 0x333333, 0, 2.9, 0],
  [Bx(0.4, 0.24, 0.03), 0xf2b705, 0.2, 3.1, 0],
];
