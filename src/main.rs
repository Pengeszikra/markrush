#[path = "highlight-core.rs"]
mod highlight_core;
mod highlight;
mod ui;

use highlight_core::{Highlighter as OldHighlighter, REGISTRY as OLD_REGISTRY};
use crate::highlight::{HighlighterEngine, REGISTRY as NEW_REGISTRY, WindowReq, PluginId as NewPluginId, Span as NewSpan};
use std::{
    env,
    fs,
    io::{self, Read, StdinLock, Write},
    process::{self, Command, Stdio},
    path::Path,
};

const SEL_BG: &str = "\u{1b}[48;5;238m"; // dark grey selection background
const RESET: &str = "\u{1b}[0m";

struct RawModeGuard;

impl RawModeGuard {
    fn new() -> io::Result<Self> {
        Command::new("stty")
            .args(["-icanon", "-echo", "min", "0", "time", "1"])
            .status()?;
        // Enable basic mouse tracking (SGR)
        print!("\x1b[?1000h\x1b[?1006h");
        let _ = io::stdout().flush();
        Ok(Self)
    }
}

impl Drop for RawModeGuard {
    fn drop(&mut self) {
        // Disable mouse tracking and restore terminal
        print!("\x1b[?1000l\x1b[?1006l");
        let _ = io::stdout().flush();
        let _ = Command::new("stty").arg("sane").status();
    }
}

#[derive(Debug)]
enum Key {
    Char(char),
    Enter,
    Backspace,
    Esc,
    Home,
    End,
    Up,
    Down,
    Left,
    Right,
    WheelUp,
    WheelDown,
    G,
    LittleG,
    Unknown,
}

#[derive(PartialEq)]
enum Mode {
    Normal,
    Insert,
    Command,
}

#[derive(Clone)]
struct Snapshot {
    buffer: Vec<String>,
    row: usize,
    col: usize,
    dirty: bool,
}

struct Editor {
    buffer: Vec<String>,
    row: usize,
    col: usize,
    filename: Option<String>,
    clipboard: Option<String>,
    undo: Vec<Snapshot>,
    status: String,
    mode: Mode,
    dirty: bool,
    command: String,
    pending_g: bool,
    scroll: usize,
    screen_rows: usize,
    selection_active: bool,
    sel_start_row: usize,
    sel_start_col: usize,

    // Keep old highlighter around for debugging/regression, but do not render it now.
    #[allow(dead_code)]
    highlighter: OldHighlighter<'static>,

    highlight_engine: HighlighterEngine<'static>,
    use_new_highlighter: bool,
    last_new_span_count: usize,

    #[allow(dead_code)]
    base_plugin: NewPluginId,

    last_new_spans: Vec<NewSpan>,
}

impl Editor {
    fn open(path: Option<&str>, screen_rows: usize) -> Self {
        let (buffer, filename) = if let Some(path) = path {
            let buf = if Path::new(path).exists() {
                let content = fs::read_to_string(path).unwrap_or_default();
                let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
                if content.ends_with('\n') {
                    lines.push(String::new());
                }
                if lines.is_empty() {
                    lines.push(String::new());
                }
                lines
            } else {
                vec![String::new()]
            };
            (buf, Some(path.to_string()))
        } else {
            (vec![String::new()], None)
        };

        let base_plugin = NewPluginId::Markdown;

        Self {
            buffer,
            row: 0,
            col: 0,
            filename,
            clipboard: None,
            undo: Vec::new(),
            status: String::new(),
            mode: Mode::Normal,
            dirty: false,
            command: String::new(),
            pending_g: false,
            scroll: 0,
            screen_rows,
            selection_active: false,
            sel_start_row: 0,
            sel_start_col: 0,

            highlighter: OldHighlighter { registry: &OLD_REGISTRY },

            highlight_engine: HighlighterEngine::new(&NEW_REGISTRY, base_plugin),
            use_new_highlighter: true,
            last_new_span_count: 0,
            base_plugin,
            last_new_spans: Vec::new(),
        }
    }

