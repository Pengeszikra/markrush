use crate::highlight::span::{Span, StyleId};
use crate::highlight::state::{PluginId, State};

#[derive(Clone, Copy, Debug)]
pub enum Trigger {
    Prefix(&'static str),
    Byte(u8),
}

pub type GuardFn = fn(src: &str, pos: usize, state: &State) -> bool;

#[derive(Clone, Copy)]
pub enum Guard {
    Always,
    AtLineStart,
    PrevIsExprStart,
    Custom(GuardFn),
}

#[derive(Clone, Copy)]
pub struct EntryRule {
    pub child: PluginId,
    pub trigger: Trigger,
    pub guard: Guard,
}

pub type ScanFn = fn(src: &str, pos: usize, state: &mut State) -> Option<(Span, StepAction)>;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StepAction {
    None,
    Push(PluginId),
    Pop,
}

pub struct PluginSpec {
    pub id: PluginId,
    pub name: &'static str,
    pub extensions: &'static [&'static str],

    pub keywords: &'static [&'static str],
    pub punct_low: &'static [&'static str],
    pub punct_mid: &'static [&'static str],
    pub operators: &'static [&'static str],

    pub entry_rules: &'static [EntryRule],
    pub scan_custom: Option<ScanFn>,

    // Style used for boundary spans emitted by entry rules
    pub entry_style: StyleId,
}

// Simple macro (not final DSL). Produces a const PluginSpec.
macro_rules! language_plugin {
    (
        id: $id:ident,
        name: $name:literal,
        extensions: [$($ext:literal),* $(,)?],

        keywords: [$($kw:literal),* $(,)?],

        punct_low: [$($pl:literal),* $(,)?],
        punct_mid: [$($pm:literal),* $(,)?],
        operators: [$($op:literal),* $(,)?],

        entry_rules: [$({ child: $child:ident, trigger: $trig:ident($trig_val:expr), guard: $guard:ident $(($guard_fn:expr))? }),* $(,)?],

        entry_style: $entry_style:ident,
        scan_custom: $scan_custom:expr
    ) => {
        pub const $id: PluginSpec = PluginSpec {
            id: PluginId::$id,
            name: $name,
            extensions: &[$($ext),*],

            keywords: &[$($kw),*],
            punct_low: &[$($pl),*],
            punct_mid: &[$($pm),*],
            operators: &[$($op),*],

            entry_rules: &[
                $(
                    EntryRule {
                        child: PluginId::$child,
                        trigger: Trigger::$trig($trig_val),
                        guard: language_plugin!(@guard $guard $(($guard_fn))? ),
                    }
                ),*
            ],

            entry_rules_len: 0, // dummy to detect compile errors if macro drifted
            scan_custom: $scan_custom,
            entry_style: StyleId::$entry_style,
        };
    };

    (@guard Always) => { Guard::Always };
    (@guard AtLineStart) => { Guard::AtLineStart };
    (@guard PrevIsExprStart) => { Guard::PrevIsExprStart };
    (@guard Custom($f:expr)) => { Guard::Custom($f) };
}

// Workaround: Rust does not allow extra fields in macro above.
// We keep PluginSpec stable and define specs in plugins/ files using a re-export macro.
pub(crate) use language_plugin;

