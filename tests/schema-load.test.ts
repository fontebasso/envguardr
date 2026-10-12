import { describe, it, expect } from "vitest";
import { loadSchemaFile, parseSchemaText } from "../src/schema/load";
import { EnvguardrError } from "../src/errors";

function expectError(fn: () => unknown, code: string, message?: string) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(EnvguardrError);
    expect(err).toMatchObject({ code, path: undefined });
    if (message) expect((err as Error).message).toBe(message);
    return;
  }
  throw new Error("expected an error");
}

describe("parseSchemaText", () => {
  it("parses a YAML document", () => {
    expect(parseSchemaText("version: 1\nvariables:\n  A:\n    type: string\n")).toEqual({
      version: 1,
      variables: { A: { type: "string" } },
    });
  });

  it("parses JSON, which is valid YAML", () => {
    expect(parseSchemaText('{"version":1,"variables":{}}')).toEqual({ version: 1, variables: {} });
  });

  it("parses schemas written on Windows (BOM and CRLF)", () => {
    expect(parseSchemaText("\uFEFFversion: 1\r\nvariables:\r\n  A:\r\n    type: string\r\n")).toEqual({
      version: 1,
      variables: { A: { type: "string" } },
    });
  });

  it("keeps YAML 1.1 booleans as strings", () => {
    expect(parseSchemaText("a: yes\nb: [on, off]\n")).toEqual({ a: "yes", b: ["on", "off"] });
  });

  it("rejects an empty file", () => {
    expectError(() => parseSchemaText(""), "SCHEMA_PARSE_ERROR", "Schema must contain exactly one YAML document");
  });

  it("rejects multiple documents", () => {
    expectError(
      () => parseSchemaText("a: 1\n---\nb: 2\n"),
      "SCHEMA_PARSE_ERROR",
      "Schema must contain exactly one YAML document",
    );
  });

  it("rejects duplicated keys", () => {
    expectError(() => parseSchemaText("a: 1\na: 2\n"), "SCHEMA_PARSE_ERROR");
  });

  it("rejects malformed YAML", () => {
    expectError(() => parseSchemaText("a: [1, 2\n"), "SCHEMA_PARSE_ERROR");
  });

  it("rejects custom and YAML 1.1 tags", () => {
    expectError(() => parseSchemaText("a: !foo bar\n"), "SCHEMA_PARSE_ERROR");
    expectError(() => parseSchemaText("a: !!binary aGk=\n"), "SCHEMA_PARSE_ERROR");
  });

  it("rejects alias bombs", () => {
    const bomb = [
      "a: &a [x,x,x,x,x,x,x,x,x]",
      "b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]",
      "c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]",
      "d: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]",
      "e: [*d,*d,*d,*d,*d,*d,*d,*d,*d]",
      "",
    ].join("\n");
    expectError(() => parseSchemaText(bomb), "SCHEMA_PARSE_ERROR", "Schema uses too many aliases");
  });

  it("reports only the first line of the parser message", () => {
    try {
      parseSchemaText("a: 1\na: 2\n");
    } catch (err) {
      expect((err as Error).message).not.toContain("\n");
    }
  });
});

describe("loadSchemaFile", () => {
  it("reads and parses a file", async () => {
    await expect(loadSchemaFile("tests/fixtures/app.schema.yaml")).resolves.toMatchObject({ version: 1 });
  });

  it("reports a missing file", async () => {
    await expect(loadSchemaFile("tests/fixtures/nope.yaml")).rejects.toMatchObject({
      code: "SCHEMA_NOT_FOUND",
      message: "Cannot read schema file: tests/fixtures/nope.yaml",
    });
  });

  it("reports a directory as unreadable", async () => {
    await expect(loadSchemaFile("tests/fixtures")).rejects.toMatchObject({ code: "SCHEMA_NOT_FOUND" });
  });
});
