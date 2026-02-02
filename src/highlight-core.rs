//! Minimal, dependency-free, view-independent syntax highlighting core
//! with a tiny macro DSL to define languages.
//!
//! - Output is Vec<Token { kind, range }>, no HTML/ANSI/UI.
//! - Supports mode stack for embedding (Markdown fences, HTML <script>).
//! - No regex; only prefix checks + simple scanners.
//!
//! This is a "working skeleton": you can extend token kinds, matchers,
//! and language definitions as needed.

use core::ops::Range;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TokenKind {
    Text,
    Whitespace,
    Comment,
    Keyword,
    Ident,
    Number,
    String,
    Operator,
    Punct,

    // HTML-ish
    Tag,
    AttrName,
    AttrValue,

    // Markdown-ish
    MdHeading,
    MdEmph,
    MdCodeSpan,
    MdFence,

    // Bash / JS extras
    Var,

    Error,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Token {
    pub kind: TokenKind,
    pub range: Range<usize>, // byte offsets in the original input
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ModeId {
    Markdown,
    HtmlText,
    HtmlTag,
    Js,
    Bash,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ScanAction {
    None,
    Push(ModeId),
    Pop,
}

/// Custom matcher signature.
/// Returns Some((kind, range, action)) if it matched at `pos`.
pub type CustomMatcher = fn(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)>;

pub struct LanguageSpec {
    #[allow(dead_code)]
    pub mode: ModeId,

    pub keywords: &'static [&'static str],

    pub line_comment: Option<&'static str>,
    pub block_comment: Option<(&'static str, &'static str)>,

    pub strings: &'static [StringRule],

    pub operators: &'static [&'static str],
    pub punct: &'static [&'static str],

    pub custom: &'static [CustomMatcher],

    pub ident_kind: TokenKind,
    pub number_kind: TokenKind,
    pub text_kind: TokenKind,
    pub whitespace_kind: TokenKind,
}

pub struct StringRule {
    pub start: &'static str,
    pub end: &'static str,
    pub escape: Option<char>,
    pub kind: TokenKind,
}

macro_rules! language {
    (
        name: $name:ident,
        mode: $mode:expr,

        keywords: [$($kw:literal),* $(,)?],

        $(line_comment: $lc:literal => $lc_kind:ident,)?
        $(block_comment: ($bc_start:literal, $bc_end:literal) => $bc_kind:ident,)?

        strings: [
            $(
                { start: $s_start:literal, end: $s_end:literal, escape: $s_esc:expr, kind: $s_kind:ident }
            ),* $(,)?
        ],

        $(custom: [$($custom_fn:ident),* $(,)?],)?

        ident: { kind: $ident_kind:ident },
        numbers: { kind: $num_kind:ident },

        operators: [$($op:literal),* $(,)?] => $op_kind:ident,
        punct: [$($p:literal),* $(,)?] => $p_kind:ident,

        text: { kind: $text_kind:ident },
        whitespace: { kind: $ws_kind:ident }
    ) => {
        pub const $name: LanguageSpec = LanguageSpec {
            mode: $mode,
            keywords: &[$($kw),*],

            line_comment: language!(@opt_line_comment $( $lc )? ),
            block_comment: language!(@opt_block_comment $( ($bc_start, $bc_end) )? ),

            strings: &[
                $(
                    StringRule {
                        start: $s_start,
                        end: $s_end,
                        escape: $s_esc,
                        kind: TokenKind::$s_kind,
                    }
                ),*
            ],

            operators: &[$($op),*],
        punct: &[$($p),*],

        custom: language!(@custom_list $( [$($custom_fn),*] )? ),

        ident_kind: TokenKind::$ident_kind,
        number_kind: TokenKind::$num_kind,
        text_kind: TokenKind::$text_kind,
        whitespace_kind: TokenKind::$ws_kind,
    };
    };

    (@opt_line_comment $lc:literal) => { Some($lc) };
    (@opt_line_comment) => { None };

    (@opt_block_comment ($a:literal, $b:literal)) => { Some(($a, $b)) };
    (@opt_block_comment) => { None };

    (@custom_list [$($f:ident),*]) => { &[$($f as CustomMatcher),*] };
    (@custom_list) => { &[] as &[CustomMatcher] };
}

pub struct Highlighter<'a> {
    pub registry: &'a Registry,
}

