/**
 * Unlisted security-tool commands. They take arguments, so they are keyed by the MD5 of the
 * first word only. Banners only: nothing here touches the network.
 */
import type { Line, Result } from './commands';

const plain = (s: string): Line => [{ text: s }];
const out = (...lines: string[]): Result => ({ lines: lines.map(plain) });

const PORTS: [number, string][] = [
  [42, 'life'],
  [67, 'yo'],
  [69, 'nice'],
  [420, 'swed'],
  [666, 'mafia'],
  [1337, 'pwnd'],
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => {
  const zone = d.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop() ?? 'UTC';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())} ${zone}`;
};

const OCTET = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4 = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`);
const LABEL = '(?!-)[a-z0-9-]{1,63}(?<!-)';
const DOMAIN = new RegExp(`^(${LABEL}\\.)+[a-z]{2,63}\\.?$`, 'i');

const isIPv6 = (s: string) => {
  if (!s.includes(':')) return false;
  try {
    return new URL(`http://[${s}]/`).hostname !== '';
  } catch {
    return false;
  }
};

/** True for an IPv4 or IPv6 address or a domain name; nothing else is a valid target. */
const isTarget = (s: string) => IPV4.test(s) || isIPv6(s) || (s.length <= 253 && DOMAIN.test(s));

const usage = (tool: string) => `Usage: ${tool} {IP address | domain name}`;

/** The single valid target in args, or the error/usage Result to print instead. */
function targetOf(tool: string, args: string[], banner: string[]): string | Result {
  if (args.length === 0) return out(...banner, usage(tool));
  if (args.length > 1 || !isTarget(args[0])) {
    return out(`${tool}: invalid target '${args.join(' ')}': expected an IP address or domain name`, usage(tool));
  }
  return args[0];
}

function nmap(args: string[]): Result {
  const target = targetOf('nmap', args, ['Nmap 7.95 ( https://nmap.org )']);
  if (typeof target !== 'string') return target;
  return out(
    `Starting Nmap 7.95 ( https://nmap.org ) at ${stamp(new Date())}`,
    `Nmap scan report for ${target}`,
    'Host is up (0.0013s latency).',
    `Not shown: ${1000 - PORTS.length} closed tcp ports (reset)`,
    'PORT     STATE SERVICE',
    ...PORTS.map(([p, s]) => `${`${p}/tcp`.padEnd(9)}open  ${s}`),
    '',
    'Nmap done: 1 IP address (1 host up) scanned in 0.42 seconds',
  );
}

const PING_MS = [4.2, 6.9, 13.37, 0.42];

function ping(args: string[]): Result {
  const target = targetOf('ping', args, []);
  if (typeof target !== 'string') return target;
  const avg = PING_MS.reduce((a, b) => a + b, 0) / PING_MS.length;
  const mdev = Math.sqrt(PING_MS.reduce((a, b) => a + b * b, 0) / PING_MS.length - avg * avg);
  const f = (n: number) => n.toFixed(3);
  return out(
    `PING ${target} 56(84) bytes of data.`,
    ...PING_MS.map((ms, i) => `64 bytes from ${target}: icmp_seq=${i + 1} ttl=64 time=${ms.toFixed(2)} ms`),
    '',
    `--- ${target} ping statistics ---`,
    `${PING_MS.length} packets transmitted, ${PING_MS.length} received, 0% packet loss, time 3004ms`,
    `rtt min/avg/max/mdev = ${f(Math.min(...PING_MS))}/${f(avg)}/${f(Math.max(...PING_MS))}/${f(mdev)} ms`,
  );
}

const msfconsole = (): Result =>
  out(
    '',
    '       =[ metasploit v6.4.38-dev                          ]',
    '+ -- --=[ 2467 exploits - 1273 auxiliary - 431 post       ]',
    '+ -- --=[ 1478 payloads - 49 encoders - 13 nops           ]',
    '+ -- --=[ 9 evasion                                       ]',
    '',
    'Metasploit Documentation: https://docs.metasploit.com/',
    '',
    'msf6 > exit',
  );

const sqlmap = (): Result =>
  out(
    '        ___',
    '       __H__',
    ' ___ ___[\']_____ ___ ___  {1.8.11#stable}',
    '|_ -| . ["]     | .\'| . |',
    '|___|_  [)]_|_|_|__,|  _|',
    '      |_|V...       |_|   https://sqlmap.org',
    '',
    '[!] legal disclaimer: usage of sqlmap for attacking targets without prior mutual consent is illegal.',
  );

const hydra = (): Result =>
  out(
    'Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes.',
    '',
    'Syntax: hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]] [-t TASKS] server service',
  );

const nikto = (): Result =>
  out('- Nikto v2.5.0', '---------------------------------------------------------------------------', '+ ERROR: No host (-host) specified');

const john = (): Result =>
  out(
    'John the Ripper 1.9.0-jumbo-1+bleeding [linux-gnu 64-bit x86_64 AVX2 AC]',
    'Copyright (c) 1996-2024 by Solar Designer and others',
    'Homepage: https://www.openwall.com/john/',
    '',
    'Usage: john [OPTIONS] [PASSWORD-FILES]',
  );

const hashcat = (): Result =>
  out('hashcat (v6.2.6) starting...', '', 'Usage: hashcat [options]... hash|hashfile|hccapxfile [dictionary|mask|directory]...');

const tools: Record<string, (args: string[]) => Result> = {
  '7c0132070a0ef71d542663e9dc1f5dee': nmap,
  df911f0151f9ef021d410b4be5060972: ping,
  '3a1a8688af4e7a3b333ebf1ca027af3d': msfconsole,
  da3bcb630536a3d32bc8db4adb4de1a0: sqlmap,
  '84366803777e6ba127f4668d0a6fcb96': hydra,
  '9093c0dea19adf938dd4b09f290f0811': nikto,
  '527bd5b5d689e2c32ae974c6229ff785': john,
  '8743b52063cd84097a65d1633f5c74f5': hashcat,
};

/** Runs a security tool by the MD5 of its name. Null when there is no such tool. */
export function secTool(nameHash: string, args: string[]): Result | null {
  return Object.hasOwn(tools, nameHash) ? tools[nameHash](args) : null;
}
