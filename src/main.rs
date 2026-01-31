#[path = "highlight-core.rs"]
mod highlight_core;

use highlight_core::{Highlighter, TokenKind, REGISTRY};
use std::{
    env,
    fs,
    io::{self, Read, StdinLock, Write},
    process::{self, Command, Stdio},
};

const HEADER_COLOR: &str = "\u{1b}[1;36m"; // bright cyan for headings
const CODE_COLOR: &str = "\u{1b}[38;5;70m"; // soft green for code blocks
const LINK_COLOR: &str = "\u{1b}[1;34m"; // bright blue for links
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
    highlighter: Highlighter<'static>,
}

impl Editor {
    fn open(path: Option<&str>, screen_rows: usize) -> Self {
        let (buffer, filename) = if let Some(path) = path {
            let buf = fs::read_to_string(path)
                .map(|content| content.lines().map(|l| l.to_string()).collect())
                .unwrap_or_else(|_| vec![String::new()]);
            (buf, Some(path.to_string()))
        } else {
            (vec![String::new()], None)
        };

        Self {
            buffer,
            row: 0,
            col: 0,
            filename,
            clipboard: None,
            undo: Vec::new(),
            status: String::from("NORMAL"),
            mode: Mode::Normal,
            dirty: false,
            command: String::new(),
            pending_g: false,
            scroll: 0,
            screen_rows: screen_rows.max(3),
            selection_active: false,
            sel_start_row: 0,
            sel_start_col: 0,
            highlighter: Highlighter { registry: &REGISTRY },
        }
    }

    fn snapshot(&self) -> Snapshot {
        Snapshot {
            buffer: self.buffer.clone(),
            row: self.row,
            col: self.col.min(self.buffer.get(self.row).map(|l| l.len()).unwrap_or(0)),
            dirty: self.dirty,
        }
    }

    fn push_undo(&mut self) {
        self.undo.push(self.snapshot());
        if self.undo.len() > 200 {
            self.undo.remove(0);
        }
    }

    fn restore(&mut self, snap: Snapshot) {
        self.buffer = snap.buffer;
        self.row = snap.row.min(self.buffer.len().saturating_sub(1));
        self.col = snap.col.min(self.buffer[self.row].len());
        self.dirty = snap.dirty;
        self.status = String::from("undone");
        self.update_scroll();
    }