    fn selection_bounds(&self) -> Option<((usize, usize), (usize, usize))> {
        if !self.selection_active {
            return None;
        }

        let (a_r, a_c) = (self.sel_start_row, self.sel_start_col);
        let (b_r, b_c) = (self.row, self.col);

        if (b_r, b_c) < (a_r, a_c) {
            Some(((b_r, b_c), (a_r, a_c)))
        } else {
            Some(((a_r, a_c), (b_r, b_c)))
        }
    }

    fn ensure_cursor_visible(&mut self) {
        let content_rows = self.screen_rows.saturating_sub(1);
        if self.row < self.scroll {
            self.scroll = self.row;
        } else if self.row >= self.scroll + content_rows {
            self.scroll = self.row.saturating_sub(content_rows.saturating_sub(1));
        }
    }

    fn refresh_terminal_rows(&mut self) {
        let mut rows_opt = None;

        if let Ok(out) = Command::new("stty").arg("size").output() {
            if let Ok(s) = String::from_utf8(out.stdout) {
                rows_opt = s
                    .split_whitespace()
                    .next()
                    .and_then(|p| p.parse::<usize>().ok());
            }
        }

        if let Some(r) = rows_opt {
            self.screen_rows = r.max(3);
        } else {
            self.screen_rows = 24;
        }
    }

    fn run_new_highlighter(&mut self, full_text: &str, line_starts: &[usize], content_rows: usize) {
        if !self.use_new_highlighter {
            return;
        }
        if self.buffer.is_empty() {
            self.last_new_span_count = 0;
            self.last_new_spans.clear();
            return;
        }

        let start_line = self.scroll.min(self.buffer.len().saturating_sub(1));
        let end_line = (self.scroll + content_rows.saturating_mul(3)).min(self.buffer.len().saturating_sub(1));

        let window_start = *line_starts.get(start_line).unwrap_or(&0);
        let window_end = if end_line + 1 < line_starts.len() {
            line_starts[end_line + 1]
        } else {
            full_text.len()
        };

        let res = self.highlight_engine.highlight_window(
            full_text,
            WindowReq { start: window_start, end: window_end },
            128 * 1024,
            50_000,
        );

        self.last_new_span_count = res.spans.len();
        self.last_new_spans = res.spans;

        // Intentionally disabled in this refactor pass:
        // keep highlight correctness development isolated from background work scheduling.
        // self.highlight_engine.do_idle_work(full_text, 256 * 1024);
    }

    fn render(&mut self) {
        self.refresh_terminal_rows();
        print!("\x1b[2J\x1b[H"); // clear screen

        let content_rows = self.screen_rows.saturating_sub(1);

        let full_text = self.buffer.join("\n");
        let line_starts = compute_line_starts(&self.buffer);

        let selection_abs = self
            .selection_bounds()
            .map(|((sr, sc), (er, ec))| {
                let start = line_starts.get(sr).copied().unwrap_or(0).saturating_add(sc);
                let end = line_starts.get(er).copied().unwrap_or(0).saturating_add(ec);
                (start, end)
            });

        if self.use_new_highlighter {
            self.run_new_highlighter(&full_text, &line_starts, content_rows);
        } else {
            self.last_new_span_count = 0;
            self.last_new_spans.clear();
        }

        ui::render::render_content_lines(
            &full_text,
            &self.buffer,
            &line_starts,
            self.scroll,
            content_rows,
            &self.last_new_spans,
            selection_abs,
        );

        let mode_label = match self.mode {
            Mode::Normal => {
                if self.selection_active {
                    "-- VISUAL --"
                } else {
                    "-- NORMAL --"
                }
            }
            Mode::Insert => "-- INSERT --",
            Mode::Command => "-- COMMAND --",
        };

        let status_text = if self.mode == Mode::Command {
            format!(":{}", self.command)
        } else {
            self.status.clone()
        };

        println!(
            "\x1b[7m{} | {} | line {} col {} | spans {}{}\x1b[0m",
            mode_label,
            status_text,
            self.row + 1,
            self.col + 1,
            self.last_new_span_count,
            if self.dirty { " [+]" } else { "" }
        );

        if self.mode == Mode::Command {
            let cursor_row = content_rows + 1;
            let cursor_col = mode_label.len() + 4 + self.command.len(); // after "MODE | :"
            print!("\x1b[{};{}H", cursor_row, cursor_col.max(1));
        } else {
            let cursor_row = self
                .row
                .saturating_sub(self.scroll)
                .saturating_add(1)
                .min(content_rows);
            let cursor_col = self.col + 1;
            print!("\x1b[{};{}H", cursor_row, cursor_col);
        }

        let _ = io::stdout().flush();
    }

