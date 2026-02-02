// Stable helper macro to build PluginSpec constants.
macro_rules! language_plugin {
    (
        id: $id:ident,
        name: $name:literal,
        extensions: [$($ext:literal),* $(,)?],

        keywords: [$($kw:literal),* $(,)?],

        punct_low: [$($pl:literal),* $(,)?],
        punct_mid: [$($pm:literal),* $(,)?],
        operators: [$($op:literal),* $(,)?],

        entry_rules: [
            $(
                {
                    child: $child:ident,
                    trigger: $trig:ident($trig_val:expr),
                    guard: $guard:ident $(($guard_fn:expr))?
                }
            ),* $(,)?
        ],

        entry_style: $entry_style:ident,
        scan_custom: $scan_custom:expr
    ) => {
        pub const $id: crate::highlight::spec::PluginSpec = crate::highlight::spec::PluginSpec {
            id: crate::highlight::state::PluginId::$id,
            name: $name,
            extensions: &[$($ext),*],

            keywords: &[$($kw),*],
            punct_low: &[$($pl),*],
            punct_mid: &[$($pm),*],
            operators: &[$($op),*],

            entry_rules: &[
                $(
                    crate::highlight::spec::EntryRule {
                        child: crate::highlight::state::PluginId::$child,
                        trigger: crate::highlight::spec::Trigger::$trig($trig_val),
                        guard: language_plugin!(@guard $guard $(($guard_fn))? ),
                    }
                ),*
            ],

            entry_style: crate::highlight::span::StyleId::$entry_style,
            scan_custom: $scan_custom,
        };
    };

    (@guard Always) => { crate::highlight::spec::Guard::Always };
    (@guard AtLineStart) => { crate::highlight::spec::Guard::AtLineStart };
    (@guard PrevIsExprStart) => { crate::highlight::spec::Guard::PrevIsExprStart };
    (@guard Custom($f:expr)) => { crate::highlight::spec::Guard::Custom($f) };
}

pub(crate) use language_plugin;

#[cfg(test)]
mod tests {
    #![allow(non_upper_case_globals)]
    use super::*;
    use crate::highlight::span::{Span, StyleId};
    use crate::highlight::spec::{Guard, StepAction, Trigger};
    use crate::highlight::state::{PluginId, State};

    fn dummy_scan(_src: &str, _pos: usize, _state: &mut State) -> Option<(Span, StepAction)> {
        None
    }

    language_plugin! {
        id: Markdown,
        name: "tmd-test",
        extensions: ["tmd"],

        keywords: ["if"],

        punct_low: [","],
        punct_mid: ["("],
        operators: ["+","-"],

        entry_rules: [
            { child: Js, trigger: Prefix("```js"), guard: AtLineStart },
        ],

        entry_style: MdFence,
        scan_custom: Some(dummy_scan)
    }

    language_plugin! {
        id: Js,
        name: "tjs-test",
        extensions: ["tjs","js"],

        keywords: ["const"],

        punct_low: [","],
        punct_mid: ["("],
        operators: ["+"],

        entry_rules: [],

        entry_style: Operator,
        scan_custom: None
    }

    #[test]
    fn builds_specs() {
        assert_eq!(Markdown.name, "tmd-test");
        assert_eq!(Markdown.extensions.len(), 1);
        assert_eq!(Js.extensions.len(), 2);
        assert_eq!(Markdown.entry_rules.len(), 1);
        match Markdown.entry_rules[0].trigger {
            Trigger::Prefix(pat) => assert_eq!(pat, "```js"),
            _ => panic!("wrong trigger"),
        }
        assert_eq!(Markdown.entry_style as u8, StyleId::MdFence as u8);
    }
}
