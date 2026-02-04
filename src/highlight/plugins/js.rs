#![allow(non_upper_case_globals)]

use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::StepAction;
use crate::highlight::state::State;
use crate::highlight::spec::language_plugin;

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

pub fn scan_js_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    if is_line_start(src, pos) && src[pos..].starts_with("```") {
        let line_end = src[pos..].find('\n').map(|n| pos + n).unwrap_or(src.len());
        return Some((Span { range: pos..line_end, style: StyleId::MdFence }, StepAction::Pop));
    }

    if src[pos..].to_ascii_lowercase().starts_with("</script") {
        let end = src[pos..].find('>').map(|n| pos + n + 1).unwrap_or(src.len());
        return Some((Span { range: pos..end, style: StyleId::Tag }, StepAction::Pop));
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
