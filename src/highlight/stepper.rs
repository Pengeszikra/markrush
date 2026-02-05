use crate::highlight::span::{Span, StyleId};
use crate::highlight::state::{PrevClass, State, PluginId};
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

            // HTML comments in text mode
            if plugin_id == PluginId::HtmlText && self.src[self.pos..].starts_with("<!--") {
                let end_rel = self.src[self.pos..limit_pos].find("-->").map(|i| i + 3).unwrap_or(limit_pos - self.pos);
                let end = self.pos + end_rel;
                let span = Span { range: self.pos..end, style: StyleId::Comment };
                self.pos = end;
                spans.push(span);
                self.state.prev = PrevClass::Space;
                continue;
            }

            // Entry rules (push embedded languages)
            if let Some((span, action)) = try_entry_rules(spec.entry_rules, spec.entry_style, self.src, self.pos, &self.state) {
                self.pos = span.range.end;
                spans.push(span);
                apply_action(&mut self.state, action);
                continue;
            }

            // Plugin custom scanner
            if let Some(scan) = spec.scan_custom {
                if let Some((span, action)) = scan(self.src, self.pos, &mut self.state) {
                    self.pos = span.range.end;
                    spans.push(span);
                    apply_action(&mut self.state, action);
                    continue;
                }
            }

            // Generic scanners
            if let Some(span) = scan_whitespace(self.src, self.pos) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = if contains_newline(self.src, &spans.last().unwrap().range) { PrevClass::Newline } else { PrevClass::Space };
                continue;
            }

            if let Some(span) = scan_number(self.src, self.pos) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Word;
                continue;
            }

            if let Some(mut span) = scan_ident_or_keyword(self.src, self.pos, spec.keywords) {
                if plugin_id == PluginId::Rust {
                    if let Some(b'!') = self.src.as_bytes().get(span.range.end) {
                        if self.src.as_bytes().get(span.range.end + 1) != Some(&b'=') {
                            span.style = StyleId::Keyword;
                        }
                    }
                }
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Word;
                continue;
            }

            // JS block comments with JSDoc tags
            if plugin_id == PluginId::Js && self.src[self.pos..].starts_with("/*") {
                let is_jsdoc = self.src[self.pos..].starts_with("/**");
                let max_slice = &self.src[self.pos..limit_pos];
                let end_rel = max_slice.find("*/").map(|i| i + 2).unwrap_or(max_slice.len());
                let end = self.pos + end_rel;
                if is_jsdoc {
                    spans.extend(scan_jsdoc_comment(self.src, self.pos, end));
                } else {
                    spans.push(Span { range: self.pos..end, style: StyleId::Comment });
                }
                self.pos = end;
                self.state.prev = PrevClass::Space;
                continue;
            }

            if plugin_id == PluginId::Js && self.src[self.pos..].starts_with("//") {
                let end = self.src[self.pos..limit_pos].find('\n').map(|i| self.pos + i).unwrap_or(limit_pos);
                spans.push(Span { range: self.pos..end, style: StyleId::Comment });
                self.pos = end;
                self.state.prev = PrevClass::Space;
                continue;
            }

            if let Some(span) = scan_longest(self.src, self.pos, spec.operators, StyleId::Operator) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Operator;
                continue;
            }

            if let Some(span) = scan_longest(self.src, self.pos, spec.punct_low, StyleId::PunctLow) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }

            if let Some(span) = scan_longest(self.src, self.pos, spec.punct_mid, StyleId::PunctMid) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }

            // Fallback: consume one UTF-8 char
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

fn scan_ident_or_keyword(src: &str, pos: usize, keywords: &[&str]) -> Option<Span> {
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
    Some(Span { range: pos..end, style: if is_kw { StyleId::Keyword } else { StyleId::Ident } })
}

fn scan_longest(src: &str, pos: usize, list: &[&str], style: StyleId) -> Option<Span> {
    for pat in list {
        if src[pos..].starts_with(pat) {
            return Some(Span { range: pos..(pos + pat.len()), style });
        }
    }
    None
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

fn scan_jsdoc_comment(src: &str, start: usize, end: usize) -> Vec<Span> {
    let mut spans = Vec::new();
    let mut cursor = start;
    let bytes = src.as_bytes();
    let mut i = start;

    while i < end {
        if bytes[i] == b'@' {
            let mut j = i + 1;
            while j < end && is_ident_continue_byte(bytes[j]) {
                j += 1;
            }
            if j > i + 1 {
                if cursor < i {
                    spans.push(Span { range: cursor..i, style: StyleId::Comment });
                }
                spans.push(Span { range: i..j, style: StyleId::Keyword });
                cursor = j;
                i = j;
                continue;
            }
        }
        i += 1;
    }

    if cursor < end {
        spans.push(Span { range: cursor..end, style: StyleId::Comment });
    }
    spans
}

fn is_ident_continue_byte(b: u8) -> bool {
    b == b'_' || b.is_ascii_alphanumeric()
}
