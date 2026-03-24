# markrush

A blazing-fast, minimal CLI editor with VIM-inspired motions and real-time syntax highlighting.

**Features:**
- ⚡ Builds in under 2 seconds
- 🎨 Real-time syntax highlighting (Markdown, JavaScript, HTML, Bash)
- ⌨️ VIM-like keybindings (normal, insert, visual, command modes)
- 📋 System clipboard integration
- 🖱️ Mouse support
- 🪶 Lightweight with zero external dependencies

## Quick Start

### Installation

```bash
cargo build --release
./target/release/md-rush
```

### Usage

```bash
# Edit a file
md-rush path/to/file.md

# Print file with syntax highlighting
md-rush -p file.md

# Copy file to clipboard
md-rush -c file.md

# Open empty buffer
md-rush
```

## Editor Modes

| Mode | Activation | Purpose |
|------|-----------|---------|
| **Normal** | `Esc` | Navigation & commands |
| **Insert** | `i` | Text editing |
| **Visual** | `v` | Selection & manipulation |
| **Command** | `:` | File operations |

## Keybindings

### Navigation (Normal Mode)
- `↑ ↓ ← →` or `hjkl` — Move cursor
- `gg` — Jump to top
- `G` — Jump to bottom
- Mouse wheel — Scroll

### Editing (Insert Mode)
- `i` — Enter insert mode
- `Backspace` / `Enter` — Delete / newline
- `Esc` — Return to normal mode

### Selection (Visual Mode)
- `v` — Start visual selection
- `y` — Yank (copy)
- `p` — Paste
- Works across applications

### Commands
- `:w` — Save file
- `:q` — Quit
- `:wq` — Save and quit
- `u` — Undo

## Tech Stack

- **Language**: Rust (core) + JavaScript (utilities)
- **Syntax Highlighting**: Custom lightweight engine with language plugins
- **Terminal**: ANSI escape codes (true-color support required)
- **Input**: VIM-inspired keybindings with mouse support

## Architecture

```
src/
├── main.rs              # Entry point & editor loop
├── highlight-core.rs    # Syntax highlighting engine
├── struct.rs            # Data structures
├── ui/                  # Terminal UI rendering
├── app/                 # Application state
└── highlight/           # Language-specific highlighters
```

## Requirements

- Rust 2021 edition
- Terminal with:
  - True-color support (24-bit)
  - SGR mouse event support (1006) for mouse interactions

## Development

```bash
# Run in development mode
cargo run -- path/to/file.md

# Build release
cargo build --release
```

## License

[Add your license here]

## Contributing

Contributions welcome! Please open issues and pull requests.

For full command documentation, run:
```bash
md-rush --help
```