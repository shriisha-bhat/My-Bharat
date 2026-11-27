import { Cy, Co, GR } from './prims.js';

/** Lighthouse: rock base, white tower with a red band, lantern and red cap. */
export default () => [
  [Cy(0.9, 1.1, 0.3, 7), GR, 0, 0.15, 0],
  [Cy(0.25, 0.4, 2.6, 10), 0xf5f5f0, 0, 1.6, 0],
  [Cy(0.34, 0.37, 0.4, 10), 0xd23b3b, 0, 1.5, 0],
  [Cy(0.3, 0.3, 0.3, 8), 0x333333, 0, 3.05, 0],
  [Co(0.33, 0.3, 8), 0xd23b3b, 0, 3.35, 0],
];