    fn insert_char(&mut self, c: char) {
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
        }
        let line = &mut self.buffer[self.row];
        let insert_at = self.col.min(line.len());
        line.insert(insert_at, c);
        self.col += c.len_utf8();
        self.dirty = true;
    }

    fn insert_newline(&mut self) {
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
            self.row = self.buffer.len() - 1;
            self.col = 0;
            self.dirty = true;
            return;
        }

        let line = &mut self.buffer[self.row];
        let split_at = self.col.min(line.len());
        let new_line = line[split_at..].to_string();
        line.truncate(split_at);
        self.buffer.insert(self.row + 1, new_line);

        self.row += 1;
        self.col = 0;
        self.dirty = true;
    }

    fn backspace(&mut self) {
        if self.row >= self.buffer.len() {
            return;
        }

        if self.col > 0 {
            let line = &mut self.buffer[self.row];
            let remove_at = self.col.min(line.len());
            if remove_at > 0 {
                let prev = line[..remove_at].chars().last().unwrap();
                let prev_len = prev.len_utf8();
                let start = remove_at - prev_len;
                line.replace_range(start..remove_at, "");
                self.col = self.col.saturating_sub(prev_len);
                self.dirty = true;
            }
            return;
        }

        if self.row > 0 {
            let current = self.buffer.remove(self.row);
            self.row -= 1;
            let line = &mut self.buffer[self.row];
            let old_len = line.len();
            line.push_str(&current);
            self.col = old_len;
            self.dirty = true;
        }
    }

    fn save_snapshot(&mut self) {
        self.undo.push(Snapshot {
            buffer: self.buffer.clone(),
            row: self.row,
            col: self.col,
            dirty: self.dirty,
        });
        if self.undo.len() > 100 {
            self.undo.remove(0);
        }
    }

    fn undo(&mut self) {
        if let Some(s) = self.undo.pop() {
            self.buffer = s.buffer;
            self.row = s.row;
            self.col = s.col;
            self.dirty = s.dirty;
            self.ensure_cursor_visible();
        }
    }

    fn yank_selection(&mut self) {
        let Some(((sr, sc), (er, ec))) = self.selection_bounds() else { return; };
        if sr >= self.buffer.len() || er >= self.buffer.len() {
            return;
        }

        if sr == er {
            let line = &self.buffer[sr];
            let start = sc.min(line.len());
            let end = ec.min(line.len());
            let text = if start < end { &line[start..end] } else { "" };
            self.clipboard = Some(text.to_string());
            copy_to_system(text);
            self.status = "Yanked selection".to_string();
            return;
        }

        let mut out = String::new();
        for r in sr..=er {
            let line = &self.buffer[r];
            if r == sr {
                let start = sc.min(line.len());
                out.push_str(&line[start..]);
                out.push('\n');
            } else if r == er {
                let end = ec.min(line.len());
                out.push_str(&line[..end]);
            } else {
                out.push_str(line);
                out.push('\n');
            }
        }

        self.clipboard = Some(out.clone());
        copy_to_system(&out);
        self.status = "Yanked selection".to_string();
    }

    fn paste_clipboard(&mut self) {
        let Some(text) = self.clipboard.clone() else {
            self.status = "Clipboard empty".to_string();
            return;
        };

        for ch in text.chars() {
            if ch == '\n' {
                self.insert_newline();
            } else {
                self.insert_char(ch);
            }
        }
        self.status = "Pasted".to_string();
    }

    fn apply_command(&mut self) -> bool {
        let cmd = self.command.trim().to_string();
        self.command.clear();

        match cmd.as_str() {
            "q" => return true,
            "w" => {
                if let Some(fname) = self.filename.clone() {
                    let content = self.buffer.join("\n");
                    let _ = fs::write(fname, content);
                    self.dirty = false;
                    self.status = "Saved".to_string();
                } else {
                    self.status = "No filename".to_string();
                }
            }
            "wq" => {
                if let Some(fname) = self.filename.clone() {
                    let content = self.buffer.join("\n");
                    let _ = fs::write(fname, content);
                    self.dirty = false;
                    return true;
                } else {
                    self.status = "No filename".to_string();
                }
            }
            _ => {
                self.status = format!("Unknown command: {}", cmd);
            }
        }
        false
    }
}

