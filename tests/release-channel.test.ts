import { describe, it, expect } from "vitest";
import { releaseChannel } from "../scripts/release/channel.mjs";

describe("releaseChannel", () => {
  it("moves latest for a release newer than the current latest", () => {
    expect(releaseChannel("4.0.0", "3.1.8")).toEqual({ latest: true, npmTag: "latest" });
    expect(releaseChannel("4.0.1", "4.0.0")).toEqual({ latest: true, npmTag: "latest" });
    expect(releaseChannel("4.10.0", "4.9.9")).toEqual({ latest: true, npmTag: "latest" });
  });

  it("keeps latest for a maintenance release of an older major", () => {
    expect(releaseChannel("3.1.9", "4.0.0")).toEqual({ latest: false, npmTag: "release-3" });
  });

  it("keeps latest for an older release of the current major", () => {
    expect(releaseChannel("4.0.1", "4.1.0")).toEqual({ latest: false, npmTag: "release-4" });
  });

  it("moves latest when nothing was published yet", () => {
    expect(releaseChannel("1.0.0", "")).toEqual({ latest: true, npmTag: "latest" });
  });

  it("rejects versions that are not plain x.y.z", () => {
    expect(() => releaseChannel("4.0", "3.1.8")).toThrow("Invalid version: 4.0");
    expect(() => releaseChannel("4.0.0", "4.0.0-rc.1")).toThrow("Invalid version: 4.0.0-rc.1");
  });
});
