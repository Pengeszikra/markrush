#[path = "highlight-core.rs"]
mod highlight_core;
mod highlight;
mod ui;

use highlight_core::{Highlighter as OldHighlighter, REGISTRY as OLD_REGISTRY};
use crate::highlight::{HighlighterEngine, REGISTRY as NEW_REGISTRY, WindowReq, PluginId as NewPluginId, Span as NewSpan};
use std::{
    env,
    fs,
    io::{self, BufWriter, Read, StdinLock, Write},
    process::{self, Command, Stdio},
    path::Path,
    str,
    time::Instant,
};

const RESET: &str = "\u{1b}[0m";
const HIGHLIGHT_BUDGET_BYTES: usize = 512 * 1024;
const HIGHLIGHT_BUDGET_SPANS: usize = 200_000;
const IDLE_BUDGET_BYTES: usize = 256 * 1024;

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

#[derive(PartialEq, Clone, Copy)]
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
    buffer_revision: u64,
}

#[derive(Clone, PartialEq)]
struct UiState {
    row: usize,
    col: usize,
    scroll: usize,
    mode: Mode,
    selection_active: bool,
    sel_start_row: usize,
    sel_start_col: usize,
    command: String,
    status: String,
    dirty: bool,
    buffer_revision: u64,
    screen_rows: usize,
}

impl From<&Editor> for UiState {
    fn from(ed: &Editor) -> Self {
        Self {
            row: ed.row,
            col: ed.col,
            scroll: ed.scroll,
            mode: ed.mode,
            selection_active: ed.selection_active,
            sel_start_row: ed.sel_start_row,
            sel_start_col: ed.sel_start_col,
            command: ed.command.clone(),
            status: ed.status.clone(),
            dirty: ed.dirty,
            buffer_revision: ed.buffer_revision,
            screen_rows: ed.screen_rows,
        }
    }
}

struct CliConfig {
    file: Option<String>,
    print_mode: bool,
    help: bool,
    copy_mode: bool,
    time_mode: bool,
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

    buffer_revision: u64,
    last_highlight_revision: u64,
    last_highlight_window: Option<WindowReq>,
    last_highlight_screen_rows: usize,
    last_highlight_quality_exact: bool,
    last_highlight_mode: Mode,
    last_highlight_selection_active: bool,
}

