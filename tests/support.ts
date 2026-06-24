import type { CommandDef } from "citty";
import type { Context } from "../src/app/context.ts";
import type { ErrorPayload, Output } from "../src/infra/output.ts";
import type { Todo } from "../src/core/todo.ts";
import type { TodoRepository } from "../src/repository/todo-repository.ts";

const notImplemented = (method: string) => async (): Promise<never> => {
  throw new Error(`fake repo: ${method} は未実装です`);
};

export const makeFakeRepo = (overrides: Partial<TodoRepository> = {}): TodoRepository => ({
  list: async () => [],
  get: async () => null,
  add: notImplemented("add"),
  update: notImplemented("update"),
  delete: async () => undefined,
  deleteCompleted: async () => 0,
  ...overrides,
});

export type Captured = {
  todos: Todo[];
  details: Todo[];
  lists: Todo[][];
  successes: Record<string, unknown>[];
  errors: ErrorPayload[];
};

export const makeOutput = (): { output: Output; captured: Captured } => {
  const captured: Captured = { todos: [], details: [], lists: [], successes: [], errors: [] };
  const output: Output = {
    todo: ({ todo }) => {
      captured.todos.push(todo);
    },
    todoDetail: ({ todo }) => {
      captured.details.push(todo);
    },
    todoList: ({ todos }) => {
      captured.lists.push(todos);
    },
    success: (dto) => {
      captured.successes.push(dto);
    },
    error: (error) => {
      captured.errors.push(error);
    },
  };
  return { output, captured };
};

export const makeContext = (repo: TodoRepository, output: Output, now: Date): Context => ({
  repo,
  output,
  now: () => now,
});

export const invoke = (command: CommandDef, args: Record<string, unknown>): Promise<unknown> => {
  const runContext = { args, rawArgs: [], cmd: command, data: undefined };
  return Promise.resolve(command.run?.(runContext as never));
};
