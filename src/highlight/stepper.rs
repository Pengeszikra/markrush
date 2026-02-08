use crate::highlight::span::{Span, StyleId};
use crate::highlight::state::{PrevClass, State, PluginId};
use crate::highlight::registry::Registry;
use crate::highlight::spec::{Guard, StepAction, Trigger};
use crate::highlight::spec::PluginSpec;
use crate::highlight::js_lexer::{JsMode, lex_js_window, tokens_to_spans};

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
    plugin_cache: Vec<Option<PluginCache>>,
}

#[derive(Clone)]
struct PluginCache {
    op_buckets: Vec<Vec<&'static str>>,
    punct_low_buckets: Vec<Vec<&'static str>>,
    punct_mid_buckets: Vec<Vec<&'static str>>,
    boundary_bytes: [bool; 256],
}

impl<'a> Stepper<'a> {
    pub fn new(src: &'a str, start_pos: usize, start_state: State, registry: &'a Registry) -> Self {
        Self { src, pos: start_pos, state: start_state, registry, plugin_cache: vec![None; plugin_count()] }
    }

    fn cache_for(&mut self, spec: &PluginSpec, plugin_id: PluginId) -> *const PluginCache {
        let idx = plugin_index(plugin_id);
        let slot: *mut Option<PluginCache> = &mut self.plugin_cache[idx];
        unsafe {
            if (*slot).is_none() || (*slot).as_ref().unwrap().op_buckets.len() != 256 {
                *slot = Some(build_cache(spec));
            }
            (*slot).as_ref().unwrap() as *const PluginCache
        }
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

            if plugin_id == PluginId::Js {
                if let Some(scan) = spec.scan_custom {
                    if let Some((span, action)) = scan(self.src, self.pos, limit_pos, &mut self.state) {
                        self.pos = span.range.end;
                        spans.push(span);
                        apply_action(&mut self.state, action);
                        continue;
                    }
                }
                let (tokens, mode_out) = lex_js_window(self.src, self.pos, limit_pos, self.state.js_mode);
                let js_spans = tokens_to_spans(&tokens, self.src);
                for sp in js_spans {
                    if spans.len() >= max_spans || (sp.range.end - start_pos) >= max_bytes {
                        return StepResult { spans, stop: StopReason::BudgetExhausted, pos: self.pos, state: self.state.clone() };
                    }
                    spans.push(sp.clone());
                }
                if let Some(last) = tokens.last() {
                    self.pos = last.end;
                    self.state.prev = match last.kind {
                        crate::highlight::js_lexer::JsTokenKind::Whitespace => PrevClass::Space,
                        crate::highlight::js_lexer::JsTokenKind::Comment => PrevClass::Space,
                        crate::highlight::js_lexer::JsTokenKind::Symbol => PrevClass::Operator,
                        _ => PrevClass::Word,
                    };
                } else {
                    self.pos = limit_pos;
                }
                self.state.js_mode = mode_out;
                continue;
            }

            let cache_ptr = self.cache_for(spec, plugin_id);
            let cache = unsafe { &*cache_ptr };

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
            if let Some((span, action)) = scan(self.src, self.pos, limit_pos, &mut self.state) {
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

            if let Some(span) = scan_longest_bucketed(self.src, self.pos, &cache.op_buckets, StyleId::Operator) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Operator;
                continue;
            }

            if let Some(span) = scan_longest_bucketed(self.src, self.pos, &cache.punct_low_buckets, StyleId::PunctLow) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }

            if let Some(span) = scan_longest_bucketed(self.src, self.pos, &cache.punct_mid_buckets, StyleId::PunctMid) {
                self.pos = span.range.end;
                spans.push(span);
                self.state.prev = PrevClass::Punct;
                continue;
            }

            // Fallback: consume a run of plain text to reduce span count.
            let end = consume_plain_run(self.src, self.pos, limit_pos, &cache.boundary_bytes);
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

fn build_buckets(list: &[&'static str]) -> Vec<Vec<&'static str>> {
    let mut buckets: Vec<Vec<&'static str>> = vec![Vec::new(); 256];
    for pat in list {
        if let Some(&b) = pat.as_bytes().get(0) {
            buckets[b as usize].push(*pat);
        }
    }
    for bucket in buckets.iter_mut() {
        bucket.sort_by(|a, b| b.len().cmp(&a.len()));
    }
    buckets
}

fn build_boundary_bytes(spec: &PluginSpec) -> [bool; 256] {
    let mut b = [false; 256];
    for pat in spec.operators.iter().chain(spec.punct_low.iter()).chain(spec.punct_mid.iter()) {
        if let Some(&byte) = pat.as_bytes().get(0) {
            b[byte as usize] = true;
        }
    }
    b[b'\'' as usize] = true;
    b[b'"' as usize] = true;
    b[b'`' as usize] = true;
    b[b'/' as usize] = true;
    b
}

fn scan_longest_bucketed(src: &str, pos: usize, buckets: &[Vec<&'static str>], style: StyleId) -> Option<Span> {
    if pos >= src.len() {
        return None;
    }
    let b = src.as_bytes()[pos];
    let bucket = &buckets[b as usize];
    if bucket.is_empty() {
        return None;
    }
    for pat in bucket {
        if src[pos..].starts_with(pat) {
            return Some(Span { range: pos..(pos + pat.len()), style });
        }
    }
    None
}

fn consume_plain_run(src: &str, pos: usize, limit_pos: usize, boundary: &[bool; 256]) -> usize {
    let bytes = src.as_bytes();
    let mut i = pos;
    while i < limit_pos {
        let b = bytes[i];
        if b.is_ascii_whitespace() || boundary[b as usize] {
            break;
        }
        let step = if b < 0x80 {
            1
        } else {
            src[i..].chars().next().map(|c| c.len_utf8()).unwrap_or(1)
        };
        i = i.saturating_add(step).min(limit_pos);
    }
    if i == pos {
        next_char_boundary(src, pos).unwrap_or(src.len()).min(limit_pos)
    } else {
        i
    }
}

fn build_cache(spec: &PluginSpec) -> PluginCache {
    PluginCache {
        op_buckets: build_buckets(spec.operators),
        punct_low_buckets: build_buckets(spec.punct_low),
        punct_mid_buckets: build_buckets(spec.punct_mid),
        boundary_bytes: build_boundary_bytes(spec),
    }
}

fn plugin_index(id: PluginId) -> usize {
    match id {
        PluginId::Markdown => 0,
        PluginId::Js => 1,
        PluginId::HtmlText => 2,
        PluginId::HtmlTag => 3,
        PluginId::Bash => 4,
        PluginId::Rust => 5,
    }
}

fn plugin_count() -> usize {
    6
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
