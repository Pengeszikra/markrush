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
    filename: String,
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
}

impl Editor {
    fn open(path: &str, screen_rows: usize) -> Self {
        let buffer = fs::read_to_string(path)
            .map(|content| content.lines().map(|l| l.to_string()).collect())
            .unwrap_or_else(|_| vec![String::new()]);

        Self {
            buffer,
            row: 0,
            col: 0,
            filename: path.to_string(),
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

        // Determine starting code-block state up to scroll offset
        let mut in_code = false;
        for line in self.buffer.iter().take(self.scroll) {
            if line.trim_start().starts_with("```") {
                in_code = !in_code;
            }
        }

        let content_rows = self.screen_rows.saturating_sub(1);
        for idx in 0..content_rows {
            let line_idx = self.scroll + idx;
            if line_idx >= self.buffer.len() {
                println!();
                continue;
            }
            let line = &self.buffer[line_idx];
            let trimmed = line.trim_start();
            let selection_range = if let Some(((sr, sc), (er, ec))) = self.selection_bounds() {
                if line_idx < sr || line_idx > er {
                    None
                } else if sr == er {
                    Some((sc, ec))
                } else if line_idx == sr {
                    Some((sc, line.len()))
                } else if line_idx == er {
                    Some((0, ec))
                } else {
                    Some((0, line.len()))
                }
            } else {
                None
            };

            if trimmed.starts_with("```") {
                let color = if in_code { HEADER_COLOR } else { CODE_COLOR };
                let rendered = render_with_selection(line, Some(color), selection_range);
                println!("{rendered}{RESET}");
                in_code = !in_code;
            } else if in_code {
                let rendered = render_with_selection(line, Some(CODE_COLOR), selection_range);
                println!("{rendered}{RESET}");
            } else if trimmed.starts_with('#') {
                let rendered = render_with_selection(line, Some(HEADER_COLOR), selection_range);
                println!("{rendered}{RESET}");
            } else {
                let rendered = render_with_selection(line, None, selection_range);
                println!("{rendered}{RESET}");
            }
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
        let line_len = self.buffer.get(self.row).map(|l| l.len()).unwrap_or(0);
        if self.col > line_len {
            self.col = line_len;
        }
        self.update_scroll();
    }

    fn insert_char(&mut self, ch: char) {
        self.push_undo();
        self.dirty = true;
        let line = self.buffer.get_mut(self.row).unwrap();
        if self.col > line.len() {
            self.col = line.len();
        }
        line.insert(self.col, ch);
        self.col += 1;
    }

    fn backspace(&mut self) {
        if self.row == 0 && self.col == 0 {
            return;
        }

        self.push_undo();
        self.dirty = true;

        if self.col > 0 {
            let line = self.buffer.get_mut(self.row).unwrap();
            self.col -= 1;
            line.remove(self.col);
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

    fn save(&mut self) {
        if fs::write(&self.filename, self.buffer.join("\n")).is_ok() {
            self.dirty = false;
            self.set_status("written");
        } else {
            self.set_status("write failed");
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
            self.col -= 1;
        } else if self.row > 0 {
            self.row -= 1;
            self.col = self.buffer[self.row].len();
        }
        self.ensure_cursor();
    }

    fn move_right(&mut self) {
        let len = self.buffer[self.row].len();
        if self.col < len {
            self.col += 1;
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
                self.filename = path.to_string();
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

fn render_with_selection(line: &str, base_color: Option<&str>, sel: Option<(usize, usize)>) -> String {
    if sel.is_none() {
        return color_links(line, base_color);
    }

    let (mut start, mut end) = sel.unwrap();
    let len = line.len();
    start = start.min(len);
    end = end.min(len);
    if start > end {
        std::mem::swap(&mut start, &mut end);
    }

    let pre = &line[..start];
    let mid = &line[start..end];
    let post = &line[end..];

    let mut out = String::new();
    out.push_str(&color_links(pre, base_color));

    out.push_str(SEL_BG);
    if let Some(color) = base_color {
        out.push_str(color);
    }
    out.push_str(mid);
    out.push_str(RESET);

    out.push_str(&color_links(post, base_color));
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

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <markdown-file>", args[0]);
        process::exit(1);
    }

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

    let mut editor = Editor::open(&args[1], term_rows);
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
                _ => {}
            },
            Mode::Command => match key {
                Key::Esc => editor.enter_normal(),
                Key::Enter => {
                    let cmd = editor.command.trim().to_string();
                    editor.enter_normal();
                    if cmd == "q!" {
                        break;
                    } else if cmd == "q" {
                        if editor.dirty {
                            editor.set_status("Unsaved changes");
                        } else {
                            break;
                        }
                    } else if cmd == "w" {
                        editor.save();
                    } else if cmd == "wq" {
                        editor.save();
                        break;
                    } else if let Some(rest) = cmd.strip_prefix("e ") {
                        let path = rest.trim();
                        if !path.is_empty() {
                            editor.open_file(path);
                        }
                    } else {
                        editor.set_status(format!("Unknown :{cmd}"));
                    }
                }
                Key::Backspace => {
                    editor.command.pop();
                }
                Key::Home => {}
                Key::End => {}
                Key::Up | Key::Down | Key::Left | Key::Right | Key::WheelUp | Key::WheelDown => {}
                Key::Char(ch) if !ch.is_control() => editor.command.push(ch),
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
