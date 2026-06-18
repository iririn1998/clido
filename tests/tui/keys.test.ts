import { describe, expect, it } from "vitest";
import { parseKey } from "../../src/tui/keys.ts";

describe("parseKey", () => {
  it("maps the up arrow and vim k to up", () => {
    expect(parseKey("\x1b[A")).toBe("up");
    expect(parseKey("k")).toBe("up");
  });

  it("maps the down arrow and vim j to down", () => {
    expect(parseKey("\x1b[B")).toBe("down");
    expect(parseKey("j")).toBe("down");
  });

  it("maps enter (CR/LF) and space to select", () => {
    expect(parseKey("\r")).toBe("select");
    expect(parseKey("\n")).toBe("select");
    expect(parseKey(" ")).toBe("select");
  });

  it("maps q and Ctrl-C to quit", () => {
    expect(parseKey("q")).toBe("quit");
    expect(parseKey("\x03")).toBe("quit");
  });

  it("ignores unrecognized input", () => {
    expect(parseKey("x")).toBe("none");
    expect(parseKey("")).toBe("none");
    expect(parseKey("\x1b")).toBe("none");
  });
});
