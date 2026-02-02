use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::{StepAction, PluginSpec};
use crate::highlight::state::State;
use crate::highlight::spec::language_plugin;

pub fn scan_bash_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    if !src[pos..].starts_with('$') { return None; }
    let bytes = src.as_bytes();
    let mut i = pos + 1;
    if i >= src.len() { return None; }

    if bytes[i] == b'{' {
        i += 1;
        let start = i;
        while i < src.len() {
            let b = bytes[i];
            if b == b'}' && i > start {
                return Some((Span { range: pos..(i + 1), style: StyleId::Var }, StepAction::None));
            }
            if !(b.is_ascii_alphanumeric() || b == b'_') { return None; }
            i += 1;
        }
        return Some((Span { range: pos..src.len(), style: StyleId::Error }, StepAction::None));
    }

    let b = bytes[i];
    if b.is_ascii_digit() || matches!(b, b'?' | b'#' | b'$' | b'!') {
        return Some((Span { range: pos..(i + 1), style: StyleId::Var }, StepAction::None));
    }

    if !(b == b'_' || b.is_ascii_alphabetic()) { return None; }
    i += 1;
    while i < src.len() {
        let b = bytes[i];
        if !(b == b'_' || b.is_ascii_alphanumeric()) { break; }
        i += 1;
    }

    Some((Span { range: pos..i, style: StyleId::Var }, StepAction::None))
}

language_plugin! {
    id: Bash,
    name: "bash",
    extensions: ["sh","bash"],

    keywords: ["if","then","fi","elif","else","for","in","do","done","while","case","esac","function","select","until","time"],

    punct_low: [",",";"],
    punct_mid: ["(",")","[","]","{","}"],
    operators: ["&&","||",">>","<<","|","&",">","<","="],

    entry_rules: [],

    entry_style: MdFence,
    scan_custom: Some(scan_bash_custom)
}

