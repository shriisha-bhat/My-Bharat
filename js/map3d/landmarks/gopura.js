import { Bx, Cy, GD } from './prims.js';

/** Dravidian temple gateway: stepped tiers with a barrel kalasha on top. Default for devotional places. */
export default () => {
  const b = Cy(0.3, 0.3, 0.9, 10);
  b.rotateZ(Math.PI / 2);
  return [
    [Bx(1.9, 0.8, 1.2), 0xcdb892, 0, 0.4, 0],
    [Bx(1.65, 0.5, 1.05), 0xe2cba2, 0, 1.05, 0],
    [Bx(1.35, 0.5, 0.9), 0xc9a36a, 0, 1.55, 0],
    [Bx(1.05, 0.5, 0.75), 0xe2cba2, 0, 2.05, 0],
    [Bx(0.8, 0.45, 0.6), 0xc9a36a, 0, 2.52, 0],
    [b, GD, 0, 2.95, 0],
  ];
};