impl Editor {
    fn open(path: Option<&str>, screen_rows: usize) -> Self {
        let (buffer, filename) = if let Some(path) = path {
            let buf = if Path::new(path).exists() {
                load_buffer(path)
            } else {
                vec![String::new()]
            };
            (buf, Some(path.to_string()))
        } else {
            (vec![String::new()], None)
        };

        let base_plugin = filename
            .as_deref()
            .map(select_plugin_for_path)
            .unwrap_or(NewPluginId::Markdown);

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

            buffer_revision: 0,
            last_highlight_revision: u64::MAX,
            last_highlight_window: None,
            last_highlight_screen_rows: screen_rows,
            last_highlight_quality_exact: false,
            last_highlight_mode: Mode::Normal,
            last_highlight_selection_active: false,
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

    fn clamp_cursor(&mut self) {
        if self.buffer.is_empty() {
            self.buffer.push(String::new());
        }
        let max_row = self.buffer.len().saturating_sub(1);
        if self.row > max_row {
            self.row = max_row;
        }
        let line_len = self.buffer.get(self.row).map(|l| l.len()).unwrap_or(0);
        if self.col > line_len {
            self.col = line_len;
        }
    }

    fn ensure_cursor_visible(&mut self) {
        let max_scroll = max_scroll(self.buffer.len(), self.screen_rows);
        if self.scroll > max_scroll {
            self.scroll = max_scroll;
        }

        self.clamp_cursor();
        let content_rows = self.screen_rows.saturating_sub(1);
        if self.row < self.scroll {
            self.scroll = self.row;
        } else if self.row >= self.scroll + content_rows {
            self.scroll = self.row.saturating_sub(content_rows.saturating_sub(1));
        }
    }

    fn refresh_terminal_rows(&mut self) -> bool {
        let rows = read_terminal_size().map(|(r, _)| r).unwrap_or(24);
        let normalized = rows.max(3);
        let changed = normalized != self.screen_rows;
        self.screen_rows = normalized;
        changed
    }

    fn window_request(&self, line_starts: &[usize], content_rows: usize, full_len: usize) -> Option<WindowReq> {
        if self.buffer.is_empty() {
            return None;
        }

        let start_line = self.scroll.min(self.buffer.len().saturating_sub(1));
        let end_line = (self.scroll + content_rows.saturating_mul(3)).min(self.buffer.len().saturating_sub(1));

        let window_start = *line_starts.get(start_line).unwrap_or(&0);
        let window_end = if end_line + 1 < line_starts.len() {
            line_starts[end_line + 1]
        } else {
            full_len
        };

        Some(WindowReq { start: window_start, end: window_end })
    }

    fn sync_highlighter_revision(&mut self) {
        self.highlight_engine.set_revision(self.buffer_revision, self.base_plugin);
    }

    fn update_highlighting(&mut self, full_text: &str, line_starts: &[usize], content_rows: usize) {
        if !self.use_new_highlighter {
            self.last_new_span_count = 0;
            self.last_new_spans.clear();
            self.last_highlight_window = None;
            self.last_highlight_quality_exact = true;
            return;
        }

        let Some(window) = self.window_request(line_starts, content_rows, full_text.len()) else {
            self.last_new_span_count = 0;
            self.last_new_spans.clear();
            self.last_highlight_window = None;
            self.last_highlight_quality_exact = true;
            return;
        };

        let needs_highlight = self.last_highlight_window != Some(window)
            || self.last_highlight_revision != self.buffer_revision
            || self.last_highlight_screen_rows != self.screen_rows
            || self.last_highlight_mode != self.mode
            || self.last_highlight_selection_active != self.selection_active;

        if !needs_highlight {
            return;
        }

        self.sync_highlighter_revision();

        let res = self.highlight_engine.highlight_window(
            full_text,
            window,
            HIGHLIGHT_BUDGET_BYTES,
            HIGHLIGHT_BUDGET_SPANS,
        );

        self.last_highlight_window = Some(window);
        self.last_highlight_revision = self.buffer_revision;
        self.last_highlight_screen_rows = self.screen_rows;
        self.last_highlight_mode = self.mode;
        self.last_highlight_selection_active = self.selection_active;
        self.last_highlight_quality_exact = res.quality_exact;
        self.last_new_span_count = res.spans.len();
        self.last_new_spans = res.spans;
    }

    fn mark_edited(&mut self) {
        self.buffer_revision = self.buffer_revision.wrapping_add(1);
        self.highlight_engine.set_revision(self.buffer_revision, self.base_plugin);
        self.last_highlight_window = None;
    }

    fn render(&mut self) {
        print!("\x1b[2J\x1b[H"); // clear screen

        let content_rows = self.screen_rows.saturating_sub(1);

        self.clamp_cursor();

        let full_text = self.buffer.join("\n");
        let line_starts = compute_line_starts(&self.buffer);

        let selection_abs = self
            .selection_bounds()
            .map(|((sr, sc), (er, ec))| {
                let start = line_starts.get(sr).copied().unwrap_or(0).saturating_add(sc);
                let end = line_starts.get(er).copied().unwrap_or(0).saturating_add(ec);
                (start, end)
            });

        self.update_highlighting(&full_text, &line_starts, content_rows);

        let mut stdout = io::stdout();
        let _ = ui::render::render_content_lines(
            &full_text,
            &self.buffer,
            &line_starts,
            self.scroll,
            content_rows,
            &self.last_new_spans,
            selection_abs,
            &mut stdout,
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

        let status_row = content_rows + 1;
        print!(
            "\x1b[{};1H\x1b[2K\x1b[7m{} | {} | line {} col {} | spans {}{}{}\x1b[0m",
            status_row,
            mode_label,
            status_text,
            self.row + 1,
            self.col + 1,
            self.last_new_span_count,
            if self.last_highlight_quality_exact { "" } else { " (~)" },
            if self.dirty { " [+]" } else { "" }
        );

        if self.mode == Mode::Command {
            let cursor_row = content_rows + 1;
            let cursor_col = mode_label.len() + 4 + self.command.len(); // after "MODE | :"
            print!("\x1b[{};{}H", cursor_row, cursor_col.max(1));
        } else {
            let cursor_row = self.row.saturating_sub(self.scroll).saturating_add(1).max(1);
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
        self.mark_edited();
    }

    fn insert_newline(&mut self) {
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
            self.row = self.buffer.len() - 1;
            self.col = 0;
            self.dirty = true;
            self.mark_edited();
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
        self.mark_edited();
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
                self.mark_edited();
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
            self.mark_edited();
        }
    }

    fn command_append_line_end(&mut self) {
        self.clamp_cursor();
        self.col = self.buffer[self.row].len();
        self.pending_g = false;
        self.mode = Mode::Insert;
        self.status.clear();
    }

    fn open_line_below(&mut self) {
        self.clamp_cursor();
        self.save_snapshot();

        let insert_at = (self.row + 1).min(self.buffer.len());
        if insert_at >= self.buffer.len() {
            self.buffer.push(String::new());
        } else {
            self.buffer.insert(insert_at, String::new());
        }

        self.row = insert_at;
        self.col = 0;
        self.pending_g = false;
        self.mode = Mode::Insert;
        self.dirty = true;
        self.status.clear();
        self.mark_edited();
    }

    fn save_snapshot(&mut self) {
        self.undo.push(Snapshot {
            buffer: self.buffer.clone(),
            row: self.row,
            col: self.col,
            dirty: self.dirty,
            buffer_revision: self.buffer_revision,
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
            self.buffer_revision = self.buffer_revision.max(s.buffer_revision);
            self.mark_edited();
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

fn clamp_row(row: usize, buffer: &[String]) -> usize {
    if buffer.is_empty() {
        0
    } else {
        row.min(buffer.len().saturating_sub(1))
    }
}

fn max_scroll(buffer_len: usize, screen_rows: usize) -> usize {
    let content_rows = screen_rows.saturating_sub(1);
    if content_rows == 0 {
        0
    } else {
        buffer_len.saturating_sub(content_rows)
    }
}

fn load_buffer(path: &str) -> Vec<String> {
    let content = fs::read_to_string(path).unwrap_or_default();
    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
    if content.ends_with('\n') {
        lines.push(String::new());
    }
    if lines.is_empty() {
        lines.push(String::new());
    }
    lines
}

fn read_terminal_size() -> Option<(usize, usize)> {
    // Try ioctl first for accurate size.
    #[cfg(unix)]
    {
        if let Some(ws) = unix_winsize() {
            return Some(ws);
        }
    }

    // Fallback to `stty size`.
    if let Ok(out) = Command::new("stty").arg("size").output() {
        if let Ok(s) = String::from_utf8(out.stdout) {
            let mut parts = s.split_whitespace();
            if let (Some(r), Some(c)) = (parts.next(), parts.next()) {
                if let (Ok(r), Ok(c)) = (r.parse::<usize>(), c.parse::<usize>()) {
                    return Some((r, c));
                }
            }
        }
    }

    None
}

fn select_plugin_for_path(path: &str) -> NewPluginId {
    let ext = Path::new(path)
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase());

    match ext.as_deref() {
        Some("js") | Some("mjs") | Some("cjs") => NewPluginId::Js,
        Some("html") | Some("htm") => NewPluginId::HtmlText,
        Some("sh") | Some("bash") => NewPluginId::Bash,
        Some("rs") => NewPluginId::Rust,
        Some("rush") | Some("md") | Some("markdown") => NewPluginId::Markdown,
        _ => NewPluginId::Markdown,
    }
}

#[cfg(unix)]
fn unix_winsize() -> Option<(usize, usize)> {
    use std::os::raw::{c_int, c_ulong};

    #[repr(C)]
    struct WinSize {
        ws_row: u16,
        ws_col: u16,
        ws_xpixel: u16,
        ws_ypixel: u16,
    }

    const STDOUT_FD: c_int = 1;

    #[cfg(any(target_os = "linux", target_os = "android"))]
    const TIOCGWINSZ: c_ulong = 0x5413;
    #[cfg(target_os = "macos")]
    const TIOCGWINSZ: c_ulong = 0x40087468;
    #[cfg(target_os = "freebsd")]
    const TIOCGWINSZ: c_ulong = 0x40087468;
    #[cfg(target_os = "netbsd")]
    const TIOCGWINSZ: c_ulong = 0x40087468;
    #[cfg(target_os = "openbsd")]
    const TIOCGWINSZ: c_ulong = 0x40087468;

    extern "C" {
        fn ioctl(fd: c_int, request: c_ulong, ...) -> c_int;
    }

    unsafe {
        let mut ws = WinSize { ws_row: 0, ws_col: 0, ws_xpixel: 0, ws_ypixel: 0 };
        if ioctl(STDOUT_FD, TIOCGWINSZ, &mut ws) == 0 {
            if ws.ws_row > 0 && ws.ws_col > 0 {
                return Some((ws.ws_row as usize, ws.ws_col as usize));
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::highlight::{HighlighterEngine, REGISTRY, WindowReq, PluginId, Span, StyleId};

    #[test]
    fn append_to_line_end_enters_insert_and_moves_cursor() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["hello".to_string()];
        ed.col = 2;
        ed.command_append_line_end();
        assert_eq!(ed.col, 5);
        assert!(matches!(ed.mode, Mode::Insert));
        assert_eq!(ed.row, 0);
    }

    #[test]
    fn open_line_below_inserts_empty_line_and_positions_cursor() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["aaa".into(), "bbb".into()];
        ed.row = 0;
        ed.open_line_below();

        assert_eq!(ed.buffer, vec!["aaa".to_string(), "".to_string(), "bbb".to_string()]);
        assert_eq!(ed.row, 1);
        assert_eq!(ed.col, 0);
        assert!(ed.dirty);
        assert!(matches!(ed.mode, Mode::Insert));
        assert_eq!(ed.undo.len(), 1);
    }

    #[test]
    fn clamp_cursor_limits_column_to_line_length() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["hi".into()];
        ed.col = 10;
        ed.clamp_cursor();
        assert_eq!(ed.col, 2);
    }

    #[test]
    fn copy_file_and_preview_errors_on_missing_file() {
        let res = copy_file_and_preview("definitely_missing_file_12345.md");
        assert!(res.is_err());
    }

    #[test]
    fn html_comment_in_fence_is_comment() {
        let src = "```html\n<!-- x -->\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Comment && &src[s.range.clone()] == "<!-- x -->"));
    }

    #[test]
    fn rust_macro_ident_is_keyword() {
        let src = "```rust\nprint!()\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Keyword && &src[s.range.clone()] == "print"));
    }

    #[test]
    fn jsdoc_tag_is_keyword_inside_comment() {
        let src = "```js\n/** @type {number} */\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Keyword && &src[s.range.clone()] == "@type"));
        assert!(spans.iter().any(|s| s.style == StyleId::Comment));
    }

    fn highlight(src: &str) -> Vec<Span> {
        let mut engine = HighlighterEngine::new(&REGISTRY, PluginId::Markdown);
        let res = engine.highlight_window(
            src,
            WindowReq { start: 0, end: src.len() },
            src.len().saturating_add(1024),
            200_000,
        );
        res.spans
    }
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
                b'<' => {
                    // SGR mouse (enabled via 1006h). Keep reading until the final M/m.
                    let mut seq = Vec::from(&buf[..n]);
                    while !seq.ends_with(b"M") && !seq.ends_with(b"m") {
                        let mut tmp = [0u8; 16];
                        match stdin.read(&mut tmp) {
                            Ok(0) | Err(_) => break,
                            Ok(m) => seq.extend_from_slice(&tmp[..m]),
                        }
                        if seq.len() > 32 {
                            break; // avoid runaway on malformed data
                        }
                    }
                    if seq.len() >= 6 {
                        if let Ok(body) = str::from_utf8(&seq[3..seq.len().saturating_sub(1)]) {
                            let mut parts = body.split(';');
                            if let (Some(btn), Some(_x), Some(_y)) = (parts.next(), parts.next(), parts.next()) {
                                if let Ok(code) = btn.parse::<u8>() {
                                    return match code {
                                        64 => Key::WheelUp,
                                        65 => Key::WheelDown,
                                        _ => Key::Unknown,
                                    };
                                }
                            }
                        }
                    }
                }
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

fn parse_args<I: Iterator<Item = String>>(args: I) -> CliConfig {
    let mut cfg = CliConfig { file: None, print_mode: false, help: false, copy_mode: false, time_mode: false };
    for arg in args {
        match arg.as_str() {
            "-p" | "--print" => cfg.print_mode = true,
            "-h" | "--help" | "-?" => cfg.help = true,
            "-c" | "--copy" => cfg.copy_mode = true,
            "-t" | "--time" => cfg.time_mode = true,
            _ if arg.starts_with('-') => {
                eprintln!("Unknown flag: {arg}");
            }
            _ => {
                if cfg.file.is_none() {
                    cfg.file = Some(arg);
                } else {
                    eprintln!("Ignoring extra argument: {arg}");
                }
            }
        }
    }
    cfg
}

fn print_highlighted(path: &str, log_time: bool) -> io::Result<()> {
    let t_read_start = Instant::now();
    if !Path::new(path).exists() {
        return Err(io::Error::new(io::ErrorKind::NotFound, "file not found"));
    }

    let content = fs::read_to_string(path)?;
    let mut buffer: Vec<String> = content.lines().map(|l| l.to_string()).collect();
    if content.ends_with('\n') {
        buffer.push(String::new());
    }
    if buffer.is_empty() {
        buffer.push(String::new());
    }

    let t_read = t_read_start.elapsed();

    let full_text = buffer.join("\n");
    let line_starts = compute_line_starts(&buffer);

    let base_plugin = select_plugin_for_path(path);
    let mut engine = HighlighterEngine::new(&NEW_REGISTRY, base_plugin);
    let t_highlight_start = Instant::now();
    let res = engine.highlight_window_full(
        &full_text,
        WindowReq { start: 0, end: full_text.len() },
        full_text.len().saturating_add(1024),
        200_000,
    );
    let t_highlight = t_highlight_start.elapsed();

    let t_render_start = Instant::now();
    let stdout = io::stdout();
    let mut writer = BufWriter::new(stdout.lock());
    ui::render::render_content_lines(
        &full_text,
        &buffer,
        &line_starts,
        0,
        buffer.len(),
        &res.spans,
        None,
        &mut writer,
    )?;
    writer.write_all(RESET.as_bytes())?;
    writer.flush()?;
    let t_render = t_render_start.elapsed();
    if log_time {
        eprintln!(
            "time read={}ms highlight={}ms render={}ms lines={}",
            t_read.as_millis(),
            t_highlight.as_millis(),
            t_render.as_millis(),
            buffer.len()
        );
    }
    Ok(())
}

fn copy_file_and_preview(path: &str) -> io::Result<()> {
    if !Path::new(path).exists() {
        return Err(io::Error::new(io::ErrorKind::NotFound, "file not found"));
    }
    let content = fs::read_to_string(path)?;
    copy_to_system(&content);

    println!(":: copy to clip >> {path}");
    Ok(())
}

fn main() {
    let config = parse_args(env::args().skip(1));
    if config.help {
        if let Err(e) = print_highlighted("HELP.md", config.time_mode) {
            eprintln!("Failed to show help: {e}");
        }
        return;
    }
    if config.copy_mode {
        let Some(path) = config.file.as_deref() else {
            eprintln!("No file provided for --copy");
            process::exit(1);
        };
        let start = Instant::now();
        let res = copy_file_and_preview(path);
        let elapsed = start.elapsed().as_millis();
        if let Err(e) = res {
            eprintln!("Failed to copy file: {e}");
            process::exit(1);
        }
        if config.time_mode {
            eprintln!("elapsed: {}ms", elapsed);
        }
        return;
    }
    if config.print_mode {
        let Some(path) = config.file.as_deref() else {
            eprintln!("No file provided for --print");
            process::exit(1);
        };
        let start = Instant::now();
        let res = print_highlighted(path, config.time_mode);
        let elapsed = start.elapsed().as_millis();
        if let Err(e) = res {
            eprintln!("Failed to print file: {e}");
            process::exit(1);
        }
        if config.time_mode {
            eprintln!("elapsed: {}ms", elapsed);
        }
        return;
    }

    let file = config.file;

    let _raw = match RawModeGuard::new() {
        Ok(g) => g,
        Err(e) => {
            eprintln!("Failed to enter raw mode: {e}");
            process::exit(1);
        }
    };

    let screen_rows = read_terminal_size().map(|(r, _)| r).unwrap_or(24);
    let mut editor = Editor::open(file.as_deref(), screen_rows);

    let stdin = io::stdin();
    let mut stdin = stdin.lock();

    let mut needs_render = true;

    loop {
        let resized = editor.refresh_terminal_rows();
        if resized {
            needs_render = true;
        }

        let mut rendered_this_iter = false;

        if needs_render {
            editor.ensure_cursor_visible();
            editor.render();
            needs_render = false;
            rendered_this_iter = true;
        }

        let before_state = UiState::from(&editor);
        let key = read_key(&mut stdin);
        if matches!(key, Key::Unknown) {
            if editor.use_new_highlighter && !editor.buffer.is_empty() {
                let full_text = editor.buffer.join("\n");
                editor.sync_highlighter_revision();
                editor.highlight_engine.do_idle_work(&full_text, IDLE_BUDGET_BYTES);
            }
            continue;
        }

        let mut should_quit = false;

        match editor.mode {
            Mode::Normal => {
                match key {
                    Key::Char('i') => {
                        editor.mode = Mode::Insert;
                        editor.status.clear();
                        editor.pending_g = false;
                    }
                    Key::Char('A') => {
                        editor.command_append_line_end();
                    }
                    Key::Char('o') => {
                        editor.open_line_below();
                    }
                    Key::Char('v') => {
                        editor.selection_active = true;
                        editor.sel_start_row = editor.row;
                        editor.sel_start_col = editor.col;
                        editor.status = "Visual mode".to_string();
                        editor.pending_g = false;
                    }
                    Key::Char('y') => {
                        if editor.selection_active {
                            editor.yank_selection();
                            editor.selection_active = false;
                        } else {
                            editor.status = "No selection".to_string();
                        }
                        editor.pending_g = false;
                    }
                    Key::Char('p') => {
                        editor.paste_clipboard();
                        editor.pending_g = false;
                    }
                    Key::Char('u') => {
                        editor.undo();
                        editor.pending_g = false;
                    }
                    Key::Char(':') => {
                        editor.mode = Mode::Command;
                        editor.command.clear();
                        editor.pending_g = false;
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
                    Key::Home => {
                        editor.col = 0;
                        editor.pending_g = false;
                    }
                    Key::End => {
                        editor.clamp_cursor();
                        editor.col = editor.buffer[editor.row].len();
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
                        if !editor.buffer.is_empty() {
                            editor.row = clamp_row(editor.row.saturating_sub(3), &editor.buffer);
                            editor.col = editor.col.min(editor.buffer[editor.row].len());
                        }
                        let max_scroll = max_scroll(editor.buffer.len(), editor.screen_rows);
                        editor.scroll = editor.scroll.saturating_sub(3).min(max_scroll);
                        if editor.scroll > max_scroll {
                            editor.scroll = max_scroll;
                        }
                        editor.pending_g = false;
                    }
                    Key::WheelDown => {
                        let content_rows = editor.screen_rows.saturating_sub(1);
                        if !editor.buffer.is_empty() {
                            let max_row = editor.buffer.len().saturating_sub(1);
                            editor.row = clamp_row((editor.row + 3).min(max_row), &editor.buffer);
                            editor.col = editor.col.min(editor.buffer[editor.row].len());
                        }
                        let max_scroll = max_scroll(editor.buffer.len(), editor.screen_rows);
                        if content_rows > 0 {
                            editor.scroll = (editor.scroll + 3).min(max_scroll);
                        }
                        editor.pending_g = false;
                    }
                    Key::Esc => {
                        editor.selection_active = false;
                        editor.pending_g = false;
                        editor.status.clear();
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
                    Key::LittleG => {
                        editor.save_snapshot();
                        editor.insert_char('g');
                    }
                    Key::G => {
                        editor.save_snapshot();
                        editor.insert_char('G');
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
                        let quit_now = editor.apply_command();
                        editor.mode = Mode::Normal;
                        if quit_now {
                            should_quit = true;
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

        if should_quit {
            print!("\x1b[2J\x1b[H");
            let _ = io::stdout().flush();
            break;
        }

        let after_state = UiState::from(&editor);
        if after_state != before_state || (resized && !rendered_this_iter) {
            needs_render = true;
        }
    }

    print!("{RESET}");
    let _ = io::stdout().flush();
}
