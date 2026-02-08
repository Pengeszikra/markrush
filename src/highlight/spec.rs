#![allow(dead_code)]

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

pub type ScanFn = fn(src: &str, pos: usize, limit_pos: usize, state: &mut State) -> Option<(Span, StepAction)>;

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

// Macro defined in langue_plugin.rs for reuse.
pub(crate) use crate::highlight::langue_plugin::language_plugin;
