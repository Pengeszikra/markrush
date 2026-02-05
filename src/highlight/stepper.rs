use crate::highlight::span::{Span, StyleId};
use crate::highlight::state::{PluginId, PrevClass, State};
use crate::highlight::registry::Registry;
use crate::highlight::spec::{Guard, StepAction, Trigger};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StopReason {
    BudgetExhausted,
    ReachedLimit,
    EndOfInput,
}

pub struct StepResult {
    pub spans: Vec<Span>,
    pub stop: StopReason,
    pub pos: usize,
    pub state: State,
}

pub struct Stepper<'a> {
    pub src: &'a str,
    pub pos: usize,
    pub state: State,
    pub registry: &'a Registry,
}

impl<'a> Stepper<'a> {
    pub fn new(src: &'a str, start_pos: usize, start_state: State, registry: &'a Registry) -> Self {
        Self { src, pos: start_pos, state: start_state, registry }
    }

    pub fn step(&mut self, limit_pos: usize, max_bytes: usize, max_spans: usize) -> StepResult {
        let mut spans: Vec<Span> = Vec::new();
        let start_pos = self.pos;

        while self.pos < self.src.len() {
            if self.pos >= limit_pos {
                return StepResult { spans, stop: StopReason::ReachedLimit, pos: self.pos, state: self.state.clone() };
            }
            if spans.len() >= max_spans || (self.pos - start_pos) >= max_bytes {
                return StepResult { spans, stop: StopReason::BudgetExhausted, pos: self.pos, state: self.state.clone() };
            }

            let plugin_id = self.state.current();
            let spec = self.registry.by_id(plugin_id);

            // 0) Continue an open comment/string (stateful, window-safe)
            if let Some(span) = scan_stateful(self.src, self.pos, limit_pos, &mut self.state, plugin_id) {
                self.pos = span.range.end;
                spans.push(span);
                // keep prev as Word-like to avoid accidental ExprStart triggers
                self.state.prev = PrevClass::Word;
                continue;
            }

            // 1) Entry rules (push embedded languages)
            if let Some((span, action)) = try_entry_rules(spec.entry_rules, spec.entry_style, self.src, self.pos, &self.state) {
                self.pos = span.range.end;
                spans.push(span);
                apply_action(&mut self.state, action);
                continue;
            }

            // 2) Plugin custom scanner (may push/pop)
            if let Some(scan) = spec.scan_custom {
                if let Some((span, action)) = scan(self.src, self.pos, &mut self.state) {
                    self.pos = span.range.end;
                    spans.push(span);
                    apply_action(&mut self.state, action);
                    continue;
                }
            }

            // 3) Whitespace
            if let Some(span) = scan_whitespace(self.src, self.pos) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = if contains_newline(self.src, &spans.last().unwrap().range) { PrevClass::Newline } else { PrevClass::Space };
                continue;
            }

            // 4) Start comment/string (before operators/idents!)
            if let Some(span) = scan_comment_or_string_start(self.src, self.pos, limit_pos, &mut self.state, plugin_id) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Word;
                continue;
            }

            // 5) Operators (longest match!)
            if let Some(span) = scan_longest(self.src, self.pos, spec.operators, StyleId::Operator) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Operator;
                continue;
            }

            // 6) Punctuation
            if let Some(span) = scan_longest(self.src, self.pos, spec.punct_mid, StyleId::PunctMid) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }
            if let Some(span) = scan_longest(self.src, self.pos, spec.punct_low, StyleId::PunctLow) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }

            // 7) Numbers
            if let Some(span) = scan_number(self.src, self.pos) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Word;
                continue;
            }

            // 8) Ident / Keyword (HTML tag mode uses AttrName)
            if let Some(span) = scan_ident_or_keyword(self.src, self.pos, spec.keywords, plugin_id) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Word;
                continue;
            }

            // 9) Fallback: consume one UTF-8 char
            let end = next_char_boundary(self.src, self.pos).unwrap_or(self.src.len());
            spans.push(Span { range: self.pos..end, style: StyleId::Text });
            self.pos = end;
            self.state.prev = PrevClass::Word;
        }

        StepResult { spans, stop: StopReason::EndOfInput, pos: self.pos, state: self.state.clone() }
    }
}

