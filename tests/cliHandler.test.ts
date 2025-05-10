import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCli } from "../src/cliHandler";
import * as validator from "../src/validateEnv";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("runCli", () => {
  it("exits with 0 and prints help when no command is passed", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli"]);
    } catch {
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/Usage/));
      expect(exit).toHaveBeenCalledWith(0);
    }
  });

  it("prints help and exits 0 on --help", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli", "--help"]);
    } catch {
      expect(log).toHaveBeenCalled();
      expect(exit).toHaveBeenCalledWith(0);
    }
  });

  it("errors and exits 1 on unknown command", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli", "oops"]);
    } catch {
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/Unknown command/),
      );
      expect(exit).toHaveBeenCalledWith(1);
    }
  });

  it("errors and exits 1 when validate is called without schemaPath", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli", "validate"]);
    } catch {
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/Missing schema path/),
      );
      expect(exit).toHaveBeenCalledWith(1);
    }
  });

  it("calls validateEnvFromSchema and exits 0 on success", async () => {
    vi.spyOn(validator, "validateEnvFromSchema").mockResolvedValue(true);
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli", "validate", "./schema.ts"]);
    } catch {
      expect(validator.validateEnvFromSchema).toHaveBeenCalledWith(
        "./schema.ts",
      );
      expect(exit).toHaveBeenCalledWith(0);
    }
  });

  it("calls validateEnvFromSchema and exits 1 on failure", async () => {
    vi.spyOn(validator, "validateEnvFromSchema").mockResolvedValue(false);
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });

    try {
      await runCli(["node", "cli", "validate", "./schema.ts"]);
    } catch {
      expect(validator.validateEnvFromSchema).toHaveBeenCalledWith(
        "./schema.ts",
      );
      expect(exit).toHaveBeenCalledWith(1);
    }
  });
});