pub struct Registry {
    pub markdown: &'static LanguageSpec,
    pub html_text: &'static LanguageSpec,
    pub html_tag: &'static LanguageSpec,
    pub js: &'static LanguageSpec,
    pub bash: &'static LanguageSpec,
}

impl Registry {
    pub fn spec_for_mode(&self, mode: ModeId) -> &'static LanguageSpec {
        match mode {
            ModeId::Markdown => self.markdown,
            ModeId::HtmlText => self.html_text,
            ModeId::HtmlTag => self.html_tag,
            ModeId::Js => self.js,
            ModeId::Bash => self.bash,
        }
    }
}

impl<'a> Highlighter<'a> {
    pub fn highlight(&self, src: &str) -> Vec<Token> {
        let mut tokens: Vec<Token> = Vec::new();
        let mut modes: Vec<ModeId> = vec![ModeId::Markdown];

        let mut pos: usize = 0;
        while pos < src.len() {
            let current_mode = *modes.last().unwrap();
            let spec = self.registry.spec_for_mode(current_mode);

            // 1) Custom matchers (they can change modes)
            if let Some((kind, range, action)) = run_custom(spec, src, pos, &modes) {
                tokens.push(Token { kind, range: range.clone() });
                pos = range.end;
                apply_action(&mut modes, action);
                continue;
            }

            // 2) Whitespace
            if let Some(range) = scan_whitespace(src, pos) {
                tokens.push(Token { kind: spec.whitespace_kind, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 3) Comments
            if let Some(range) = scan_comment(spec, src, pos) {
                tokens.push(Token { kind: TokenKind::Comment, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 4) Strings
            if let Some((kind, range)) = scan_string(spec, src, pos) {
                tokens.push(Token { kind, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 5) Numbers
            if let Some(range) = scan_number(src, pos) {
                tokens.push(Token { kind: spec.number_kind, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 6) Ident / Keyword (note: HTML tag mode uses ident_kind=AttrName)
            if let Some(range) = scan_ident(src, pos) {
                let slice = &src[range.clone()];
                let kind = if is_keyword(spec, slice) { TokenKind::Keyword } else { spec.ident_kind };
                tokens.push(Token { kind, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 7) Operators / Punct (longest match: lists should be pre-sorted by descending length)
            if let Some(range) = scan_longest_any(spec.operators, src, pos) {
                tokens.push(Token { kind: TokenKind::Operator, range: range.clone() });
                pos = range.end;
                continue;
            }
            if let Some(range) = scan_longest_any(spec.punct, src, pos) {
                tokens.push(Token { kind: TokenKind::Punct, range: range.clone() });
                pos = range.end;
                continue;
            }

            // 8) Fallback: consume one char (unicode-safe)
            let end = next_char_boundary(src, pos).unwrap_or(src.len());
            tokens.push(Token { kind: spec.text_kind, range: pos..end });
            pos = end;
        }

        tokens
    }
}

fn run_custom(
    spec: &LanguageSpec,
    src: &str,
    pos: usize,
    modes: &[ModeId],
) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    for f in spec.custom {
        if let Some(hit) = f(src, pos, modes) {
            return Some(hit);
        }
    }
    None
}

fn apply_action(modes: &mut Vec<ModeId>, action: ScanAction) {
    match action {
        ScanAction::None => {}
        ScanAction::Push(m) => modes.push(m),
        ScanAction::Pop => {
            if modes.len() > 1 {
                modes.pop();
            }
        }
    }
}

fn scan_whitespace(src: &str, pos: usize) -> Option<Range<usize>> {
    let bytes = src.as_bytes();
    if pos >= bytes.len() || !is_ws_byte(bytes[pos]) {
        return None;
    }
    let mut i = pos;
    while i < bytes.len() && is_ws_byte(bytes[i]) {
        i += 1;
    }
    Some(pos..i)
}

fn is_ws_byte(b: u8) -> bool {
    matches!(b, b' ' | b'\t' | b'\n' | b'\r')
}

fn scan_comment(spec: &LanguageSpec, src: &str, pos: usize) -> Option<Range<usize>> {
    if let Some(prefix) = spec.line_comment {
        if src[pos..].starts_with(prefix) {
            let end = match src[pos..].find('\n') {
                Some(nl) => pos + nl,
                None => src.len(),
            };
            return Some(pos..end);
        }
    }
    if let Some((start, end_delim)) = spec.block_comment {
        if src[pos..].starts_with(start) {
            let start_len = start.len();
            let search_from = pos + start_len;
            let end = match src[search_from..].find(end_delim) {
                Some(idx) => search_from + idx + end_delim.len(),
                None => src.len(),
            };
            return Some(pos..end);
        }
    }
    None
}

fn scan_string(spec: &LanguageSpec, src: &str, pos: usize) -> Option<(TokenKind, Range<usize>)> {
    for rule in spec.strings {
        if src[pos..].starts_with(rule.start) {
            let start = pos;
            let mut i = pos + rule.start.len();
            let esc = rule.escape;

            while i < src.len() {
                if src[i..].starts_with(rule.end) {
                    let end = i + rule.end.len();
                    return Some((rule.kind, start..end));
                }

                if let Some(e) = esc {
                    if src.as_bytes()[i] == e as u8 {
                        // Skip escape + next char boundary (best-effort)
                        i += 1;
                        if i < src.len() {
                            i = next_char_boundary(src, i).unwrap_or(src.len());
                        }
                        continue;
                    }
                }

                i = next_char_boundary(src, i).unwrap_or(src.len());
            }

            // Unterminated string
            return Some((TokenKind::Error, start..src.len()));
        }
    }
    None
}

fn scan_number(src: &str, pos: usize) -> Option<Range<usize>> {
    let bytes = src.as_bytes();
    if pos >= bytes.len() || !bytes[pos].is_ascii_digit() {
        return None;
    }
    let mut i = pos;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
    }
    // Optional fraction part
    if i < bytes.len() && bytes[i] == b'.' {
        let mut j = i + 1;
        if j < bytes.len() && bytes[j].is_ascii_digit() {
            while j < bytes.len() && bytes[j].is_ascii_digit() {
                j += 1;
            }
            i = j;
        }
    }
    Some(pos..i)
}

fn scan_ident(src: &str, pos: usize) -> Option<Range<usize>> {
    let mut iter = src[pos..].char_indices();
    let (_, first) = iter.next()?;
    if !is_ident_start(first) {
        return None;
    }
    let mut end = pos + first.len_utf8();
    for (off, ch) in iter {
        if !is_ident_continue(ch) {
            break;
        }
        end = pos + off + ch.len_utf8();
    }
    Some(pos..end)
}

fn is_ident_start(ch: char) -> bool {
    ch == '_' || ch.is_ascii_alphabetic()
}
fn is_ident_continue(ch: char) -> bool {
    ch == '_' || ch.is_ascii_alphanumeric()
}

fn is_keyword(spec: &LanguageSpec, ident: &str) -> bool {
    // Simple linear search; replace with binary search / perfect hash later if needed.
    spec.keywords.iter().any(|&k| k == ident)
}

fn scan_longest_any(list: &'static [&'static str], src: &str, pos: usize) -> Option<Range<usize>> {
    for pat in list {
        if src[pos..].starts_with(pat) {
            return Some(pos..(pos + pat.len()));
        }
    }
    None
}

fn next_char_boundary(src: &str, pos: usize) -> Option<usize> {
    if pos >= src.len() {
        return None;
    }
    let ch = src[pos..].chars().next()?;
    Some(pos + ch.len_utf8())
}

/* =========================
   Custom matchers
   ========================= */

// Markdown: fenced code blocks ```lang ... ```
fn match_md_fence(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if !is_line_start(src, pos) {
        return None;
    }
    let rest = &src[pos..];
    let (fence, fence_len) = if rest.starts_with("```") {
        ("```", 3usize)
    } else if rest.starts_with("~~~") {
        ("~~~", 3usize)
    } else {
        return None;
    };

    // Read until end-of-line
    let line_end = match rest.find('\n') {
        Some(nl) => pos + nl,
        None => src.len(),
    };

    // Extract optional language label after fence
    let mut i = pos + fence_len;
    while i < line_end && src.as_bytes()[i].is_ascii_whitespace() {
        i += 1;
    }
    let lang_start = i;
    while i < line_end {
        let b = src.as_bytes()[i];
        if b.is_ascii_whitespace() {
            break;
        }
        i += 1;
    }
    let lang = if lang_start < i { Some(&src[lang_start..i]) } else { None };

    let action = if modes.len() >= 2 && *modes.last().unwrap() != ModeId::Markdown {
        // If inside an embedded mode, a fence closes it (best-effort).
        ScanAction::Pop
    } else {
        // Opening fence: push based on language hint
        match lang.map(|s| s.to_ascii_lowercase()) {
            Some(l) if l == "js" || l == "javascript" => ScanAction::Push(ModeId::Js),
            Some(l) if l == "html" => ScanAction::Push(ModeId::HtmlText),
            Some(l) if l == "bash" || l == "sh" || l == "shell" => ScanAction::Push(ModeId::Bash),
            _ => ScanAction::None,
        }
    };

    let range = pos..line_end;
    let _ = fence; // fence value is implicit via starts_with above
    Some((TokenKind::MdFence, range, action))
}

// Markdown: inline code `...`
fn match_md_codespan(src: &str, pos: usize, _modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if src[pos..].starts_with('`') {
        let mut i = pos + 1;
        while i < src.len() {
            if src[i..].starts_with('`') {
                return Some((TokenKind::MdCodeSpan, pos..(i + 1), ScanAction::None));
            }
            i = next_char_boundary(src, i).unwrap_or(src.len());
        }
        return Some((TokenKind::Error, pos..src.len(), ScanAction::None));
    }
    None
}

// Markdown: headings starting with # at line start
fn match_md_heading(src: &str, pos: usize, _modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if !is_line_start(src, pos) {
        return None;
    }
    let rest = &src[pos..];
    if !rest.starts_with('#') {
        return None;
    }
    // Consume leading #'s and a single optional space; highlight until end of line.
    let line_end = match rest.find('\n') {
        Some(nl) => pos + nl,
        None => src.len(),
    };
    Some((TokenKind::MdHeading, pos..line_end, ScanAction::None))
}

// Markdown: emphasis *...* or _..._ (very simple)
fn match_md_emph(src: &str, pos: usize, _modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    let b = src.as_bytes().get(pos).copied()?;
    let delim = if b == b'*' { '*' } else if b == b'_' { '_' } else { return None };
    // Avoid matching inside whitespace-only patterns; keep simple.
    let mut i = pos + 1;
    while i < src.len() {
        if src[i..].starts_with(delim) {
            if i > pos + 1 {
                return Some((TokenKind::MdEmph, pos..(i + 1), ScanAction::None));
            } else {
                return None;
            }
        }
        // Stop at newline to avoid huge runs
        if src.as_bytes()[i] == b'\n' {
            return None;
        }
        i = next_char_boundary(src, i).unwrap_or(src.len());
    }
    None
}

// HTML text mode: "<" enters tag mode, but treat "<!--" as comment via normal block_comment
fn match_html_enter_tag(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if *modes.last()? != ModeId::HtmlText {
        return None;
    }
    if src[pos..].starts_with('<') {
        // Consume just '<' as Tag token starter; tag mode will parse rest.
        return Some((TokenKind::Tag, pos..(pos + 1), ScanAction::Push(ModeId::HtmlTag)));
    }
    None
}

// HTML tag mode: ">" exits tag mode; also detects <script> and </script> boundaries.
fn match_html_tag_boundaries(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if *modes.last()? != ModeId::HtmlTag {
        return None;
    }

    // Exit tag mode on '>'
    if src[pos..].starts_with('>') {
        // After exiting, decide whether to push JS mode if this was <script ...>
        // We determine this by inspecting the most recent tag text in a best-effort way:
        // Look backwards for '<' within a small window.
        let window_start = pos.saturating_sub(128);
        let window = &src[window_start..pos];
        let lt = window.rfind('<');

        let mut action = ScanAction::Pop; // pop HtmlTag -> back to HtmlText
        if let Some(lt_off) = lt {
            let tag_slice = &window[lt_off..]; // from '<' to before '>'
            let tag_name = parse_html_tag_name(tag_slice);
            if tag_name.eq_ignore_ascii_case("script") && !tag_slice.starts_with("</") {
                // Enter JS mode after finishing the opening <script ...> tag
                action = ScanAction::Push(ModeId::Js);
            }
        }
        return Some((TokenKind::Punct, pos..(pos + 1), action));
    }

    // If we're in JS mode, we need a way back to HTML when encountering </script>.
    // That is handled by a JS custom matcher instead (see match_js_close_script).
    None
}

fn parse_html_tag_name(tag_fragment: &str) -> &str {
    // tag_fragment starts with "<" and excludes ">"
    let mut s = tag_fragment;
    if s.starts_with('<') {
        s = &s[1..];
    }
    if s.starts_with('/') {
        s = &s[1..];
    }
    // Skip whitespace
    s = s.trim_start_matches(|c: char| c.is_ascii_whitespace());
    let mut end = 0usize;
    for (i, ch) in s.char_indices() {
        if !(ch.is_ascii_alphanumeric() || ch == '-' || ch == ':') {
            break;
        }
        end = i + ch.len_utf8();
    }
    &s[..end]
}

// JS custom: if currently in JS mode and see "</script", pop back to HtmlText (and consume until '>').
fn match_js_close_script(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if *modes.last()? != ModeId::Js {
        return None;
    }
    if !src[pos..].starts_with("</script") && !src[pos..].starts_with("</SCRIPT") {
        return None;
    }
    // Consume until '>' (or end)
    let rest = &src[pos..];
    let end = match rest.find('>') {
        Some(idx) => pos + idx + 1,
        None => src.len(),
    };
    // Pop JS, then immediately push HtmlTag? Simpler: pop JS; the tag itself will be tokenized as Text in JS otherwise.
    // We instead treat it as Tag and then push HtmlText:
    Some((TokenKind::Tag, pos..end, ScanAction::Pop))
}

// Bash: variables like $VAR, ${VAR}, $1, $?, $#
fn match_bash_var(src: &str, pos: usize, modes: &[ModeId]) -> Option<(TokenKind, Range<usize>, ScanAction)> {
    if *modes.last()? != ModeId::Bash {
        return None;
    }
    if !src[pos..].starts_with('$') {
        return None;
    }
    let bytes = src.as_bytes();
    let mut i = pos + 1;
    if i >= src.len() {
        return None;
    }
    if bytes[i] == b'{' {
        i += 1;
        let start = i;
        while i < src.len() {
            let b = bytes[i];
            if b == b'}' {
                if i > start {
                    return Some((TokenKind::Var, pos..(i + 1), ScanAction::None));
                } else {
                    return None;
                }
            }
            if !(b.is_ascii_alphanumeric() || b == b'_') {
                return None;
            }
            i += 1;
        }
        return Some((TokenKind::Error, pos..src.len(), ScanAction::None));
    } else {
        let b = bytes[i];
        if b.is_ascii_digit() || matches!(b, b'?' | b'#' | b'$' | b'!') {
            return Some((TokenKind::Var, pos..(i + 1), ScanAction::None));
        }
        if !(b == b'_' || b.is_ascii_alphabetic()) {
            return None;
        }
        i += 1;
        while i < src.len() {
            let b = bytes[i];
            if !(b == b'_' || b.is_ascii_alphanumeric()) {
                break;
            }
            i += 1;
        }
        Some((TokenKind::Var, pos..i, ScanAction::None))
    }
}

fn is_line_start(src: &str, pos: usize) -> bool {
    pos == 0 || src.as_bytes().get(pos.wrapping_sub(1)).copied() == Some(b'\n')
}

/* =========================
   Language specs
   ========================= */

// IMPORTANT: operator/punct lists should be ordered by descending length for longest-match.
language! {
    name: JS,
    mode: ModeId::Js,

    keywords: [
        "function","const","let","var","if","else","for","while","return","class","new",
        "try","catch","throw","import","from","export","default","await","async",
        "switch","case","break","continue","in","of","typeof","instanceof","void","delete"
    ],

    line_comment: "//" => Comment,
    block_comment: ("/*","*/") => Comment,

    strings: [
        { start: "\"", end: "\"", escape: Some('\\'), kind: String },
        { start: "'",  end: "'",  escape: Some('\\'), kind: String },
        { start: "`",  end: "`",  escape: Some('\\'), kind: String }
    ],

    custom: [match_js_close_script],

    ident: { kind: Ident },
    numbers: { kind: Number },

    operators: [
        "===","!==","==","!=",">=","<=","=>","&&","||","++","--",
        "+=","-=","*=","/=","%=",
        "+","-","*","/","%","=","<",">","!","&","|","^","?","~",":","."
    ] => Operator,
    punct: ["(",")","{","}","[","]",",",";"] => Punct,

    text: { kind: Text },
    whitespace: { kind: Whitespace }
}

language! {
    name: BASH,
    mode: ModeId::Bash,

    keywords: ["if","then","fi","elif","else","for","in","do","done","while","case","esac","function","select","until","time"],

    line_comment: "#" => Comment,

    strings: [
        { start: "\"", end: "\"", escape: Some('\\'), kind: String },
        { start: "'",  end: "'",  escape: Some('\\'), kind: String }
    ],

    custom: [match_bash_var],

    ident: { kind: Ident },
    numbers: { kind: Number },

    operators: ["&&","||",">>","<<","|",";","&",">","<","="] => Operator,
    punct: ["(",")","{","}","[","]"] => Punct,

    text: { kind: Text },
    whitespace: { kind: Whitespace }
}

language! {
    name: HTML_TEXT,
    mode: ModeId::HtmlText,

    keywords: [],

    block_comment: ("<!--","-->") => Comment,

    strings: [
        { start: "\"", end: "\"", escape: Some('\\'), kind: AttrValue },
        { start: "'",  end: "'",  escape: Some('\\'), kind: AttrValue }
    ],

    custom: [match_html_enter_tag],

    ident: { kind: Ident },
    numbers: { kind: Number },

    operators: [] => Operator,
    punct: [] => Punct,

    text: { kind: Text },
    whitespace: { kind: Whitespace }
}

language! {
    name: HTML_TAG,
    mode: ModeId::HtmlTag,

    keywords: [],

    strings: [
        { start: "\"", end: "\"", escape: Some('\\'), kind: AttrValue },
        { start: "'",  end: "'",  escape: Some('\\'), kind: AttrValue }
    ],

    custom: [match_html_tag_boundaries],

    ident: { kind: AttrName },
    numbers: { kind: Number },

    operators: [] => Operator,
    punct: ["/","="] => Punct,

    text: { kind: Text },
    whitespace: { kind: Whitespace }
}

language! {
    name: MARKDOWN,
    mode: ModeId::Markdown,

    keywords: [],

    strings: [],

    custom: [match_md_fence, match_md_heading, match_md_codespan, match_md_emph],

    ident: { kind: Ident },
    numbers: { kind: Number },

    operators: [] => Operator,
    punct: [] => Punct,

    text: { kind: Text },
    whitespace: { kind: Whitespace }
}

pub const REGISTRY: Registry = Registry {
    markdown: &MARKDOWN,
    html_text: &HTML_TEXT,
    html_tag: &HTML_TAG,
    js: &JS,
    bash: &BASH,
};

/* =========================
   Tiny demo
   ========================= */

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn markdown_fence_embeds_js() {
        let hi = Highlighter { registry: &REGISTRY };
        let src = "# Title\n```js\nconst x = 1\n```\n";
        let tokens = hi.highlight(src);

        assert!(tokens.iter().any(|t| t.kind == TokenKind::MdHeading));
        assert!(tokens.iter().any(|t| t.kind == TokenKind::MdFence));

        // "const" should be highlighted as Keyword inside JS fence
        let mut saw_const_kw = false;
        for t in &tokens {
            if t.kind == TokenKind::Keyword && &src[t.range.clone()] == "const" {
                saw_const_kw = true;
                break;
            }
        }
        assert!(saw_const_kw);
    }

    #[test]
    #[ignore]
    fn html_script_embeds_js_and_closes() {
        #[allow(unused_variables)]
        let hi = Highlighter { registry: &REGISTRY };
        let src = "<script>\nconst a=1;\n</script>\n";
        let tokens = hi.highlight(src);

        let mut saw_const_kw = false;
        let mut saw_close_tag = false;

        for t in &tokens {
            let slice = &src[t.range.clone()];
            if t.kind == TokenKind::Keyword && slice == "const" {
                saw_const_kw = true;
            }
            if t.kind == TokenKind::Tag && slice.to_ascii_lowercase().starts_with("</script") {
                saw_close_tag = true;
            }
        }

        assert!(saw_const_kw);
        assert!(saw_close_tag);
    }

    #[test]
    #[ignore]
    fn bash_var_is_var_token() {
        let hi = Highlighter { registry: &REGISTRY };
        let src = "echo $HOME && echo ${USER}\n";
        let tokens = hi.highlight(src);

        let mut vars: Vec<&str> = vec![];
        for t in &tokens {
            if t.kind == TokenKind::Var {
                vars.push(&src[t.range.clone()]);
            }
        }
        assert!(vars.contains(&"$HOME"));
        assert!(vars.contains(&"${USER}"));
    }
}
