import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, StorageError } from "../../src/core/errors.ts";
import { createJsonTodoRepository } from "../../src/repository/json-todo-repository.ts";

let dir: string;
let filePath: string;

/**
 * Fixed clock used so timestamp assertions stay deterministic.
 */
const at = (iso: string): Date => new Date(iso);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "clido-test-"));
  filePath = join(dir, "todos.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("createJsonTodoRepository", () => {
  it("adds the first todo with id 1 and open status", async () => {
    const repo = createJsonTodoRepository(filePath);

    const todo = await repo.add({ title: "牛乳を買う", now: at("2026-06-16T09:00:00.000Z") });

    expect(todo).toEqual({
      id: 1,
      title: "牛乳を買う",
      status: "open",
      createdAt: "2026-06-16T09:00:00.000Z",
      updatedAt: "2026-06-16T09:00:00.000Z",
      completedAt: null,
    });
  });

  it("assigns monotonically increasing ids and persists across instances", async () => {
    const repo = createJsonTodoRepository(filePath);
    await repo.add({ title: "one", now: at("2026-06-16T09:00:00.000Z") });
    await repo.add({ title: "two", now: at("2026-06-16T09:01:00.000Z") });

    const reopened = createJsonTodoRepository(filePath);
    const todos = await reopened.list();

    expect(todos.map((todo) => todo.id)).toEqual([1, 2]);
    expect(todos.map((todo) => todo.title)).toEqual(["one", "two"]);
  });

  it("filters by status", async () => {
    const repo = createJsonTodoRepository(filePath);
    const first = await repo.add({ title: "open one", now: at("2026-06-16T09:00:00.000Z") });
    await repo.add({ title: "open two", now: at("2026-06-16T09:01:00.000Z") });
    await repo.update(first.id, (todo) => ({
      ...todo,
      status: "done",
      completedAt: "2026-06-16T10:00:00.000Z",
      updatedAt: "2026-06-16T10:00:00.000Z",
    }));

    expect((await repo.list({ status: "open" })).map((todo) => todo.title)).toEqual(["open two"]);
    expect((await repo.list({ status: "done" })).map((todo) => todo.title)).toEqual(["open one"]);
    expect((await repo.list()).map((todo) => todo.id)).toEqual([1, 2]);
  });

  it("returns null from get for a missing id", async () => {
    const repo = createJsonTodoRepository(filePath);
    expect(await repo.get(99)).toBeNull();
  });

  it("does not reuse ids after delete", async () => {
    const repo = createJsonTodoRepository(filePath);
    const first = await repo.add({ title: "one", now: at("2026-06-16T09:00:00.000Z") });
    await repo.delete(first.id);

    const next = await repo.add({ title: "two", now: at("2026-06-16T09:01:00.000Z") });
    expect(next.id).toBe(2);
  });

  it("throws NotFoundError when updating or deleting a missing id", async () => {
    const repo = createJsonTodoRepository(filePath);
    await expect(repo.update(1, (todo) => todo)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repo.delete(1)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a corrupt JSON file with StorageError", async () => {
    await writeFile(filePath, "{ not json", "utf8");
    const repo = createJsonTodoRepository(filePath);
    await expect(repo.list()).rejects.toBeInstanceOf(StorageError);
  });

  it("corrects nextId in memory when the file under-counts", async () => {
    await writeFile(
      filePath,
      JSON.stringify({
        version: 1,
        nextId: 1,
        todos: [
          {
            id: 5,
            title: "hand edited",
            status: "open",
            createdAt: "2026-06-16T09:00:00.000Z",
            updatedAt: "2026-06-16T09:00:00.000Z",
            completedAt: null,
          },
        ],
      }),
      "utf8",
    );
    const repo = createJsonTodoRepository(filePath);
    const added = await repo.add({ title: "next", now: at("2026-06-16T09:05:00.000Z") });
    expect(added.id).toBe(6);
  });
});
