import { Cy, Co, Dm, GD } from './prims.js';

/** Hoysala temple: star-plan platform in dark soapstone with a tiered tower. Default for hidden heritage. */
export default () => [
  [Cy(1.6, 1.7, 0.3, 16), 0x77726a, 0, 0.15, 0],
  [Cy(1.1, 1.2, 1, 16), 0x5d5a52, 0, 0.8, 0],
  [Cy(1.4, 1.4, 0.12, 16), 0x77726a, 0, 1.36, 0],
  [Cy(0.8, 1, 0.5, 16), 0x5d5a52, 0, 1.67, 0],
  [Cy(0.5, 0.75, 0.45, 16), 0x6b675e, 0, 2.12, 0],
  [Dm(0.42), 0x5d5a52, 0, 2.33, 0],
  [Co(0.1, 0.35), GD, 0, 2.9, 0],
];
