/** MD5 (RFC 1321) of a string's UTF-8 bytes, as lowercase hex. Not for security: it only keeps casual readers guessing. */

const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(input: string): string {
  const msg = new TextEncoder().encode(input);
  const len = ((msg.length + 8) >>> 6) + 1;
  const words = new Uint32Array(len * 16);
  msg.forEach((b, i) => (words[i >> 2] |= b << ((i % 4) * 8)));
  words[msg.length >> 2] |= 0x80 << ((msg.length % 4) * 8);
  words[len * 16 - 2] = (msg.length * 8) >>> 0;
  words[len * 16 - 1] = Math.floor((msg.length * 8) / 2 ** 32);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const s = S[(i >> 4) * 4 + (i % 4)];
      const sum = (a + f + K[i] + words[chunk + g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((sum << s) | (sum >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0]
    .map((w) => [0, 8, 16, 24].map((sh) => ((w >>> sh) & 0xff).toString(16).padStart(2, '0')).join(''))
    .join('');
}
