#![allow(non_upper_case_globals)]

use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::StepAction;
use crate::highlight::state::State;
use crate::highlight::spec::language_plugin;

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

fn scan_string(src: &str, pos: usize, limit: usize, delim: u8, state: &mut State) -> (Span, StepAction) {
    let bytes = src.as_bytes();
    let mut i = pos + 1;
    while i < limit {
        let b = bytes[i];
        if b == b'\\' {
            i = (i + 2).min(limit);
            continue;
        }
        if b == delim {
            state.in_string_delim = None;
            return (Span { range: pos..(i + 1), style: StyleId::String }, StepAction::None);
        }
        i += 1;
    }
    state.in_string_delim = Some(delim);
    (Span { range: pos..limit, style: StyleId::String }, StepAction::None)
}

fn scan_block_comment(src: &str, pos: usize, limit: usize, state: &mut State) -> Span {
    let max_slice = &src[pos..limit];
    if let Some(end_rel) = max_slice.find("*/") {
        state.in_block_comment = false;
        Span { range: pos..(pos + end_rel + 2), style: StyleId::Comment }
    } else {
        state.in_block_comment = true;
        Span { range: pos..limit, style: StyleId::Comment }
    }
}

pub fn scan_js_custom(src: &str, pos: usize, limit: usize, state: &mut State) -> Option<(Span, StepAction)> {
    if is_line_start(src, pos) && src[pos..].starts_with("```") {
        let line_end = src[pos..].find('\n').map(|n| pos + n).unwrap_or(src.len());
        return Some((Span { range: pos..line_end, style: StyleId::MdFence }, StepAction::Pop));
    }

    if src[pos..].to_ascii_lowercase().starts_with("</script") {
        let end = src[pos..].find('>').map(|n| pos + n + 1).unwrap_or(src.len());
        return Some((Span { range: pos..end, style: StyleId::Tag }, StepAction::Pop));
    }

    if state.in_block_comment {
        let span = scan_block_comment(src, pos, limit, state);
        return Some((span, StepAction::None));
    }

    if let Some(delim) = state.in_string_delim {
        let (span, action) = scan_string(src, pos, limit, delim, state);
        return Some((span, action));
    }

    let bytes = src.as_bytes();
    if pos < limit.saturating_sub(1) && bytes[pos] == b'/' && bytes[pos + 1] == b'/' {
        let end = src[pos..limit].find('\n').map(|i| pos + i).unwrap_or(limit);
        return Some((Span { range: pos..end, style: StyleId::Comment }, StepAction::None));
    }

    if pos < limit.saturating_sub(1) && bytes[pos] == b'/' && bytes[pos + 1] == b'*' {
        let is_jsdoc = pos + 2 < limit && bytes[pos + 2] == b'*';
        if is_jsdoc {
            return None;
        }
        let span = scan_block_comment(src, pos, limit, state);
        return Some((span, StepAction::None));
    }

    match bytes.get(pos).copied() {
        Some(b'\"') | Some(b'\'') | Some(b'`') => {
            let delim = bytes[pos];
            let (span, action) = scan_string(src, pos, limit, delim, state);
            return Some((span, action));
        }
        _ => {}
    }

    None
}

language_plugin! {
    id: Js,
    name: "javascript",
    extensions: ["js","mjs","cjs"],

    keywords: ["function","const","let","var","return","for","while","if","else","class","new","try","catch","throw","import","export","default","async","await"],

    punct_low: [",",".",";",":"],
    punct_mid: ["(",")","[","]","{","}"],
    operators: ["===","!==","==","!=",">=","<=","=>","&&","||","++","--","+","-","*","/","%","=","<",">","!","&","|","^","?","~"],

    entry_rules: [],

    entry_style: MdFence,
    scan_custom: Some(scan_js_custom)
}
