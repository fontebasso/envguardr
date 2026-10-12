import { describe, it, expect } from "vitest";
import { isUrl } from "../src/url";

describe("isUrl (RFC 3986 with RFC 3987 characters, scheme:// required)", () => {
  it.each([
    "https://api.example.com",
    "https://api.example.com:8443/v1/items?limit=10&sort=-created#top",
    "postgres://user:p%40ss@db.internal:5432/app?sslmode=require",
    "redis://:secret@localhost:6379/0",
    "mongodb+srv://user:pass@cluster0.example.net/db?retryWrites=true",
    "amqp://guest:guest@rabbit:5672/%2F",
    "sqlite:///var/data/app.db",
    "file:///tmp/x",
    "http://[::1]:8080/",
    "http://[2001:db8::7]/c=GB?objectClass?one",
    "http://[v1.fe80::a+en1]/",
    "http://192.168.0.1",
    "http://host:",
    "HTTPS://EXAMPLE.COM",
    "https://exämple.com/ação",
    "https://例え.テスト/パス?クエリ#断片",
    "https://user:sénha@example.com/",
    "https://example.com/?q=\u{E000}",
  ])("accepts %s", (value) => {
    expect(isUrl(value)).toBe(true);
  });

  it.each([
    "",
    "not-a-url",
    "localhost:8080",
    "mailto:ops@example.com",
    "urn:isbn:0451450523",
    "example.com",
    "//example.com",
    "1http://example.com",
    "ht tp://example.com",
    "https://exa mple.com",
    "https://example.com/a b",
    "postgres://user:p@ss@host",
    "http://host:port",
    "http://[::1",
    "http://[::1]x",
    "http://[fe80::1%25eth0]/",
    "http://[zz::1]/",
    "http://example.com/%zz",
    "https://example.com/#frag#more",
    "https://example.com/\u{E000}",
    "https://example.com/\u{FFFE}",
    "https://exa\nmple.com",
    "http://ex<ample>.com",
  ])("rejects %j", (value) => {
    expect(isUrl(value)).toBe(false);
  });
});
