use std::fs;
use std::io::{self, BufWriter, Write};
use std::path::Path;
use std::process::{Command, Stdio};

use crate::highlight::{HighlighterEngine, REGISTRY as NEW_REGISTRY, WindowReq, PluginId as NewPluginId};
use crate::ui;
use crate::r#struct::RESET;

pub fn copy_to_system(text: &str) {
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

pub fn compute_line_starts(lines: &[String]) -> Vec<usize> {
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

pub fn max_scroll(buffer_len: usize, screen_rows: usize) -> usize {
    let content_rows = screen_rows.saturating_sub(1);
    if content_rows == 0 {
        0
    } else {
        buffer_len.saturating_sub(content_rows)
    }
}

pub fn load_buffer(path: &str) -> Vec<String> {
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

pub fn read_terminal_size() -> Option<(usize, usize)> {
    #[cfg(unix)]
    {
        if let Some(ws) = unix_winsize() {
            return Some(ws);
        }
    }

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

pub fn select_plugin_for_path(path: &str) -> NewPluginId {
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

pub fn print_highlighted(path: &str) -> io::Result<()> {
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

    let full_text = buffer.join("\n");
    let line_starts = compute_line_starts(&buffer);

    let base_plugin = select_plugin_for_path(path);
    let mut engine = HighlighterEngine::new(&NEW_REGISTRY, base_plugin);
    let res = engine.highlight_window_full(
        &full_text,
        WindowReq { start: 0, end: full_text.len() },
        full_text.len().saturating_add(1024),
        200_000,
    );

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
    Ok(())
}

pub fn copy_file_and_preview(path: &str) -> io::Result<()> {
    if !Path::new(path).exists() {
        return Err(io::Error::new(io::ErrorKind::NotFound, "file not found"));
    }
    let content = fs::read_to_string(path)?;
    copy_to_system(&content);

    println!(":: copy to clip >> {path}");
    Ok(())
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
    #[cfg(any(target_os = "macos", target_os = "freebsd", target_os = "netbsd", target_os = "openbsd"))]
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
