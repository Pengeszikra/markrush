// src/main.rs

#[path = "highlight-core.rs"]
mod highlight_core;

mod highlight;
mod ui;

mod app;
mod r#struct;

use std::{io, process};

use app::arguments::parse_args;
use app::helpers::{copy_file_and_preview, print_highlighted};
use app::keyboard::read_key;
use app::editor::Editor;

use r#struct::RawModeGuard;

fn main() {
    let config = parse_args(std::env::args().skip(1));

    // HELP uses your existing help renderer (it already highlights HELP.md)
    if config.help {
        if let Err(e) = print_highlighted("HELP.md") {
            eprintln!("Failed to show help: {e}");
        }
        return;
    }

    // Copy mode
    if config.copy_mode {
        let Some(path) = config.file.as_deref() else {
            eprintln!("No file provided for --copy");
            process::exit(1);
        };
        if let Err(e) = copy_file_and_preview(path) {
            eprintln!("Failed to copy file: {e}");
            process::exit(1);
        }
        return;
    }

    // Print mode
    if config.print_mode {
        let Some(path) = config.file.as_deref() else {
            eprintln!("No file provided for --print");
            process::exit(1);
        };
        if let Err(e) = print_highlighted(path) {
            eprintln!("Failed to print file: {e}");
            process::exit(1);
        }
        return;
    }

    // Interactive editor
    let _raw = match RawModeGuard::new() {
        Ok(g) => g,
        Err(e) => {
            eprintln!("Failed to enter raw mode: {e}");
            process::exit(1);
        }
    };

    let screen_rows = app::helpers::read_terminal_size()
        .map(|(r, _)| r)
        .unwrap_or(24);

    let mut editor = Editor::open(config.file.as_deref(), screen_rows);

    let stdin = io::stdin();
    let mut stdin = stdin.lock();

    loop {
        editor.ensure_cursor_visible();
        editor.render();

        let key = read_key(&mut stdin);
        if editor.handle_key(key) {
            // handle_key returns true = quit
            break;
        }
    }

    editor.finish();
}
