use crate::highlight::{Span, StyleId};

const HEADER_COLOR: &str = "\u{1b}[1;36m"; // bright cyan for headings
const CODE_COLOR: &str = "\u{1b}[38;5;70m"; // soft green for code blocks
const LINK_COLOR: &str = "\u{1b}[1;34m"; // bright blue for links
const SEL_BG: &str = "\u{1b}[48;5;238m"; // dark grey selection background
const RESET: &str = "\u{1b}[0m";

const PUNCT_LOW_COLOR: &str = "\u{1b}[38;5;240m"; // low visibility punctuation
const PUNCT_MID_COLOR: &str = "\u{1b}[38;5;247m"; // mid visibility punctuation
const OP_COLOR: &str = "\u{1b}[1;37m"; // bright operator
const KEYWORD_COLOR: &str = "\u{1b}[1;34m";
const STRING_COLOR: &str = "\u{1b}[38;5;114m";
const COMMENT_COLOR: &str = "\u{1b}[38;5;244m";
const NUMBER_COLOR: &str = "\u{1b}[1;33m";
const TAG_COLOR: &str = "\u{1b}[1;35m";
const ATTR_VALUE_COLOR: &str = "\u{1b}[38;5;180m";
const VAR_COLOR: &str = "\u{1b}[32m";

pub fn style_color(style: StyleId) -> Option<&'static str> {
    match style {
        StyleId::MdHeading => Some(HEADER_COLOR),
        StyleId::MdFence | StyleId::MdCodeSpan => Some(CODE_COLOR),

        StyleId::Keyword => Some(KEYWORD_COLOR),
        StyleId::String => Some(STRING_COLOR),
        StyleId::Comment => Some(COMMENT_COLOR),
        StyleId::Number => Some(NUMBER_COLOR),

        StyleId::Tag | StyleId::AttrName => Some(TAG_COLOR),
        StyleId::AttrValue => Some(ATTR_VALUE_COLOR),

        StyleId::Var => Some(VAR_COLOR),

        StyleId::Operator => Some(OP_COLOR),
        StyleId::PunctLow => Some(PUNCT_LOW_COLOR),
        StyleId::PunctMid => Some(PUNCT_MID_COLOR),

        _ => None,
    }
}

pub fn render_segment(
    full_text: &str,
    start: usize,
    end: usize,
    base_color: Option<&str>,
    selection_abs: Option<(usize, usize)>,
) -> String {
    if start >= end || start >= full_text.len() {
        return String::new();
    }

    let end = end.min(full_text.len());

    if let Some((sel_start, sel_end)) = selection_abs {
        if sel_end <= start || sel_start >= end {
            let mut out = color_links(&full_text[start..end], base_color);
            out.push_str(RESET);
            return out;
        }

        let sel_s = sel_start.max(start);
        let sel_e = sel_end.min(end);

        let mut out = String::new();
        if start < sel_s {
            out.push_str(&color_links(&full_text[start..sel_s], base_color));
            out.push_str(RESET);
        }

        out.push_str(SEL_BG);
        if let Some(color) = base_color {
            out.push_str(color);
        }
        out.push_str(&full_text[sel_s..sel_e]);
        out.push_str(RESET);

        if sel_e < end {
            out.push_str(&color_links(&full_text[sel_e..end], base_color));
            out.push_str(RESET);
        }
        return out;
    }

    let mut out = color_links(&full_text[start..end], base_color);
    out.push_str(RESET);
    out
}

pub fn color_links(line: &str, base_color: Option<&str>) -> String {
    // Very small Markdown link highlighter: [text](url)
    // Color the whole [..](..) segment.
    let bytes = line.as_bytes();
    let mut out = String::new();
    let mut idx = 0usize;

    if let Some(color) = base_color {
        out.push_str(color);
    }

    while idx < bytes.len() {
        let rel_start = match line[idx..].find('[') {
            Some(v) => v,
            None => break,
        };
        let start = idx + rel_start;

        // Find "]("
        if let Some(rel_mid) = line[start..].find("](") {
            let mid = start + rel_mid;

            // Find ')'
            if let Some(rel_end) = line[mid + 2..].find(')') {
                let end = mid + 2 + rel_end;

                out.push_str(&line[idx..start]);

                let link = &line[start..=end];
                out.push_str(LINK_COLOR);
                out.push_str(link);

                if let Some(color) = base_color {
                    out.push_str(color);
                } else {
                    out.push_str(RESET);
                }

                idx = end + 1;
                continue;
            }
        }

        out.push_str(&line[idx..=start]);
        idx = start + 1;
    }

    if idx < bytes.len() {
        out.push_str(&line[idx..]);
    }

    out
}

pub fn render_content_lines(
    full_text: &str,
    buffer: &[String],
    line_starts: &[usize],
    scroll: usize,
    content_rows: usize,
    spans: &[Span],
    selection_abs: Option<(usize, usize)>,
) {
    let merged_spans = merge_adjacent_spans(spans);
    let spans = merged_spans.as_slice();
    let mut span_idx = 0usize;

    for row in 0..content_rows {
        let line_idx = scroll + row;
        if line_idx >= buffer.len() {
            println!();
            continue;
        }

        let line_start = line_starts[line_idx];
        let line_end = line_start + buffer[line_idx].len();

        while span_idx < spans.len() && spans[span_idx].range.end <= line_start {
            span_idx += 1;
        }

        let mut line_out = String::new();
        let mut pos = line_start;
        let mut local_idx = span_idx;

        while local_idx < spans.len() {
            let sp = &spans[local_idx];
            if sp.range.start >= line_end {
                break;
            }

            let seg_start = sp.range.start.max(line_start);
            let seg_end = sp.range.end.min(line_end);

            if pos < seg_start {
                line_out.push_str(&render_segment(full_text, pos, seg_start, None, selection_abs));
            }

            line_out.push_str(&render_segment(
                full_text,
                seg_start,
                seg_end,
                style_color(sp.style),
                selection_abs,
            ));

            pos = seg_end;

            if sp.range.end > line_end {
                break;
            }
            local_idx += 1;
        }

        if pos < line_end {
            line_out.push_str(&render_segment(full_text, pos, line_end, None, selection_abs));
        }

        line_out.push_str(RESET);
        print!("{line_out}\r\n");

        span_idx = local_idx;
    }
}

fn merge_adjacent_spans(spans: &[Span]) -> Vec<Span> {
    if spans.is_empty() {
        return Vec::new();
    }
    let mut out: Vec<Span> = Vec::with_capacity(spans.len());
    for sp in spans {
        if let Some(last) = out.last_mut() {
            if last.style == sp.style && last.range.end == sp.range.start {
                last.range.end = sp.range.end;
                continue;
            }
        }
        out.push(sp.clone());
    }
    out
}
