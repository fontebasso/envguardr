import { describe, it, expect } from "vitest";
import { calendarDate, lengthAtLeast, lengthAtMost, matchesPattern } from "../src/validators";

describe("matchesPattern (RE2)", () => {
  it("searches without implicit anchors", () => {
    expect(matchesPattern("a", "no match")("xax")).toBe(true);
    expect(matchesPattern("^a$", "no match")("xax")).toBe("no match");
  });

  it("supports Unicode classes without flags", () => {
    expect(matchesPattern("^\\p{L}+$", "no match")("Ção")).toBe(true);
    expect(matchesPattern("^\\p{L}+$", "no match")("123")).toBe("no match");
  });

  it("runs in linear time on patterns that backtrack in JavaScript", () => {
    const started = Date.now();
    expect(matchesPattern("^(a+)+$", "no match")(`${"a".repeat(50_000)}!`)).toBe("no match");
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("accepts an absent value", () => {
    expect(matchesPattern("^a$", "no match")(undefined)).toBe(true);
  });
});

describe("lengthAtLeast / lengthAtMost", () => {
  it("count code points, not UTF-16 units", () => {
    expect(lengthAtLeast(3, "short")("😀😀😀")).toBe(true);
    expect(lengthAtMost(2, "long")("😀😀")).toBe(true);
  });

  it("are inclusive", () => {
    expect(lengthAtLeast(3, "short")("abc")).toBe(true);
    expect(lengthAtMost(3, "long")("abc")).toBe(true);
  });

  it("return the message when the length is out of bounds", () => {
    expect(lengthAtLeast(3, "short")("ab")).toBe("short");
    expect(lengthAtMost(2, "long")("abc")).toBe("long");
  });

  it("accept an absent value", () => {
    expect(lengthAtLeast(3, "short")(undefined)).toBe(true);
    expect(lengthAtMost(2, "long")(undefined)).toBe(true);
  });
});

describe("calendarDate", () => {
  const date = calendarDate("bad date");

  it.each(["2024-02-29", "2023-12-31", "0023-01-01"])("accepts %s", (value) => {
    expect(date(value)).toBe(true);
  });

  it.each(["2023-02-30", "2023-02-29", "2023-13-01", "2023-2-1", "2023-02-01T00:00:00Z", "", "not-a-date"])(
    "rejects %s",
    (value) => {
      expect(date(value)).toBe("bad date");
    },
  );

  it("accepts an absent value", () => {
    expect(date(undefined)).toBe(true);
  });
});
