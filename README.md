# clido

clido は、ローカルファーストな todo 管理 CLI です。

## 起動方法

サブコマンドなしで起動すると、対話的な todo 一覧が開きます。

```sh
clido
```

| キー | 操作 |
| --- | --- |
| `↑` / `↓`（`k` / `j`） | todo 間でフォーカスを移動する。 |
| `Enter` / `Space` | フォーカス中の todo の完了状態を切り替える。 |
| `a` | 新しい todo を追加する（入力モードへ切り替える）。 |
| `c` | 完了済みの todo を一括削除する。 |
| `q` / `Ctrl-C` | 直接終了する。 |

`a` を押すと入力モードに入り、タイトルを入力できます。

| キー | 操作 |
| --- | --- |
| 表示可能文字 | タイトルへ文字を追加する。 |
| `Backspace` | 末尾の1文字を削除する。 |
| `Enter` | 入力したタイトルで追加を確定する（空のときは追加しない）。 |
| `Esc` / `Ctrl-C` | 入力を取り消して一覧へ戻る。 |

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
| `clear` | `clido clear` | 完了済みの todo を一括削除する。 |
| `show` | `clido show <id>` | 単一の todo の詳細を表示する。 |
| `help` | `clido help [<コマンド>]` / `clido --help` / `clido <コマンド> --help` | 使い方のヘルプを表示する。 |
| `version` | `clido --version` | パッケージバージョンを表示する。 |

タイトルに空白を含める場合は引用符でくくって1引数として渡してください（例 `clido add "牛乳を買う"`）。宣言数を超える余分な引数は使用法エラー（終了コード 2）として拒否されます。`--json` はサブコマンドの前後どちらでも同じ出力形式になります（`clido --json list` / `clido list --json`）。
