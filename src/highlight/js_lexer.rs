use crate::highlight::span::{Span, StyleId};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JsMode {
    Normal,
    LineComment,
    BlockComment,
    String(u8),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JsTokenKind {
    Word,
    Whitespace,
    Symbol,
    Comment,
    String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JsToken {
    pub start: usize,
    pub end: usize,
    pub kind: JsTokenKind,
}

pub fn lex_js_window(src: &str, start: usize, end: usize, mode_in: JsMode) -> (Vec<JsToken>, JsMode) {
    let mut tokens = Vec::new();
    let mut i = start;
    let mut mode = mode_in;
    while i < end {
        match mode {
            JsMode::Normal => {
                let b = src.as_bytes()[i];
                if b == b'/' && i + 1 < end && src.as_bytes()[i + 1] == b'/' {
                    let start_c = i;
                    i = (i + 2).min(end);
                    while i < end && src.as_bytes()[i] != b'\n' {
                        i += 1;
                    }
                    tokens.push(JsToken { start: start_c, end: i, kind: JsTokenKind::Comment });
                    mode = if i < end { JsMode::Normal } else { JsMode::LineComment };
                    continue;
                }
                if b == b'/' && i + 1 < end && src.as_bytes()[i + 1] == b'*' {
                    let start_c = i;
                    i = (i + 2).min(end);
                    let mut closed = false;
                    while i + 1 < end {
                        if src.as_bytes()[i] == b'*' && src.as_bytes()[i + 1] == b'/' {
                            i += 2;
                            mode = JsMode::Normal;
                            closed = true;
                            break;
                        }
                        i += 1;
                    }
                    if !closed {
                        mode = JsMode::BlockComment;
                        i = end;
                    }
                    tokens.push(JsToken { start: start_c, end: i.min(end), kind: JsTokenKind::Comment });
                    continue;
                }
                if matches!(b, b'\'' | b'"' | b'`') {
                    let (end_s, next_mode) = lex_string(src, i, end, b, true);
                    tokens.push(JsToken { start: i, end: end_s, kind: JsTokenKind::String });
                    mode = next_mode;
                    i = end_s;
                    continue;
                }
                if b.is_ascii_whitespace() {
                    let start_ws = i;
                    while i < end && src.as_bytes()[i].is_ascii_whitespace() {
                        i += 1;
                    }
                    tokens.push(JsToken { start: start_ws, end: i, kind: JsTokenKind::Whitespace });
                    continue;
                }
                if is_word_byte(b) {
                    let start_word = i;
                    i += 1;
                    while i < end {
                        let b2 = src.as_bytes()[i];
                        if is_word_byte(b2) {
                            i += 1;
                        } else {
                            break;
                        }
                    }
                    tokens.push(JsToken { start: start_word, end: i, kind: JsTokenKind::Word });
                    continue;
                }
                tokens.push(JsToken { start: i, end: (i + 1).min(end), kind: JsTokenKind::Symbol });
                i += 1;
            }
            JsMode::LineComment => {
                let start_c = i;
                while i < end && src.as_bytes()[i] != b'\n' {
                    i += 1;
                }
                tokens.push(JsToken { start: start_c, end: i, kind: JsTokenKind::Comment });
                mode = if i < end { JsMode::Normal } else { JsMode::LineComment };
            }
            JsMode::BlockComment => {
                let start_c = i;
                let mut closed = false;
                while i + 1 < end {
                    if src.as_bytes()[i] == b'*' && src.as_bytes()[i + 1] == b'/' {
                        i += 2;
                        mode = JsMode::Normal;
                        closed = true;
                        break;
                    }
                    i += 1;
                }
                if !closed {
                    mode = JsMode::BlockComment;
                    i = end;
                }
                tokens.push(JsToken { start: start_c, end: i.min(end), kind: JsTokenKind::Comment });
            }
            JsMode::String(delim) => {
                let (end_s, next_mode) = lex_string(src, i, end, delim, false);
                tokens.push(JsToken { start: i, end: end_s, kind: JsTokenKind::String });
                mode = next_mode;
                i = end_s;
            }
        }
    }
    (tokens, mode)
}

fn lex_string(src: &str, start: usize, end: usize, delim: u8, skip_first: bool) -> (usize, JsMode) {
    let mut i = if skip_first { start + 1 } else { start };
    while i < end {
        let b = src.as_bytes()[i];
        if b == b'\\' {
            i = (i + 2).min(end);
            continue;
        }
        if b == delim {
            return (i + 1, JsMode::Normal);
        }
        i += 1;
    }
    (end, JsMode::String(delim))
}

pub fn tokens_to_spans(tokens: &[JsToken], src: &str) -> Vec<Span> {
    let mut spans = Vec::with_capacity(tokens.len());
    for t in tokens {
        match t.kind {
            JsTokenKind::Comment if t.start < t.end => {
                let slice = &src[t.start..t.end.min(src.len())];
                if slice.starts_with("/**") {
                    spans.extend(split_jsdoc_comment(slice, t.start));
                } else {
                    spans.push(Span { range: t.start..t.end, style: StyleId::Comment });
                }
            }
            _ => {
                let style = match t.kind {
                    JsTokenKind::Word => StyleId::Ident,
                    JsTokenKind::Whitespace => StyleId::Whitespace,
                    JsTokenKind::Symbol => StyleId::Operator,
                    JsTokenKind::Comment => StyleId::Comment,
                    JsTokenKind::String => StyleId::String,
                };
                spans.push(Span { range: t.start..t.end, style });
            }
        }
    }
    spans
}

fn split_jsdoc_comment(slice: &str, base: usize) -> Vec<Span> {
    let mut spans = Vec::new();
    let mut cursor = 0usize;
    let bytes = slice.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'@' {
            let mut j = i + 1;
            while j < bytes.len() && is_ident_continue_byte(bytes[j]) {
                j += 1;
            }
            if j > i + 1 {
                if cursor < i {
                    spans.push(Span { range: (base + cursor)..(base + i), style: StyleId::Comment });
                }
                spans.push(Span { range: (base + i)..(base + j), style: StyleId::Keyword });
                cursor = j;
                i = j;
                continue;
            }
        }
        i += 1;
    }
    if cursor < bytes.len() {
        spans.push(Span { range: (base + cursor)..(base + bytes.len()), style: StyleId::Comment });
    }
    spans
}

fn is_ident_continue_byte(b: u8) -> bool {
    b == b'_' || b.is_ascii_alphanumeric()
}

fn is_word_byte(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_' || b == b'$'
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn line_comment_closes_on_newline() {
        let src = "let a = 1; // comment\nb;";
        let (tokens, mode) = lex_js_window(src, 0, src.len(), JsMode::Normal);
        assert_eq!(mode, JsMode::Normal);
        assert!(tokens.iter().any(|t| matches!(t.kind, JsTokenKind::Comment)));
    }

    #[test]
    fn block_comment_spans_windows() {
        let src = "/* start\nstill */ let x;";
        let (tokens1, mode1) = lex_js_window(src, 0, 8, JsMode::Normal);
        assert_eq!(mode1, JsMode::BlockComment);
        assert_eq!(tokens1.len(), 1);
        let (tokens2, mode2) = lex_js_window(src, 8, src.len(), mode1);
        assert_eq!(mode2, JsMode::Normal);
        assert!(tokens2.iter().any(|t| matches!(t.kind, JsTokenKind::Comment)));
    }

    #[test]
    fn string_with_escape_single_span() {
        let src = "\"a\\\"b\";";
        let (tokens, mode) = lex_js_window(src, 0, src.len(), JsMode::Normal);
        assert_eq!(mode, JsMode::Normal);
        let strings: Vec<_> = tokens.iter().filter(|t| matches!(t.kind, JsTokenKind::String)).collect();
        assert_eq!(strings.len(), 1);
    }

    #[test]
    fn basic_tokens_words_symbols() {
        let src = "var x=5;";
        let (tokens, _) = lex_js_window(src, 0, src.len(), JsMode::Normal);
        assert!(tokens.iter().any(|t| matches!(t.kind, JsTokenKind::Word)));
        assert!(tokens.iter().any(|t| matches!(t.kind, JsTokenKind::Symbol)));
    }
}