fn copy_to_system(text: &str) {
    if let Ok(mut child) = Command::new("pbcopy").stdin(Stdio::piped()).spawn() {
        if let Some(stdin) = &mut child.stdin {
            let _ = stdin.write_all(text.as_bytes());
        }
        let _ = child.wait();
        return;
    }

    if let Ok(mut child) = Command::new("xclip")
        .args(["-selection", "clipboard"])
        .stdin(Stdio::piped())
        .spawn()
    {
        if let Some(stdin) = &mut child.stdin {
            let _ = stdin.write_all(text.as_bytes());
        }
        let _ = child.wait();
    }
}

fn compute_line_starts(lines: &[String]) -> Vec<usize> {
    let mut starts = Vec::with_capacity(lines.len());
    let mut offset = 0usize;
    for (i, line) in lines.iter().enumerate() {
        starts.push(offset);
        offset += line.len();
        if i + 1 < lines.len() {
            offset += 1; // newline
        }
    }
    starts
}

fn buffer_total_len(lines: &[String]) -> usize {
    if lines.is_empty() {
        return 0;
    }
    let mut total = 0usize;
    for (i, line) in lines.iter().enumerate() {
        total += line.len();
        if i + 1 < lines.len() {
            total += 1; // newline
        }
    }
    total
}

fn read_key(stdin: &mut StdinLock<'_>) -> Key {
    let mut buf = [0u8; 8];
    let n = match stdin.read(&mut buf) {
        Ok(n) => n,
        Err(_) => 0,
    };
    if n == 0 {
        return Key::Unknown;
    }

    if buf[0] == b'\x1b' {
        if n >= 3 && buf[1] == b'[' {
            match buf[2] {
                b'A' => return Key::Up,
                b'B' => return Key::Down,
                b'C' => return Key::Right,
                b'D' => return Key::Left,
                b'H' => return Key::Home,
                b'F' => return Key::End,
                b'M' => {
                    if n >= 6 {
                        let button = buf[3];
                        if button == b'`' || button == b'a' {
                            return Key::WheelUp;
                        }
                        if button == b'b' || button == b'c' {
                            return Key::WheelDown;
                        }
                    }
                }
                _ => {}
            }
        }
        return Key::Esc;
    }

    if buf[0] == b'\r' || buf[0] == b'\n' {
        return Key::Enter;
    }
    if buf[0] == 127u8 {
        return Key::Backspace;
    }

    let ch = buf[0] as char;
    match ch {
        'g' => Key::LittleG,
        'G' => Key::G,
        _ => Key::Char(ch),
    }
}