fn apply_action(state: &mut State, action: StepAction) {
    match action {
        StepAction::None => {}
        StepAction::Push(id) => state.stack.push(id),
        StepAction::Pop => { if state.stack.len() > 1 { state.stack.pop(); } }
    }
}

fn try_entry_rules(
    rules: &[crate::highlight::spec::EntryRule],
    entry_style: StyleId,
    src: &str,
    pos: usize,
    state: &State,
) -> Option<(Span, StepAction)> {
    for r in rules {
        let triggered = match r.trigger {
            Trigger::Prefix(p) => src[pos..].starts_with(p),
            Trigger::Byte(b) => src.as_bytes().get(pos).copied() == Some(b),
        };
        if !triggered { continue; }

        let guard_ok = match r.guard {
            Guard::Always => true,
            Guard::AtLineStart => is_line_start(src, pos),
            Guard::PrevIsExprStart => matches!(state.prev, PrevClass::ExprStart | PrevClass::Operator | PrevClass::Punct | PrevClass::Newline | PrevClass::None),
            Guard::Custom(f) => f(src, pos, state),
        };
        if !guard_ok { continue; }

        let end = match r.trigger {
            Trigger::Prefix(p) => pos + p.len(),
            Trigger::Byte(_) => next_char_boundary(src, pos).unwrap_or(src.len()),
        };

        return Some((Span { range: pos..end, style: entry_style }, StepAction::Push(r.child)));
    }
    None
}

fn scan_whitespace(src: &str, pos: usize) -> Option<Span> {
    let bytes = src.as_bytes();
    if pos >= bytes.len() { return None; }
    let b = bytes[pos];
    if !matches!(b, b' ' | b'\t' | b'\n' | b'\r') { return None; }
    let mut i = pos;
    while i < bytes.len() && matches!(bytes[i], b' ' | b'\t' | b'\n' | b'\r') { i += 1; }
    Some(Span { range: pos..i, style: StyleId::Whitespace })
}

fn scan_number(src: &str, pos: usize) -> Option<Span> {
    let bytes = src.as_bytes();
    if pos >= bytes.len() || !bytes[pos].is_ascii_digit() { return None; }
    let mut i = pos;
    while i < bytes.len() && bytes[i].is_ascii_digit() { i += 1; }
    if i < bytes.len() && bytes[i] == b'.' {
        let mut j = i + 1;
        if j < bytes.len() && bytes[j].is_ascii_digit() {
            while j < bytes.len() && bytes[j].is_ascii_digit() { j += 1; }
            i = j;
        }
    }
    Some(Span { range: pos..i, style: StyleId::Number })
}

fn scan_ident_or_keyword(src: &str, pos: usize, keywords: &[&str], plugin: PluginId) -> Option<Span> {
    let mut it = src[pos..].char_indices();
    let (_, first) = it.next()?;
    if !(first == '_' || first.is_ascii_alphabetic()) { return None; }
    let mut end = pos + first.len_utf8();
    for (off, ch) in it {
        if !(ch == '_' || ch.is_ascii_alphanumeric()) { break; }
        end = pos + off + ch.len_utf8();
    }
    let slice = &src[pos..end];
    let is_kw = keywords.iter().any(|&k| k == slice);

    let ident_style = match plugin {
        PluginId::HtmlTag => StyleId::AttrName,
        _ => StyleId::Ident,
    };

    Some(Span { range: pos..end, style: if is_kw { StyleId::Keyword } else { ident_style } })
}

fn scan_longest(src: &str, pos: usize, list: &[&str], style: StyleId) -> Option<Span> {
    if pos >= src.len() { return None; }
    let mut best: Option<&str> = None;
    for pat in list {
        if src[pos..].starts_with(pat) {
            best = match best {
                None => Some(*pat),
                Some(prev) if pat.len() > prev.len() => Some(*pat),
                _ => best,
            };
        }
    }
    best.map(|pat| Span { range: pos..(pos + pat.len()), style })
}

