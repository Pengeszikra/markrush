use std::io::{self, Write};
use std::ops::Range;

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

fn is_markdown_style(style: StyleId) -> bool {
    matches!(style, StyleId::MdHeading | StyleId::MdFence | StyleId::MdCodeSpan)
}

fn color_links_into(out: &mut String, line: &str, base_color: Option<&str>) {
    // Very small Markdown link highlighter: [text](url)
    let bytes = line.as_bytes();
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
}

fn render_segment_into(
    out: &mut String,
    full_text: &str,
    range: Range<usize>,
    style: StyleId,
    selection_abs: Option<(usize, usize)>,
) {
    let start = range.start;
    let mut end = range.end;
    if start >= end || start >= full_text.len() {
        return;
    }
    end = end.min(full_text.len());

    let base_color = style_color(style);
    let use_links = is_markdown_style(style);

    let write_plain = |out: &mut String, s: usize, e: usize| {
        if s >= e {
            return;
        }
        let slice = &full_text[s..e];
        if use_links {
            color_links_into(out, slice, base_color);
        } else {
            if let Some(color) = base_color {
                out.push_str(color);
            }
            out.push_str(slice);
        }
        out.push_str(RESET);
    };

    if let Some((sel_start, sel_end)) = selection_abs {
        if sel_end > start && sel_start < end {
            let sel_s = sel_start.max(start);
            let sel_e = sel_end.min(end);

            if start < sel_s {
                write_plain(out, start, sel_s);
            }

            out.push_str(SEL_BG);
            if let Some(color) = base_color {
                out.push_str(color);
            }
            out.push_str(&full_text[sel_s..sel_e]);
            out.push_str(RESET);

            if sel_e < end {
                write_plain(out, sel_e, end);
            }
            return;
        }
    }

    write_plain(out, start, end);
}

pub fn render_content_lines<W: Write>(
    full_text: &str,
    buffer: &[String],
    line_starts: &[usize],
    scroll: usize,
    content_rows: usize,
    spans: &[Span],
    selection_abs: Option<(usize, usize)>,
    mut out: W,
) -> io::Result<()> {
    let merged_spans = merge_adjacent_spans(spans);
    let spans = merged_spans.as_slice();
    let mut span_idx = 0usize;
    let mut line_out = String::new();

    for row in 0..content_rows {
        let line_idx = scroll + row;
        if line_idx >= buffer.len() {
            out.write_all(b"\r\n")?;
            continue;
        }

        let line_start = line_starts[line_idx];
        let line_end = line_start + buffer[line_idx].len();

        while span_idx < spans.len() && spans[span_idx].range.end <= line_start {
            span_idx += 1;
        }

        line_out.clear();
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
                render_segment_into(&mut line_out, full_text, pos..seg_start, StyleId::Text, selection_abs);
            }

            render_segment_into(
                &mut line_out,
                full_text,
                seg_start..seg_end,
                sp.style,
                selection_abs,
            );

            pos = seg_end;

            if sp.range.end > line_end {
                break;
            }
            local_idx += 1;
        }

        if pos < line_end {
            render_segment_into(&mut line_out, full_text, pos..line_end, StyleId::Text, selection_abs);
        }

        line_out.push_str(RESET);
        line_out.push_str("\r\n");
        out.write_all(line_out.as_bytes())?;

        span_idx = local_idx;
    }

    Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn render_large_buffer_is_fast_path() {
        let line_count = 10_000;
        let mut buffer = Vec::with_capacity(line_count);
        for i in 0..line_count {
            buffer.push(format!("line {i} content"));
        }
        let full_text = buffer.join("\n");
        let mut starts = Vec::with_capacity(buffer.len());
        let mut offset = 0usize;
        for (i, line) in buffer.iter().enumerate() {
            starts.push(offset);
            offset += line.len();
            if i + 1 < buffer.len() {
                offset += 1;
            }
        }

        let mut out = Vec::new();
        render_content_lines(
            &full_text,
            &buffer,
            &starts,
            0,
            buffer.len(),
            &[],
            None,
            &mut out,
        )
        .expect("render should succeed");

        assert!(!out.is_empty());
    }
}
