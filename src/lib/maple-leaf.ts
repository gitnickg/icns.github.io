// Maple leaf from the Flag of Canada (public domain, Wikimedia Commons).
// Drawn in a -2015 -2000 4030 4030 box; used by the footer and the logo mark.
export const MAPLE_LEAF =
  'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z';

/** SVG transform that centres the leaf at (cx, cy), `width` units wide. */
export function leafTransform(cx: number, cy: number, width: number): string {
  const k = width / 4030;
  return `translate(${cx} ${cy - 15 * k}) scale(${+k.toFixed(6)})`;
}