fn scan_stateful(src: &str, pos: usize, limit_pos: usize, state: &mut State, plugin: PluginId) -> Option<Span> {
    // Block comment continuation
    if state.in_block_comment {
        let end_pat = "*/";
        let search_end = limit_pos.min(src.len());
        if let Some(rel) = src[pos..search_end].find(end_pat) {
            let end = (pos + rel + end_pat.len()).min(search_end);
            state.in_block_comment = false;
            return Some(Span { range: pos..end, style: StyleId::Comment });
        }
        // not closed in this window
        return Some(Span { range: pos..search_end, style: StyleId::Comment });
    }

    // String continuation
    if let Some(delim) = state.in_string_delim {
        let search_end = limit_pos.min(src.len());
        let mut i = pos;
        let bytes = src.as_bytes();
        while i < search_end {
            let b = bytes[i];
            if b == b'\\' {
                // skip escaped byte + next byte (best-effort; UTF-8 safe enough for typical code)
                i = (i + 2).min(search_end);
                continue;
            }
            if b == delim {
                let end = (i + 1).min(search_end);
                state.in_string_delim = None;
                let style = match plugin {
                    PluginId::HtmlTag => StyleId::AttrValue,
                    _ => StyleId::String,
                };
                return Some(Span { range: pos..end, style });
            }
            i += 1;
        }
        let style = match plugin {
            PluginId::HtmlTag => StyleId::AttrValue,
            _ => StyleId::String,
        };
        return Some(Span { range: pos..search_end, style });
    }

    None
}

fn scan_comment_or_string_start(src: &str, pos: usize, limit_pos: usize, state: &mut State, plugin: PluginId) -> Option<Span> {
    let search_end = limit_pos.min(src.len());

    // JS / Rust: // line comment
    if matches!(plugin, PluginId::Js | PluginId::Rust) && src[pos..].starts_with("//") {
        let line_end = src[pos..search_end].find('\n').map(|n| pos + n).unwrap_or(search_end);
        return Some(Span { range: pos..line_end, style: StyleId::Comment });
    }

    // Bash: # line comment
    if matches!(plugin, PluginId::Bash) && src.as_bytes().get(pos).copied() == Some(b'#') {
        let line_end = src[pos..search_end].find('\n').map(|n| pos + n).unwrap_or(search_end);
        return Some(Span { range: pos..line_end, style: StyleId::Comment });
    }

    // JS / Rust: /* block comment */
    if matches!(plugin, PluginId::Js | PluginId::Rust) && src[pos..].starts_with("/*") {
        if let Some(rel) = src[pos..search_end].find("*/") {
            let end = (pos + rel + 2).min(search_end);
            return Some(Span { range: pos..end, style: StyleId::Comment });
        }
        state.in_block_comment = true;
        return Some(Span { range: pos..search_end, style: StyleId::Comment });
    }

    // Strings:
    // - JS: ', ", `
    // - Rust: ", ' (char treated as string-ish here)
    // - HTML tag: quoted attribute values
    let b = src.as_bytes().get(pos).copied()?;
    let is_string_start = match plugin {
        PluginId::Js => matches!(b, b'\'' | b'"' | b'`'),
        PluginId::Rust => matches!(b, b'\'' | b'"'),
        PluginId::HtmlTag => matches!(b, b'\'' | b'"'),
        _ => false,
    };
    if !is_string_start { return None; }

    let delim = b;
    let mut i = pos + 1;
    let bytes = src.as_bytes();
    while i < search_end {
        let bb = bytes[i];
        if bb == b'\\' {
            i = (i + 2).min(search_end);
            continue;
        }
        if bb == delim {
            let end = (i + 1).min(search_end);
            let style = match plugin {
                PluginId::HtmlTag => StyleId::AttrValue,
                _ => StyleId::String,
            };
            return Some(Span { range: pos..end, style });
        }
        i += 1;
    }

    // not closed
    state.in_string_delim = Some(delim);
    let style = match plugin {
        PluginId::HtmlTag => StyleId::AttrValue,
        _ => StyleId::String,
    };
    Some(Span { range: pos..search_end, style })
}

fn next_char_boundary(src: &str, pos: usize) -> Option<usize> {
    if pos >= src.len() { return None; }
    let ch = src[pos..].chars().next()?;
    Some(pos + ch.len_utf8())
}

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

fn contains_newline(src: &str, range: &core::ops::Range<usize>) -> bool {
    src[range.clone()].as_bytes().iter().any(|&b| b == b'\n')
}

