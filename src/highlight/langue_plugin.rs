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
