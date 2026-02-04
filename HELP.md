# md-rush - minimal CLI code editor

## Usage

```
md-rush [options] [file]
```

- `file` — optional path to open. If omitted, starts with an empty buffer.

## Options

- `-p`, `--print`  Print the highlighted contents of `file` to stdout and exit (no editor UI).
- `-c`, `--copy`   Copy entire `file` to the system clipboard and print its first 3 lines.
- `-h`, `--help`, `-?`  Show this help text.

## Editor basics

- Modes: Normal (`Esc`), Insert (`i`), Command (`:`), Visual (`v`).
- Movement: arrows, `g g` to top, `G` to bottom, mouse wheel to scroll.
- Editing: `i` enter insert, `Backspace`/`Enter` work as expected.
- Selection: `v` to start visual; `y` yank; `p` paste.
- Undo: `u`.
- Save: `:w` (writes current file); Quit: `:q`; Save+Quit: `:wq`.

## Highlighting

- Auto-detects base language from file extension: Markdown, JS, HTML, Bash.
- Uses a lightweight custom highlighter with language plugins.

## Notes

- Uses ANSI escape codes; best in a true-color terminal.
- Mouse support: requires a terminal that sends SGR mouse events (1006).
