import { isIPv6 } from "node:net";

// URL = an RFC 3986 URI with an authority ("scheme://"), where every component
// may also use the international characters of RFC 3987 (IRI).
//
// Every pattern below alternates single characters from disjoint classes with
// "%XX", so matching is linear in the length of the value.

const UNRESERVED = "A-Za-z0-9\\-._~";
const SUB_DELIMS = "!$&'()*+,;=";
const UCSCHAR =
  "\\u{A0}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFEF}" +
  "\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}" +
  "\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}" +
  "\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}" +
  "\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}";
const IPRIVATE = "\\u{E000}-\\u{F8FF}\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}";
const PCT_ENCODED = "%[0-9A-Fa-f]{2}";

function component(extra: string): RegExp {
  return new RegExp(`^(?:[${UNRESERVED}${UCSCHAR}${SUB_DELIMS}${extra}]|${PCT_ENCODED})*$`, "u");
}

const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/;
const USERINFO = component(":");
const REG_NAME = component("");
const PATH = component(":@/");
const QUERY = component(`:@/?${IPRIVATE}`);
const FRAGMENT = component(":@/?");
const PORT = /^[0-9]*$/;
const IP_FUTURE = new RegExp(`^v[0-9A-Fa-f]+\\.[${UNRESERVED}${SUB_DELIMS}:]+$`);

// RFC 3986 appendix B, with "//" required.
const PARTS = /^([^:/?#]+):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/u;

export function isUrl(value: string): boolean {
  const parts = PARTS.exec(value);
  if (!parts) return false;
  const [, scheme, authority, path, query = "", fragment = ""] = parts;
  return (
    SCHEME.test(scheme) &&
    isAuthority(authority) &&
    PATH.test(path) &&
    QUERY.test(query) &&
    FRAGMENT.test(fragment)
  );
}

function isAuthority(authority: string): boolean {
  const at = authority.indexOf("@");
  const userinfo = at === -1 ? "" : authority.slice(0, at);
  const hostport = at === -1 ? authority : authority.slice(at + 1);
  return USERINFO.test(userinfo) && isHostPort(hostport);
}

function isHostPort(hostport: string): boolean {
  if (hostport.startsWith("[")) {
    const close = hostport.indexOf("]");
    if (close === -1) return false;
    const rest = hostport.slice(close + 1);
    return isIpLiteral(hostport.slice(1, close)) && (rest === "" || (rest[0] === ":" && PORT.test(rest.slice(1))));
  }
  const colon = hostport.indexOf(":");
  const host = colon === -1 ? hostport : hostport.slice(0, colon);
  const port = colon === -1 ? "" : hostport.slice(colon + 1);
  return REG_NAME.test(host) && PORT.test(port);
}

// RFC 3986 has no IPv6 zone identifiers.
function isIpLiteral(literal: string): boolean {
  return IP_FUTURE.test(literal) || (!literal.includes("%") && isIPv6(literal));
}
