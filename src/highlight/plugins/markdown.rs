#![allow(non_upper_case_globals)]

use crate::highlight::span::{Span, StyleId};
use crate::highlight::spec::StepAction;
use crate::highlight::state::{PluginId, State};
use crate::highlight::spec::language_plugin;

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

fn next_char_boundary(src: &str, pos: usize) -> Option<usize> {
    if pos >= src.len() { return None; }
    let ch = src[pos..].chars().next()?;
    Some(pos + ch.len_utf8())
}

pub fn scan_markdown_custom(src: &str, pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
    if is_line_start(src, pos) && src[pos..].starts_with("```") {
        let line_end = src[pos..].find('\n').map(|n| pos + n).unwrap_or(src.len());
        let mut i = pos + 3;
        while i < line_end && src.as_bytes()[i].is_ascii_whitespace() {
            i += 1;
        }
        let lang_start = i;
        while i < line_end && !src.as_bytes()[i].is_ascii_whitespace() {
            i += 1;
        }
        let lang = if lang_start < i { &src[lang_start..i] } else { "" };
        let target = match lang.to_ascii_lowercase().as_str() {
            "js" | "javascript" => PluginId::Js,
            "html" | "htm" => PluginId::HtmlText,
            "bash" | "sh" | "" => PluginId::Bash,
            _ => PluginId::Bash,
        };
        return Some((Span { range: pos..line_end, style: StyleId::MdFence }, StepAction::Push(target)));
    }

    if is_line_start(src, pos) && src[pos..].starts_with('#') {
        let line_end = src[pos..].find('\n').map(|n| pos + n).unwrap_or(src.len());
        return Some((Span { range: pos..line_end, style: StyleId::MdHeading }, StepAction::None));
    }

    if src[pos..].starts_with('`') {
        let mut i = pos + 1;
        while i < src.len() {
            if src[i..].starts_with('`') {
                return Some((Span { range: pos..(i + 1), style: StyleId::MdCodeSpan }, StepAction::None));
            }
            i = next_char_boundary(src, i).unwrap_or(src.len());
        }
        return Some((Span { range: pos..src.len(), style: StyleId::Error }, StepAction::None));
    }

    None
}

language_plugin! {
    id: Markdown,
    name: "markdown",
    extensions: ["md","markdown"],

    keywords: [],

    punct_low: [],
    punct_mid: [],
    operators: [],

    entry_rules: [
        { child: Js, trigger: Prefix("```js"), guard: AtLineStart },
        { child: Js, trigger: Prefix("```javascript"), guard: AtLineStart },
        { child: HtmlText, trigger: Prefix("```html"), guard: AtLineStart },
        { child: Bash, trigger: Prefix("```bash"), guard: AtLineStart },
        { child: Bash, trigger: Prefix("```sh"), guard: AtLineStart },
    ],

    entry_style: MdFence,
    scan_custom: Some(scan_markdown_custom)
}
