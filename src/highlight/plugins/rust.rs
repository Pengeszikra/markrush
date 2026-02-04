#![allow(non_upper_case_globals)]

use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::StepAction;
use crate::highlight::state::State;
use crate::highlight::spec::language_plugin;

// Rust doesn't need much custom scanning yet.
// (Strings/comments are handled generically in the Stepper.)
pub fn scan_rust_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    // Allow fenced-code close to pop back to Markdown when embedded.
    // This mirrors JS/Bash behavior.
    if is_line_start(src, pos) && src[pos..].starts_with("```") {
        let line_end = src[pos..].find('\n').map(|n| pos + n).unwrap_or(src.len());
        return Some((Span { range: pos..line_end, style: StyleId::MdFence }, StepAction::Pop));
    }
    None
}

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

language_plugin! {
    id: Rust,
    name: "rust",
    extensions: ["rs"],

    keywords: [
        "as","break","const","continue","crate","else","enum","extern","false","fn","for","if",
        "impl","in","let","loop","match","mod","move","mut","pub","ref","return","self","Self",
        "static","struct","super","trait","true","type","unsafe","use","where","while","async",
        "await","dyn"
    ],

    punct_low: [",",".",";",":"],
    punct_mid: ["(",")","[","]","{","}"],
    operators: [
        "::","->","=>","==","!=",
        ">=","<=","&&","||",
        "+=","-=","*=","/=","%=",
        "+","-","*","/","%","=",
        "<",">","!","&","|","^","?","~"
    ],

    entry_rules: [],

    entry_style: MdFence,
    scan_custom: Some(scan_rust_custom)
}

