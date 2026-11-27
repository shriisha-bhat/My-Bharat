import { Bx, Cy } from './prims.js';

/** The stone chariot of Hampi: platform, four wheels, shrine and roof. */
export default () => {
  const w = () => {
    const g = Cy(0.6, 0.6, 0.15, 14);
    g.rotateX(Math.PI / 2);
    return g;
  };
  return [
    [Bx(2.2, 0.3, 1.4), 0xbba98a, 0, 0.75, 0],
    [w(), 0x9c8b70, -0.7, 0.6, 0.78],
    [w(), 0x9c8b70, 0.7, 0.6, 0.78],
    [w(), 0x9c8b70, -0.7, 0.6, -0.78],
    [w(), 0x9c8b70, 0.7, 0.6, -0.78],
    [Bx(1.4, 1.1, 1.1), 0xc7b594, 0, 1.45, 0],
    [Bx(1.7, 0.2, 1.3), 0xa8977a, 0, 2.1, 0],
    [Bx(1.1, 0.25, 0.9), 0xbba98a, 0, 2.32, 0],
  ];
};
