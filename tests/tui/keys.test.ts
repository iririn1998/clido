import { describe, expect, it } from "vitest";
import { parseKey } from "../../src/tui/keys.ts";

describe("parseKey", () => {
  it("maps the up arrow and vim k to up", () => {
    expect(parseKey("[A")).toBe("up");
    expect(parseKey("k")).toBe("up");
  });

  it("maps the down arrow and vim j to down", () => {
    expect(parseKey("[B")).toBe("down");
    expect(parseKey("j")).toBe("down");
  });

  it("maps enter (CR/LF) and space to toggle", () => {
    expect(parseKey("\r")).toBe("toggle");
    expect(parseKey("\n")).toBe("toggle");
    expect(parseKey(" ")).toBe("toggle");
  });

  it("maps q and Ctrl-C to quit", () => {
    expect(parseKey("q")).toBe("quit");
    expect(parseKey("")).toBe("quit");
  });

  it("ignores unrecognized input", () => {
    expect(parseKey("x")).toBe("none");
    expect(parseKey("")).toBe("none");
    expect(parseKey("")).toBe("none");
  });
});