    fn render(&self) {
        print!("\x1b[2J\x1b[H"); // clear screen

        let content_rows = self.screen_rows.saturating_sub(1);

        let full_text = self.buffer.join("\n");
        let line_starts = compute_line_starts(&self.buffer);
        let selection_abs = self
            .selection_bounds()
            .map(|((sr, sc), (er, ec))| {
                let start = line_starts
                    .get(sr)
                    .copied()
                    .unwrap_or(0)
                    .saturating_add(sc);
                let end = line_starts
                    .get(er)
                    .copied()
                    .unwrap_or(0)
                    .saturating_add(ec);
                (start, end)
            });

        let tokens = self.highlighter.highlight(&full_text);
        let mut token_idx = 0usize;

        for idx in 0..content_rows {
            let line_idx = self.scroll + idx;
            if line_idx >= self.buffer.len() {
                println!();
                continue;
            }

            let line_start = line_starts[line_idx];
            let line_end = line_start + self.buffer[line_idx].len();

            while token_idx < tokens.len() && tokens[token_idx].range.end <= line_start {
                token_idx += 1;
            }

            let mut line_out = String::new();
            let mut pos = line_start;
            let mut local_idx = token_idx;
            while local_idx < tokens.len() {
                let tok = &tokens[local_idx];
                if tok.range.start >= line_end {
                    break;
                }

                let seg_start = tok.range.start.max(line_start);
                let seg_end = tok.range.end.min(line_end);

                if pos < seg_start {
                    line_out.push_str(&render_segment(
                        &full_text,
                        pos,
                        seg_start,
                        None,
                        selection_abs,
                    ));
                }

                line_out.push_str(&render_segment(
                    &full_text,
                    seg_start,
                    seg_end,
                    token_color(tok.kind),
                    selection_abs,
                ));

                pos = seg_end;

                if tok.range.end > line_end {
                    break;
                }
                local_idx += 1;
            }

            if pos < line_end {
                line_out.push_str(&render_segment(
                    &full_text,
                    pos,
                    line_end,
                    None,
                    selection_abs,
                ));
            }

            line_out.push_str(RESET);
            print!("{line_out}\r\n");

            token_idx = local_idx;
        }

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
            "\x1b[7m{} | {} | line {} col {}{}\x1b[0m",
            mode_label,
            status_text,
            self.row + 1,
            self.col + 1,
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

    fn set_status(&mut self, msg: impl Into<String>) {
        self.status = msg.into();
    }

    fn update_scroll(&mut self) {
        let content_rows = self.screen_rows.saturating_sub(1);
        if self.row < self.scroll {
            self.scroll = self.row;
        } else if self.row >= self.scroll + content_rows {
            self.scroll = self.row.saturating_sub(content_rows - 1);
        }
    }

    fn ensure_cursor(&mut self) {
        if self.row >= self.buffer.len() {
            self.row = self.buffer.len().saturating_sub(1);
        }
        if let Some(line) = self.buffer.get(self.row) {
            self.col = clamp_char_boundary(line, self.col);
        }
        self.update_scroll();
    }

    fn insert_char(&mut self, ch: char) {
        self.push_undo();
        self.dirty = true;
        let line = self.buffer.get_mut(self.row).unwrap();
        self.col = clamp_char_boundary(line, self.col);
        line.insert(self.col, ch);
        self.col = self.col.saturating_add(ch.len_utf8());
    }

    fn backspace(&mut self) {
        if self.row == 0 && self.col == 0 {
            return;
        }

        self.push_undo();
        self.dirty = true;

        if self.col > 0 {
            let line = self.buffer.get_mut(self.row).unwrap();
            self.col = clamp_char_boundary(line, self.col);
            let prev = prev_char_boundary(line, self.col);
            line.replace_range(prev..self.col, "");
            self.col = prev;
        } else if self.row > 0 {
            let prev_len = self.buffer[self.row - 1].len();
            let current = self.buffer.remove(self.row);
            self.row -= 1;
            self.col = prev_len;
            self.buffer[self.row].push_str(&current);
        }
        self.ensure_cursor();
    }

    fn new_line(&mut self) {
        self.push_undo();
        self.dirty = true;
        let current = self.buffer.get_mut(self.row).unwrap();
        self.col = clamp_char_boundary(current, self.col);
        let right = current.split_off(self.col);
        self.row += 1;
        self.buffer.insert(self.row, right);
        self.col = 0;
    }

    fn enter_insert(&mut self) {
        self.mode = Mode::Insert;
        self.pending_g = false;
        self.selection_active = false;
        self.set_status("INSERT");
    }

    fn enter_normal(&mut self) {
        self.mode = Mode::Normal;
        self.command.clear();
        self.pending_g = false;
        self.selection_active = false;
        self.set_status("NORMAL");
        self.ensure_cursor();
    }

    fn enter_command(&mut self) {
        self.mode = Mode::Command;
        self.command.clear();
        self.pending_g = false;
        self.selection_active = false;
        self.set_status("COMMAND");
    }

    fn yank_line(&mut self) {
        if let Some(line) = self.buffer.get(self.row) {
            self.clipboard = Some(line.clone());
            copy_to_system(line);
            self.selection_active = false;
            self.set_status("yanked");
        }
    }

    fn delete_line(&mut self) {
        if self.buffer.is_empty() {
            return;
        }

        self.push_undo();
        self.dirty = true;
        let removed = self.buffer.remove(self.row);
        self.clipboard = Some(removed);
        if self.row >= self.buffer.len() && !self.buffer.is_empty() {
            self.row = self.buffer.len() - 1;
        }
        if self.buffer.is_empty() {
            self.buffer.push(String::new());
            self.row = 0;
        }
        self.col = 0;
        self.ensure_cursor();
    }

    fn paste_line(&mut self) {
        if let Some(mut text) = self.clipboard.clone().or_else(read_system_clipboard) {
            self.push_undo();
            self.dirty = true;
            self.selection_active = false;
            if text.is_empty() {
                return;
            }
            if !text.ends_with('\n') {
                text.push('\n');
            }
            let lines: Vec<&str> = text.split('\n').collect();
            let insert_lines = lines.len().saturating_sub(1); // trailing empty after split
            let mut insert_at = self.row + 1;
            for l in lines.into_iter().take(insert_lines) {
                self.buffer.insert(insert_at, l.to_string());
                insert_at += 1;
            }
            if self.buffer.is_empty() {
                self.buffer.push(String::new());
            }
            let last_idx = insert_at.saturating_sub(1);
            if last_idx < self.buffer.len() {
                self.row = last_idx;
                self.col = self.buffer[self.row].len();
            } else {
                self.row = self.buffer.len().saturating_sub(1);
                self.col = self.buffer[self.row].len();
            }
            self.ensure_cursor();
        }
    }

    fn undo(&mut self) {
        if let Some(snap) = self.undo.pop() {
            self.restore(snap);
        } else {
            self.set_status("nothing to undo");
        }
    }

    fn move_word_start(&mut self) {
        let line = &self.buffer[self.row];
        if self.col >= line.len() {
            if self.row + 1 < self.buffer.len() {
                self.row += 1;
                self.col = 0;
            }
            return;
        }
        let bytes = line.as_bytes();
        let mut idx = self.col;
        while idx < bytes.len() && bytes[idx].is_ascii_alphabetic() {
            idx += 1;
        }
        while idx < bytes.len() && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }
        self.col = idx.min(line.len());
    }

fn move_word_end(&mut self) {
        let line = &self.buffer[self.row];
        if self.col >= line.len() {
            if self.row + 1 < self.buffer.len() {
                self.row += 1;
                self.col = self.buffer[self.row].len();
            }
            return;
        }
        let bytes = line.as_bytes();
        let mut idx = self.col;
        while idx < bytes.len() && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }
        while idx < bytes.len() && !bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }
        self.col = idx.min(line.len());
    }

    fn save(&mut self, path: Option<&str>) -> bool {
        if let Some(p) = path {
            self.filename = Some(p.to_string());
        }
        let Some(name) = &self.filename else {
            self.set_status("No file name");
            return false;
        };
        match fs::write(name, self.buffer.join("\n")) {
            Ok(_) => {
                self.dirty = false;
                self.set_status("written");
                true
            }
            Err(err) => {
                self.set_status(format!("write failed: {err}"));
                false
            }
        }
    }

    fn start_selection(&mut self) {
        self.selection_active = true;
        self.sel_start_row = self.row;
        self.sel_start_col = self.col;
        self.set_status("VISUAL");
    }

    fn clear_selection(&mut self) {
        self.selection_active = false;
    }

    fn selection_bounds(&self) -> Option<((usize, usize), (usize, usize))> {
        if !self.selection_active {
            return None;
        }
        let start = (self.sel_start_row, self.sel_start_col);
        let end = (self.row, self.col);
        if start <= end {
            Some((start, end))
        } else {
            Some((end, start))
        }
    }

    fn selection_text(&self) -> Option<String> {
        let ((sr, sc), (er, ec)) = self.selection_bounds()?;
        if sr >= self.buffer.len() || er >= self.buffer.len() {
            return None;
        }
        let mut out = String::new();
        if sr == er {
            let line = &self.buffer[sr];
            let end_idx = ec.min(line.len());
            let start_idx = sc.min(end_idx);
            out.push_str(&line[start_idx..end_idx]);
            return Some(out);
        }

        let first = &self.buffer[sr];
        out.push_str(&first[sc.min(first.len())..]);
        out.push('\n');
        for r in (sr + 1)..er {
            out.push_str(&self.buffer[r]);
            out.push('\n');
        }
        let last = &self.buffer[er];
        let end_idx = ec.min(last.len());
        out.push_str(&last[..end_idx]);
        Some(out)
    }

    fn yank_selection(&mut self) {
        if let Some(text) = self.selection_text() {
            self.clipboard = Some(text.clone());
            copy_to_system(&text);
            self.clear_selection();
            self.set_status("yanked");
        }
    }

    fn delete_selection(&mut self) {
        if let Some(((sr, sc), (er, ec))) = self.selection_bounds() {
            if sr >= self.buffer.len() || er >= self.buffer.len() {
                self.clear_selection();
                return;
            }
            self.push_undo();
            self.dirty = true;
            let mut deleted = String::new();
            if sr == er {
                let line = &mut self.buffer[sr];
                let end_idx = ec.min(line.len());
                let start_idx = sc.min(end_idx);
                deleted.push_str(&line[start_idx..end_idx]);
                line.replace_range(start_idx..end_idx, "");
                self.col = start_idx;
                self.row = sr;
            } else {
                let first = &mut self.buffer[sr];
                let tail = first.split_off(sc.min(first.len()));
                deleted.push_str(&tail);
                deleted.push('\n');

                for _ in (sr + 1)..er {
                    let removed = self.buffer.remove(sr + 1);
                    deleted.push_str(&removed);
                    deleted.push('\n');
                }

                let last_line = &mut self.buffer[sr + 1];
                let end_idx = ec.min(last_line.len());
                deleted.push_str(&last_line[..end_idx]);
                last_line.replace_range(0..end_idx, "");

                let remaining = self.buffer.remove(sr + 1);
                self.buffer[sr].push_str(&remaining);
                self.row = sr;
                self.col = sc;
            }
            if self.buffer.is_empty() {
                self.buffer.push(String::new());
                self.row = 0;
                self.col = 0;
            }
            self.clipboard = Some(deleted.clone());
            copy_to_system(&deleted);
            self.clear_selection();
            self.ensure_cursor();
        }
    }

    fn move_up(&mut self) {
        if self.row > 0 {
            self.row -= 1;
            self.ensure_cursor();
        }
    }

    fn move_down(&mut self) {
        if self.row + 1 < self.buffer.len() {
            self.row += 1;
            self.ensure_cursor();
        }
    }

    fn move_left(&mut self) {
        if self.col > 0 {
            let line = &self.buffer[self.row];
            self.col = prev_char_boundary(line, self.col);
        } else if self.row > 0 {
            self.row -= 1;
            self.col = self.buffer[self.row].len();
        }
        self.ensure_cursor();
    }

    fn move_right(&mut self) {
        let len = self.buffer[self.row].len();
        if self.col < len {
            let line = &self.buffer[self.row];
            self.col = next_char_boundary(line, self.col);
        } else if self.row + 1 < self.buffer.len() {
            self.row += 1;
            self.col = 0;
        }
        self.ensure_cursor();
    }

    fn open_file(&mut self, path: &str) {
        match fs::read_to_string(path) {
            Ok(content) => {
                self.push_undo();
                self.buffer = content.lines().map(|l| l.to_string()).collect();
                if self.buffer.is_empty() {
                    self.buffer.push(String::new());
                }
                self.row = 0;
                self.col = 0;
                self.filename = Some(path.to_string());
                self.dirty = false;
                self.set_status(format!("opened {path}"));
            }
            Err(err) => self.set_status(format!("open failed: {err}")),
        }
        self.scroll = 0;
        self.ensure_cursor();
    }

    fn scroll_up(&mut self, lines: usize) {
        if self.row > 0 {
            self.row = self.row.saturating_sub(lines);
        }
        self.ensure_cursor();
    }

    fn scroll_down(&mut self, lines: usize) {
        if self.row + 1 < self.buffer.len() {
            self.row = (self.row + lines).min(self.buffer.len().saturating_sub(1));
        }
        self.ensure_cursor();
    }
}

