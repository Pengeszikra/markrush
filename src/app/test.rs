#[cfg(test)]
mod tests {
    use crate::app::editor::Editor;
    use crate::app::helpers::copy_file_and_preview;
    use crate::highlight::{HighlighterEngine, REGISTRY, WindowReq, PluginId, Span, StyleId};

    #[test]
    fn append_to_line_end_enters_insert_and_moves_cursor() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["hello".to_string()];
        ed.col = 2;
        ed.command_append_line_end();
        assert_eq!(ed.col, 5);
        assert!(matches!(ed.mode, crate::r#struct::Mode::Insert));
        assert_eq!(ed.row, 0);
    }

    #[test]
    fn open_line_below_inserts_empty_line_and_positions_cursor() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["aaa".into(), "bbb".into()];
        ed.row = 0;
        ed.open_line_below();

        assert_eq!(ed.buffer, vec!["aaa".to_string(), "".to_string(), "bbb".to_string()]);
        assert_eq!(ed.row, 1);
        assert_eq!(ed.col, 0);
        assert!(ed.dirty);
        assert!(matches!(ed.mode, crate::r#struct::Mode::Insert));
        assert_eq!(ed.undo.len(), 1);
    }

    #[test]
    fn clamp_cursor_limits_column_to_line_length() {
        let mut ed = Editor::open(None, 24);
        ed.buffer = vec!["hi".into()];
        ed.col = 10;
        ed.clamp_cursor();
        assert_eq!(ed.col, 2);
    }

    #[test]
    fn copy_file_and_preview_errors_on_missing_file() {
        let res = copy_file_and_preview("definitely_missing_file_12345.md");
        assert!(res.is_err());
    }

    #[test]
    fn html_comment_in_fence_is_comment() {
        let src = "```html\n<!-- x -->\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Comment && &src[s.range.clone()] == "<!-- x -->"));
    }

    #[test]
    fn rust_macro_ident_is_keyword() {
        let src = "```rust\nprint!()\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Keyword && &src[s.range.clone()] == "print"));
    }

    #[test]
    fn jsdoc_tag_is_keyword_inside_comment() {
        let src = "```js\n/** @type {number} */\n```";
        let spans = highlight(src);
        assert!(spans.iter().any(|s| s.style == StyleId::Keyword && &src[s.range.clone()] == "@type"));
        assert!(spans.iter().any(|s| s.style == StyleId::Comment));
    }

    fn highlight(src: &str) -> Vec<Span> {
        let mut engine = HighlighterEngine::new(&REGISTRY, PluginId::Markdown);
        let res = engine.highlight_window(
            src,
            WindowReq { start: 0, end: src.len() },
            src.len().saturating_add(1024),
            200_000,
        );
        res.spans
    }
}
