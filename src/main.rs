use std::{
    env,
    fs,
    io::{self, Read, StdinLock, Write},
    process::{self, Command},
};

const HEADER_COLOR: &str = "\u{1b}[1;36m"; // bright cyan for headings
const CODE_COLOR: &str = "\u{1b}[38;5;70m"; // soft green for code blocks
const LINK_COLOR: &str = "\u{1b}[1;34m"; // bright blue for links
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
            if trimmed.starts_with("```") {
                let color = if in_code { HEADER_COLOR } else { CODE_COLOR };
                println!("{color}{line}{RESET}");
                in_code = !in_code;
            } else if in_code {
                println!("{CODE_COLOR}{line}{RESET}");
            } else if trimmed.starts_with('#') {
                let colored = color_links(line, Some(HEADER_COLOR));
                println!("{colored}{RESET}");
            } else {
                let colored = color_links(line, None);
                println!("{colored}{RESET}");
            }
        }

        let mode_label = match self.mode {
            Mode::Normal => "-- NORMAL --",
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
        self.set_status("INSERT");
    }

    fn enter_normal(&mut self) {
        self.mode = Mode::Normal;
        self.command.clear();
        self.pending_g = false;
        self.set_status("NORMAL");
        self.ensure_cursor();
    }

    fn enter_command(&mut self) {
        self.mode = Mode::Command;
        self.command.clear();
        self.pending_g = false;
        self.set_status("COMMAND");
    }

    fn yank_line(&mut self) {
        if let Some(line) = self.buffer.get(self.row) {
            self.clipboard = Some(line.clone());
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
        if let Some(text) = self.clipboard.clone() {
            self.push_undo();
            self.dirty = true;
            self.row = self.row.min(self.buffer.len().saturating_sub(1));
            self.buffer.insert(self.row + 1, text);
            self.row += 1;
            self.col = 0;
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
                    Key::Char('y') => {
                        if let Ok(Key::Char('y')) = read_key(&mut stdin) {
                            editor.yank_line();
                        }
                    }
                    Key::Char('d') => {
                        if let Ok(Key::Char('d')) = read_key(&mut stdin) {
                            editor.delete_line();
                        }
                    }
                    Key::Char('p') => editor.paste_line(),
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
                        editor.col = 0;
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