fn read_key(stdin: &mut StdinLock) -> io::Result<Key> {
    let mut buf = [0u8; 1];
    loop {
        let read = stdin.read(&mut buf)?;
        if read == 0 {
            continue;
        }
        let b = buf[0];
        return Ok(match b {
            b'\r' | b'\n' => Key::Enter,
            127 | 8 => Key::Backspace,
            27 => {
                // Escape sequence or bare Esc
                let mut seq = [0u8; 2];
                let first = stdin.read(&mut seq[..1])?;
                if first == 0 {
                    Key::Esc
                } else if seq[0] != b'[' {
                    Key::Esc
                } else {
                    let second_read = stdin.read(&mut seq[1..2])?;
                    if second_read == 0 {
                        Key::Esc
                    } else {
                        match seq[1] {
                            b'A' => Key::Up,
                            b'B' => Key::Down,
                            b'C' => Key::Right,
                            b'D' => Key::Left,
                            b'H' => Key::Home,
                            b'F' => Key::End,
                            b'1' | b'7' => {
                                let mut tilde = [0u8; 1];
                                if stdin.read(&mut tilde)? == 1 && tilde[0] == b'~' {
                                    Key::Home
                                } else {
                                    Key::Esc
                                }
                            }
                            b'4' | b'8' => {
                                let mut tilde = [0u8; 1];
                                if stdin.read(&mut tilde)? == 1 && tilde[0] == b'~' {
                                    Key::End
                                } else {
                                    Key::Esc
                                }
                            }
                            b'<' => {
                                // SGR mouse mode: \x1b[<btn;col;rowM
                                let mut data = Vec::new();
                                let mut byte_buf = [0u8; 1];
                                loop {
                                    let r = stdin.read(&mut byte_buf)?;
                                    if r == 0 {
                                        continue;
                                    }
                                    let c = byte_buf[0];
                                    if c == b'M' || c == b'm' {
                                        break;
                                    }
                                    data.push(c);
                                }
                                let text = String::from_utf8_lossy(&data);
                                let mut parts = text.split(';');
                                let btn = parts.next().and_then(|s| s.parse::<i32>().ok());
                                match btn {
                                    Some(64) => Key::WheelUp,
                                    Some(65) => Key::WheelDown,
                                    _ => Key::Esc,
                                }
                            }
                            _ => Key::Esc,
                        }
                    }
                }
            }
            b'G' => Key::G,
            b'g' => Key::LittleG,
            byte if byte >= 0x80 => Key::Unknown, // ignore non-ASCII input for stability
            _ => {
                if let Some(ch) = char::from_u32(b as u32) {
                    Key::Char(ch)
                } else {
                    continue;
                }
            }
        });
    }
}

