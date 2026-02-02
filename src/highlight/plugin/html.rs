use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::{StepAction, PluginSpec};
use crate::highlight::state::{PluginId, State};
use crate::highlight::spec::language_plugin;

pub fn scan_html_text_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    if src[pos..].starts_with('<') {
        return Some((Span { range: pos..(pos + 1), style: StyleId::Tag }, StepAction::Push(PluginId::HtmlTag)));
    }
    None
}

pub fn scan_html_tag_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    if src[pos..].starts_with('>') {
        let window_start = pos.saturating_sub(64);
        let frag = &src[window_start..pos];
        let lower = frag.to_ascii_lowercase();
        let is_script_open = lower.contains("<script") && !lower.contains("</script");
        if is_script_open {
            return Some((Span { range: pos..(pos + 1), style: StyleId::PunctMid }, StepAction::Push(PluginId::Js)));
        }
        return Some((Span { range: pos..(pos + 1), style: StyleId::PunctMid }, StepAction::Pop));
    }
    None
}

language_plugin! {
    id: HtmlText,
    name: "html-text",
    extensions: ["html","htm"],

    keywords: [],

    punct_low: [],
    punct_mid: [],
    operators: [],

    entry_rules: [],

    entry_style: Tag,
    scan_custom: Some(scan_html_text_custom)
}

language_plugin! {
    id: HtmlTag,
    name: "html-tag",
    extensions: [],

    keywords: [],

    punct_low: ["/","="],
    punct_mid: [],
    operators: [],

    entry_rules: [],

    entry_style: Tag,
    scan_custom: Some(scan_html_tag_custom)
}

