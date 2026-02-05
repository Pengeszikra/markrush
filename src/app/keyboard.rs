use std::io::{Read, StdinLock};
use std::str;

use crate::r#struct::Key;

pub fn read_key(stdin: &mut StdinLock<'_>) -> Key {
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