fn color_links(line: &str, base_color: Option<&str>) -> String {
    let mut out = String::new();
    if let Some(color) = base_color {
        out.push_str(color);
    }

    let mut idx = 0;
    let bytes = line.as_bytes();
    while let Some(rel_start) = line[idx..].find('[') {
        let start = idx + rel_start;
        // find "]("
        if let Some(rel_mid) = line[start..].find("](") {
            let mid = start + rel_mid;
            if let Some(rel_end) = line[mid + 2..].find(')') {
                let end = mid + 2 + rel_end;
                out.push_str(&line[idx..start]);
                let link = &line[start..=end];
                out.push_str(LINK_COLOR);
                out.push_str(link);
                if let Some(color) = base_color {
                    out.push_str(color);
                } else {
                    out.push_str(RESET);
                }
                idx = end + 1;
                continue;
            }
        }
        out.push_str(&line[idx..=start]);
        idx = start + 1;
    }
    if idx < bytes.len() {
        out.push_str(&line[idx..]);
    }
    out
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

fn token_color(kind: TokenKind) -> Option<&'static str> {
    match kind {
        TokenKind::MdHeading => Some(HEADER_COLOR),
        TokenKind::MdFence | TokenKind::MdCodeSpan => Some(CODE_COLOR),
        TokenKind::MdEmph => Some("\u{1b}[35m"),
        TokenKind::Keyword => Some("\u{1b}[1;34m"),
        TokenKind::String => Some("\u{1b}[38;5;114m"),
        TokenKind::Comment => Some("\u{1b}[38;5;244m"),
        TokenKind::Number => Some("\u{1b}[1;33m"),
        TokenKind::Tag | TokenKind::AttrName => Some("\u{1b}[1;35m"),
        TokenKind::AttrValue => Some("\u{1b}[38;5;180m"),
        TokenKind::Var => Some("\u{1b}[32m"),
        TokenKind::Operator => Some("\u{1b}[1;37m"),
        _ => None,
    }
}

