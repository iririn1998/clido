# clido

clido is a local-first todo management CLI.

## Usage

Run clido with the following command:

```sh
clido
```

## Commands

| Command | Syntax | Description |
| --- | --- | --- |
| `add` | `clido add "<title>"` | Add a new open todo. |
| `list` | `clido list [--all \| --status <open\|done>]` | List todos. By default, only open todos are shown. |
| `done` | `clido done <id>` | Mark a todo as done. |
| `reopen` | `clido reopen <id>` | Reopen a completed todo. |
| `edit` | `clido edit <id> "<new title>"` | Update a todo title. |
| `delete` | `clido delete <id>` | Delete a todo. |
| `show` | `clido show <id>` | Show details for a single todo. |
| `help` | `clido help [<command>]` / `clido --help` | Show usage help. |
| `version` | `clido --version` | Show the package version. |
