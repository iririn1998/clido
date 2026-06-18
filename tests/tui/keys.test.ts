import { describe, expect, it } from "vitest";
import { parseInputKey, parseKey } from "../../src/tui/keys.ts";

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

  it("maps a to add and c to clear", () => {
    expect(parseKey("a")).toBe("add");
    expect(parseKey("c")).toBe("clear");
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

describe("parseInputKey", () => {
  it("maps enter (CR/LF) to commit", () => {
    expect(parseInputKey("\r")).toEqual({ type: "commit" });
    expect(parseInputKey("\n")).toEqual({ type: "commit" });
  });

  it("maps Esc and Ctrl-C to cancel", () => {
    expect(parseInputKey("\x1b")).toEqual({ type: "cancel" });
    expect(parseInputKey("\x03")).toEqual({ type: "cancel" });
  });

  it("maps Backspace and Delete to backspace", () => {
    expect(parseInputKey("\x7f")).toEqual({ type: "backspace" });
    expect(parseInputKey("\x08")).toEqual({ type: "backspace" });
  });

  it("maps printable input (including full-width) to insert", () => {
    expect(parseInputKey("a")).toEqual({ type: "insert", text: "a" });
    expect(parseInputKey("牛乳")).toEqual({ type: "insert", text: "牛乳" });
  });

  it("ignores escape sequences and empty input", () => {
    expect(parseInputKey("\x1b[A")).toEqual({ type: "none" });
    expect(parseInputKey("")).toEqual({ type: "none" });
  });
});