fn render_segment(
    full_text: &str,
    start: usize,
    end: usize,
    base_color: Option<&str>,
    selection_abs: Option<(usize, usize)>,
) -> String {
    if start >= end || start >= full_text.len() {
        return String::new();
    }

    let end = end.min(full_text.len());
    if let Some((sel_start, sel_end)) = selection_abs {
        if sel_end <= start || sel_start >= end {
            let mut out = color_links(&full_text[start..end], base_color);
            out.push_str(RESET);
            return out;
        }

        let sel_s = sel_start.max(start);
        let sel_e = sel_end.min(end);

        let mut out = String::new();
        if start < sel_s {
            out.push_str(&color_links(&full_text[start..sel_s], base_color));
            out.push_str(RESET);
        }

        out.push_str(SEL_BG);
        if let Some(color) = base_color {
            out.push_str(color);
        }
        out.push_str(&full_text[sel_s..sel_e]);
        out.push_str(RESET);

        if sel_e < end {
            out.push_str(&color_links(&full_text[sel_e..end], base_color));
            out.push_str(RESET);
        }
        return out;
    }

    let mut out = color_links(&full_text[start..end], base_color);
    out.push_str(RESET);
    out
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

fn read_system_clipboard() -> Option<String> {
    if let Ok(output) = Command::new("pbpaste").output() {
        if output.status.success() {
            return String::from_utf8(output.stdout).ok();
        }
    }
    if let Ok(output) = Command::new("xclip")
        .args(["-o", "-selection", "clipboard"])
        .output()
    {
        if output.status.success() {
            return String::from_utf8(output.stdout).ok();
        }
    }
    None
}

fn clamp_char_boundary(line: &str, col: usize) -> usize {
    if col >= line.len() {
        return line.len();
    }
    if line.is_char_boundary(col) {
        col
    } else {
        let mut c = col;
        while c > 0 && !line.is_char_boundary(c) {
            c -= 1;
        }
        c
    }
}

fn prev_char_boundary(line: &str, col: usize) -> usize {
    if col == 0 {
        return 0;
    }
    let mut c = col.saturating_sub(1).min(line.len());
    while c > 0 && !line.is_char_boundary(c) {
        c -= 1;
    }
    c
}

fn next_char_boundary(line: &str, col: usize) -> usize {
    if col >= line.len() {
        return line.len();
    }
    let mut c = col + 1;
    while c < line.len() && !line.is_char_boundary(c) {
        c += 1;
    }
    c.min(line.len())
}

fn main() {
    let args: Vec<String> = env::args().collect();

    let _raw = RawModeGuard::new().unwrap_or_else(|_| {
        eprintln!("Failed to enter raw mode");
        process::exit(1);
    });

    let term_rows = Command::new("stty")
        .arg("size")
        .output()
        .ok()
        .and_then(|out| String::from_utf8(out.stdout).ok())
        .and_then(|s| {
            let mut parts = s.split_whitespace();
            parts.next()?.parse::<usize>().ok()
        })
        .unwrap_or(24);

    let mut editor = Editor::open(args.get(1).map(|s| s.as_str()), term_rows);
    let stdin = io::stdin();
    let mut stdin = stdin.lock();

    editor.render();

    loop {
        let key = match read_key(&mut stdin) {
            Ok(k) => k,
            Err(_) => continue,
        };

        match editor.mode {
            Mode::Insert => match key {
                Key::Esc => editor.enter_normal(),
                Key::Backspace => editor.backspace(),
                Key::Enter => editor.new_line(),
                Key::Home => editor.col = 0,
                Key::End => editor.col = editor.buffer[editor.row].len(),
                Key::Up => editor.move_up(),
                Key::Down => editor.move_down(),
                Key::Left => editor.move_left(),
                Key::Right => editor.move_right(),
                Key::WheelUp => editor.scroll_up(3),
                Key::WheelDown => editor.scroll_down(3),
                Key::LittleG => editor.insert_char('g'),
                Key::G => editor.insert_char('G'),
                Key::Char(ch) if !ch.is_control() => editor.insert_char(ch),
                Key::Unknown => editor.set_status("Non-ASCII input not supported"),
                _ => {}
            },
            Mode::Command => match key {
                Key::Esc => editor.enter_normal(),
                Key::Enter => {
                    let cmd = editor.command.trim().to_string();
                    editor.enter_normal();
                    let mut parts = cmd.split_whitespace();
                    let head = parts.next().unwrap_or("");
                    let arg = parts.next();
                    match head {
                        "q!" => break,
                        "q" => {
                            if editor.dirty {
                                editor.set_status("Unsaved changes");
                            } else {
                                break;
                            }
                        }
                        "w" => {
                            let path = arg.filter(|s| !s.is_empty());
                            editor.save(path);
                        }
                        "wq" => {
                            let path = arg.filter(|s| !s.is_empty());
                            if editor.save(path) {
                                break;
                            } else {
                                editor.set_status("No file name");
                            }
                        }
                        "e" => {
                            if let Some(p) = arg {
                                editor.open_file(p);
                            } else {
                                editor.set_status("Missing file name");
                            }
                        }
                        "" => {}
                        _ => editor.set_status(format!("Unknown :{cmd}")),
                    }
                }
                Key::Backspace => {
                    editor.command.pop();
                }
                Key::Home => {}
                Key::End => {}
                Key::Up | Key::Down | Key::Left | Key::Right | Key::WheelUp | Key::WheelDown => {}
                Key::Char(ch) if !ch.is_control() => editor.command.push(ch),
                Key::Unknown => {}
                _ => {}
            },
            Mode::Normal => {
                if editor.pending_g {
                    editor.pending_g = false;
                    if matches!(key, Key::LittleG) {
                        editor.row = 0;
                        editor.col = 0;
                        editor.ensure_cursor();
                        editor.render();
                        continue;
                    }
                }

                match key {
                    Key::Esc => editor.enter_normal(),
                    Key::Char(':') => editor.enter_command(),
                    Key::Char('i') => editor.enter_insert(),
                    Key::Char('I') => {
                        editor.col = 0;
                        editor.enter_insert();
                    }
                    Key::Char('a') => {
                        editor.col = editor
                            .col
                            .saturating_add(1)
                            .min(editor.buffer[editor.row].len());
                        editor.enter_insert();
                    }
                    Key::Char('A') => {
                        editor.col = editor.buffer[editor.row].len();
                        editor.enter_insert();
                    }
                    Key::Char('o') => {
                        editor.push_undo();
                        editor.dirty = true;
                        editor.row += 1;
                        editor.buffer.insert(editor.row, String::new());
                        editor.col = 0;
                        editor.enter_insert();
                    }
                    Key::Char('O') => {
                        editor.push_undo();
                        editor.dirty = true;
                        editor.buffer.insert(editor.row, String::new());
                        editor.col = 0;
                        editor.enter_insert();
                    }
                    Key::Char('v') => {
                        if editor.selection_active {
                            editor.clear_selection();
                            editor.set_status("NORMAL");
                        } else {
                            editor.start_selection();
                        }
                    }
                    Key::Char('y') => {
                        if editor.selection_active {
                            editor.yank_selection();
                        } else if let Ok(Key::Char('y')) = read_key(&mut stdin) {
                            editor.yank_line();
                            copy_to_system(editor.clipboard.as_deref().unwrap_or_default());
                        }
                    }
                    Key::Char('d') => {
                        if let Ok(Key::Char('d')) = read_key(&mut stdin) {
                            editor.delete_line();
                        }
                    }
                    Key::Char('p') => editor.paste_line(),
                    Key::Char('x') => {
                        if editor.selection_active {
                            editor.delete_selection();
                        } else if !editor.buffer.is_empty() {
                            editor.push_undo();
                            editor.dirty = true;
                            let line = &mut editor.buffer[editor.row];
                            if editor.col < line.len() {
                                let ch = line.remove(editor.col).to_string();
                                editor.clipboard = Some(ch.clone());
                                copy_to_system(&ch);
                            }
                            editor.ensure_cursor();
                        }
                    }
                    Key::Char('u') => editor.undo(),
                    Key::Char('w') => editor.move_word_start(),
                    Key::Char('e') => editor.move_word_end(),
                    Key::Home => editor.col = 0,
                    Key::End => editor.col = editor.buffer[editor.row].len(),
                    Key::Up => editor.move_up(),
                    Key::Down => editor.move_down(),
                    Key::Left => editor.move_left(),
                    Key::Right => editor.move_right(),
                    Key::WheelUp => editor.scroll_up(3),
                    Key::WheelDown => editor.scroll_down(3),
                    Key::G => {
                        editor.row = editor.buffer.len().saturating_sub(1);
                        editor.col = editor.buffer[editor.row].len();
                    }
                    Key::LittleG => {
                        editor.pending_g = true;
                    }
                    _ => {}
                }
            }
        }

        editor.ensure_cursor();
        editor.render();
    }
}
