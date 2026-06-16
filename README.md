# clido

clido は、ローカルファーストな todo 管理 CLI です。

## 起動方法

サブコマンドなしで起動すると、対話的な todo 一覧が開きます。

```sh
clido
```

| キー | 操作 |
| --- | --- |
| `↑` / `↓`（`k` / `j`） | フォーカスを移動する。 |
| `Enter` / `Space` | フォーカス中の todo の完了状態を切り替える。 |
| `q` / `Ctrl-C` | 終了する。 |

端末（TTY）でない場合（パイプ等）はバナーを表示し、`clido help` へ誘導します。

## コマンド一覧

| コマンド | 構文 | 機能 |
| --- | --- | --- |
| `add` | `clido add "<タイトル>"` | 新しい未完了 todo を追加する。 |
| `list` | `clido list [--all \| --status <open\|done>]` | todo を一覧表示する（デフォルトは未完了のみ）。 |
| `done` | `clido done <id>` | todo を完了済みにする。 |
| `reopen` | `clido reopen <id>` | 完了済み todo を未完了に戻す。 |
| `edit` | `clido edit <id> "<新しいタイトル>"` | todo のタイトルを更新する。 |
| `delete` | `clido delete <id>` | todo を削除する。 |
| `show` | `clido show <id>` | 単一の todo の詳細を表示する。 |
| `help` | `clido help [<コマンド>]` / `clido --help` | 使い方のヘルプを表示する。 |
| `version` | `clido --version` | パッケージバージョンを表示する。 |
