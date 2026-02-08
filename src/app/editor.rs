use std::fs;
use std::io::{self, Write};
use std::path::Path;

use crate::highlight::{HighlighterEngine, REGISTRY as NEW_REGISTRY, WindowReq, PluginId as NewPluginId, Span as NewSpan};
use crate::highlight_core::{Highlighter as OldHighlighter, REGISTRY as OLD_REGISTRY};
use crate::ui;
use crate::app::helpers::{compute_line_starts, copy_to_system, load_buffer, max_scroll, read_terminal_size, select_plugin_for_path};
use crate::r#struct::{Key, Mode, RESET};

#[derive(Clone)]
pub struct Snapshot {
    pub buffer: Vec<String>,
    pub row: usize,
    pub col: usize,
    pub dirty: bool,
}

pub struct Editor {
    pub buffer: Vec<String>,
    pub row: usize,
    pub col: usize,
    pub filename: Option<String>,
    pub clipboard: Option<String>,
    pub undo: Vec<Snapshot>,
    pub status: String,
    pub mode: Mode,
    pub dirty: bool,
    pub command: String,
    pub pending_g: bool,
    pub scroll: usize,
    pub screen_rows: usize,
    pub selection_active: bool,
    pub sel_start_row: usize,
    pub sel_start_col: usize,

    #[allow(dead_code)]
    pub highlighter: OldHighlighter<'static>,

    pub highlight_engine: HighlighterEngine<'static>,
    pub use_new_highlighter: bool,
    pub last_new_span_count: usize,

    #[allow(dead_code)]
    pub base_plugin: NewPluginId,

    pub last_new_spans: Vec<NewSpan>,
}