fn main() {
    let mut args = env::args().skip(1);
    let file = args.next();

    let _raw = match RawModeGuard::new() {
        Ok(g) => g,
        Err(e) => {
            eprintln!("Failed to enter raw mode: {e}");
            process::exit(1);
        }
    };

    let screen_rows = 24;
    let mut editor = Editor::open(file.as_deref(), screen_rows);

    let stdin = io::stdin();
    let mut stdin = stdin.lock();

    loop {
        editor.ensure_cursor_visible();
        editor.render();

        let key = read_key(&mut stdin);
        match editor.mode {
            Mode::Normal => {
                match key {
                    Key::Char('i') => {
                        editor.mode = Mode::Insert;
                        editor.status.clear();
                    }
                    Key::Char('v') => {
                        editor.selection_active = true;
                        editor.sel_start_row = editor.row;
                        editor.sel_start_col = editor.col;
                        editor.status = "Visual mode".to_string();
                    }
                    Key::Char('y') => {
                        if editor.selection_active {
                            editor.yank_selection();
                            editor.selection_active = false;
                        } else {
                            editor.status = "No selection".to_string();
                        }
                    }
                    Key::Char('p') => {
                        editor.paste_clipboard();
                    }
                    Key::Char('u') => {
                        editor.undo();
                    }
                    Key::Char(':') => {
                        editor.mode = Mode::Command;
                        editor.command.clear();
                    }
                    Key::LittleG => {
                        if editor.pending_g {
                            editor.row = 0;
                            editor.col = 0;
                            editor.pending_g = false;
                        } else {
                            editor.pending_g = true;
                        }
                    }
                    Key::G => {
                        if !editor.buffer.is_empty() {
                            editor.row = editor.buffer.len() - 1;
                            editor.col = editor.col.min(editor.buffer[editor.row].len());
                        }
                        editor.pending_g = false;
                    }
                    Key::Up => {
                        editor.row = editor.row.saturating_sub(1);
                        editor.col = editor.col.min(editor.buffer[editor.row].len());
                        editor.pending_g = false;
                    }
                    Key::Down => {
                        if editor.row + 1 < editor.buffer.len() {
                            editor.row += 1;
                            editor.col = editor.col.min(editor.buffer[editor.row].len());
                        }
                        editor.pending_g = false;
                    }
                    Key::Left => {
                        editor.col = editor.col.saturating_sub(1);
                        editor.pending_g = false;
                    }
                    Key::Right => {
                        editor.col = (editor.col + 1).min(editor.buffer[editor.row].len());
                        editor.pending_g = false;
                    }
                    Key::WheelUp => {
                        editor.scroll = editor.scroll.saturating_sub(3);
                    }
                    Key::WheelDown => {
                        let total = buffer_total_len(&editor.buffer);
                        if total > 0 {
                            editor.scroll = (editor.scroll + 3).min(editor.buffer.len().saturating_sub(1));
                        }
                    }
                    Key::Esc => {
                        editor.selection_active = false;
                        editor.pending_g = false;
                    }
                    _ => {
                        editor.pending_g = false;
                    }
                }
            }
            Mode::Insert => {
                match key {
                    Key::Esc => {
                        editor.mode = Mode::Normal;
                        editor.pending_g = false;
                    }
                    Key::Enter => {
                        editor.save_snapshot();
                        editor.insert_newline();
                    }
                    Key::Backspace => {
                        editor.save_snapshot();
                        editor.backspace();
                    }
                    Key::Char(c) => {
                        editor.save_snapshot();
                        editor.insert_char(c);
                    }
                    _ => {}
                }
            }
            Mode::Command => {
                match key {
                    Key::Esc => {
                        editor.mode = Mode::Normal;
                        editor.command.clear();
                    }
                    Key::Enter => {
                        let should_quit = editor.apply_command();
                        editor.mode = Mode::Normal;
                        if should_quit {
                            print!("\x1b[2J\x1b[H");
                            let _ = io::stdout().flush();
                            break;
                        }
                    }
                    Key::Backspace => {
                        editor.command.pop();
                    }
                    Key::Char(c) => {
                        editor.command.push(c);
                    }
                    _ => {}
                }
            }
        }
    }

    print!("{RESET}");
    let _ = io::stdout().flush();
}

