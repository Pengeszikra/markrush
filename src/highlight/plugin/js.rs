use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::{StepAction, PluginSpec};
use crate::highlight::state::State;
use crate::highlight::spec::language_plugin;

pub fn scan_js_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
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