impl Editor {
    pub fn open(path: Option<&str>, screen_rows: usize) -> Self {
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
        }
    }

    pub fn selection_bounds(&self) -> Option<((usize, usize), (usize, usize))> {
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

    pub fn clamp_cursor(&mut self) {
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

    pub fn ensure_cursor_visible(&mut self) {
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

    pub fn refresh_terminal_rows(&mut self) {
        let rows = read_terminal_size().map(|(r, _)| r).unwrap_or(24);
        self.screen_rows = rows.max(3);
    }

    pub fn run_new_highlighter(&mut self, full_text: &str, line_starts: &[usize], content_rows: usize) {
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
    }

    pub fn render(&mut self) {
        self.refresh_terminal_rows();
        print!("\x1b[2J\x1b[H");

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

        if self.use_new_highlighter {
            self.run_new_highlighter(&full_text, &line_starts, content_rows);
        } else {
            self.last_new_span_count = 0;
            self.last_new_spans.clear();
        }

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
            "\x1b[{};1H\x1b[2K\x1b[7m{} | {} | line {} col {} | spans {}{}\x1b[0m",
            status_row,
            mode_label,
            status_text,
            self.row + 1,
            self.col + 1,
            self.last_new_span_count,
            if self.dirty { " [+]" } else { "" }
        );

        if self.mode == Mode::Command {
            let cursor_row = content_rows + 1;
            let cursor_col = mode_label.len() + 4 + self.command.len();
            print!("\x1b[{};{}H", cursor_row, cursor_col.max(1));
        } else {
            let cursor_row = self.row.saturating_sub(self.scroll).saturating_add(1).max(1);
            let cursor_col = self.col + 1;
            print!("\x1b[{};{}H", cursor_row, cursor_col);
        }

        let _ = io::stdout().flush();
    }

    pub fn insert_char(&mut self, c: char) {
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
        }
        let line = &mut self.buffer[self.row];
        let insert_at = self.col.min(line.len());
        line.insert(insert_at, c);
        self.col += c.len_utf8();
        self.dirty = true;
    }

    pub fn insert_newline(&mut self) {
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
        }
        let line = &mut self.buffer[self.row];
        let split_at = self.col.min(line.len());
        let rest = line.split_off(split_at);
        self.row += 1;
        self.col = 0;
        self.buffer.insert(self.row, rest);
        self.dirty = true;
    }

    pub fn backspace(&mut self) {
        if self.row >= self.buffer.len() {
            return;
        }
        if self.col == 0 {
            if self.row == 0 {
                return;
            }
            let cur = self.buffer.remove(self.row);
            self.row -= 1;
            let prev = &mut self.buffer[self.row];
            let prev_len = prev.len();
            prev.push_str(&cur);
            self.col = prev_len;
            self.dirty = true;
            return;
        }

        let line = &mut self.buffer[self.row];
        if self.col > 0 && self.col <= line.len() {
            let mut idx = self.col;
            while idx > 0 && !line.is_char_boundary(idx) {
                idx -= 1;
            }
            let prev_idx = line[..idx].char_indices().last().map(|(i, _)| i).unwrap_or(0);
            line.drain(prev_idx..idx);
            self.col = prev_idx;
            self.dirty = true;
        }
    }

    pub fn save_snapshot(&mut self) {
        let snap = Snapshot {
            buffer: self.buffer.clone(),
            row: self.row,
            col: self.col,
            dirty: self.dirty,
        };
        self.undo.push(snap);
        if self.undo.len() > 200 {
            self.undo.remove(0);
        }
    }

    pub fn undo(&mut self) {
        if let Some(snap) = self.undo.pop() {
            self.buffer = snap.buffer;
            self.row = snap.row;
            self.col = snap.col;
            self.dirty = snap.dirty;
            self.status = "Undo".to_string();
        }
    }

    pub fn open_line_below(&mut self) {
        self.save_snapshot();
        if self.row >= self.buffer.len() {
            self.buffer.push(String::new());
        }
        let insert_at = self.row + 1;
        self.buffer.insert(insert_at, String::new());
        self.row = insert_at;
        self.col = 0;
        self.mode = Mode::Insert;
        self.dirty = true;
    }

    pub fn open_line_above(&mut self) {
        self.save_snapshot();
        let insert_at = self.row.min(self.buffer.len());
        self.buffer.insert(insert_at, String::new());
        self.row = insert_at;
        self.col = 0;
        self.mode = Mode::Insert;
        self.dirty = true;
    }

    pub fn command_append_line_end(&mut self) {
        self.mode = Mode::Insert;
        if self.row < self.buffer.len() {
            self.col = self.buffer[self.row].len();
        } else {
            self.col = 0;
        }
    }

    pub fn command_insert_line_start(&mut self) {
        self.mode = Mode::Insert;
        self.col = 0;
    }

    pub fn yank_selection(&mut self) {
        let Some(((sr, sc), (er, ec))) = self.selection_bounds() else {
            self.status = "No selection".to_string();
            return;
        };

        let mut out = String::new();
        for r in sr..=er {
            if r >= self.buffer.len() {
                break;
            }
            let line = &self.buffer[r];
            let start = if r == sr { sc.min(line.len()) } else { 0 };
            let end = if r == er { ec.min(line.len()) } else { line.len() };
            if start <= end {
                out.push_str(&line[start..end]);
            }
            if r != er {
                out.push('\n');
            }
        }

        self.clipboard = Some(out.clone());
        copy_to_system(&out);
        self.status = "Yanked selection".to_string();
    }

    pub fn paste_clipboard(&mut self) {
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

    pub fn apply_command(&mut self) -> bool {
        let cmd = self.command.trim().to_string();
        self.command.clear();

        match cmd.as_str() {
            "q" => {
                if self.dirty {
                    self.status = "No write since last change (add ! to override)".to_string();
                    return false;
                }
                return true;
            }
            "q!" => return true,
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
            "wq!" => {
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

    pub fn handle_key(&mut self, key: Key) -> bool {
        match self.mode {
            Mode::Normal => {
                match key {
                    Key::Char('i') => {
                        self.pending_g = false;
                        self.mode = Mode::Insert;
                        self.status.clear();
                    }
                    Key::Char('A') => {
                        self.command_append_line_end();
                        self.pending_g = false;
                    }
                    Key::Char('I') => {
                        self.command_insert_line_start();
                        self.pending_g = false;
                    }
                    Key::Char('u') => {
                        self.undo();
                        self.pending_g = false;
                    }
                    Key::Char('o') => {
                        self.open_line_below();
                        self.pending_g = false;
                    }
                    Key::Char('O') => {
                        self.open_line_above();
                        self.pending_g = false;
                    }
                    Key::Char(':') => {
                        self.mode = Mode::Command;
                        self.command.clear();
                        self.pending_g = false;
                    }
                    Key::Char('v') => {
                        self.selection_active = !self.selection_active;
                        if self.selection_active {
                            self.sel_start_row = self.row;
                            self.sel_start_col = self.col;
                            self.status = "Visual".to_string();
                        } else {
                            self.status.clear();
                        }
                        self.pending_g = false;
                    }
                    Key::Char('y') => {
                        self.yank_selection();
                        self.selection_active = false;
                        self.pending_g = false;
                    }
                    Key::Char('p') => {
                        self.save_snapshot();
                        self.paste_clipboard();
                        self.pending_g = false;
                    }
                    Key::LittleG => {
                        if self.pending_g {
                            self.row = 0;
                            self.col = 0;
                            self.scroll = 0;
                            self.pending_g = false;
                        } else {
                            self.pending_g = true;
                        }
                    }
                    Key::G => {
                        self.row = self.buffer.len().saturating_sub(1);
                        self.col = self.buffer.get(self.row).map(|l| l.len()).unwrap_or(0);
                        self.pending_g = false;
                    }
                    Key::Home => {
                        self.col = 0;
                        self.pending_g = false;
                    }
                    Key::End => {
                        self.clamp_cursor();
                        self.col = self.buffer[self.row].len();
                        self.pending_g = false;
                    }
                    Key::Up => {
                        self.row = self.row.saturating_sub(1);
                        self.col = self.col.min(self.buffer.get(self.row).map(|l| l.len()).unwrap_or(0));
                        self.pending_g = false;
                    }
                    Key::Down => {
                        if self.row + 1 < self.buffer.len() {
                            self.row += 1;
                            self.col = self.col.min(self.buffer[self.row].len());
                        }
                        self.pending_g = false;
                    }
                    Key::Left => {
                        self.col = self.col.saturating_sub(1);
                        self.pending_g = false;
                    }
                    Key::Right => {
                        self.col = (self.col + 1).min(self.buffer[self.row].len());
                        self.pending_g = false;
                    }
                    Key::WheelUp => {
                        self.pending_g = false;
                        if !self.buffer.is_empty() {
                            self.row = self.row.saturating_sub(3);
                            if self.row >= self.buffer.len() {
                                self.row = self.buffer.len().saturating_sub(1);
                            }
                            self.col = self.col.min(self.buffer[self.row].len());
                        }
                        let max_scroll = max_scroll(self.buffer.len(), self.screen_rows);
                        self.scroll = self.scroll.saturating_sub(3).min(max_scroll);
                    }
                    Key::WheelDown => {
                        self.pending_g = false;
                        if !self.buffer.is_empty() {
                            let max_row = self.buffer.len().saturating_sub(1);
                            self.row = (self.row + 3).min(max_row);
                            self.col = self.col.min(self.buffer[self.row].len());
                        }
                        let max_scroll = max_scroll(self.buffer.len(), self.screen_rows);
                        self.scroll = (self.scroll + 3).min(max_scroll);
                    }
                    Key::Esc => {
                        self.selection_active = false;
                        self.pending_g = false;
                    }
                    _ => {
                        self.pending_g = false;
                    }
                }
            }
            Mode::Insert => {
                match key {
                    Key::Esc => {
                        self.mode = Mode::Normal;
                        self.pending_g = false;
                    }
                    Key::Enter => {
                        self.save_snapshot();
                        self.insert_newline();
                    }
                    Key::Backspace => {
                        self.save_snapshot();
                        self.backspace();
                    }
                    Key::Char(c) => {
                        self.save_snapshot();
                        self.insert_char(c);
                    }
                    Key::LittleG => {
                        self.save_snapshot();
                        self.insert_char('g');
                    }
                    Key::G => {
                        self.save_snapshot();
                        self.insert_char('G');
                    }
                    _ => {}
                }
            }
            Mode::Command => {
                match key {
                    Key::Esc => {
                        self.mode = Mode::Normal;
                        self.command.clear();
                        self.pending_g = false;
                    }
                    Key::Enter => {
                        let should_quit = self.apply_command();
                        self.mode = Mode::Normal;
                        if should_quit {
                            return true;
                        }
                        self.pending_g = false;
                    }
                    Key::Backspace => {
                        self.command.pop();
                    }
                    Key::Char(c) => {
                        self.command.push(c);
                    }
                    _ => {}
                }
            }
        }
        false
    }

    pub fn finish(&self) {
        print!("{}", RESET);
        let _ = io::stdout().flush();
    }
}
