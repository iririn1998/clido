# clido

clido is a local-first todo management CLI.

## Usage

Running clido without a subcommand opens an interactive todo list.

```sh
clido
```

| Key | Action |
| --- | --- |
| `↑` / `↓` (`k` / `j`) | Move focus between todos. |
| `Enter` / `Space` | Toggle the completion state of the focused todo. |
| `a` | Add a new todo (switch to input mode). |
| `c` | Delete all completed todos at once. |
| `q` / `Ctrl-C` | Quit immediately. |

Press `a` to enter input mode, where you can type a title.

| Key | Action |
| --- | --- |
| Printable characters | Append a character to the title. |
| `Backspace` | Delete the last character. |
| `Enter` | Confirm the typed title (does nothing when empty). |
| `Esc` / `Ctrl-C` | Cancel input and return to the list. |

When the terminal is not a TTY (e.g. piped), clido prints a banner and points you to `clido help`.

## Commands

| Command | Syntax | Description |
| --- | --- | --- |
| `add` | `clido add "<title>"` | Add a new open todo. |
| `list` | `clido list [--all \| --status <open\|done>]` | List todos. By default, only open todos are shown. |
| `done` | `clido done <id>` | Mark a todo as done. |
| `reopen` | `clido reopen <id>` | Reopen a completed todo. |
| `edit` | `clido edit <id> "<new title>"` | Update a todo title. |
| `delete` | `clido delete <id>` | Delete a todo. |
| `clear` | `clido clear` | Delete all completed todos at once. |
| `show` | `clido show <id>` | Show details for a single todo. |
| `help` | `clido help [<command>]` / `clido --help` / `clido <command> --help` | Show usage help. |
| `version` | `clido --version` | Show the package version. |

Titles with spaces must be quoted as a single argument (e.g. `clido add "buy milk"`); extra unquoted arguments are rejected as a usage error. `--json` works both before and after the subcommand (`clido --json list` and `clido list --json`).
