#![allow(dead_code)]
#![allow(unused_imports)]

pub mod span;
pub mod state;
pub mod spec;
pub mod registry;
pub mod stepper;
pub mod engine;
pub mod plugins;
pub mod langue_plugin;

pub use span::{Span, StyleId};
pub use state::{PluginId, PrevClass, State};
pub use registry::{Registry, REGISTRY};
pub use stepper::{Stepper, StepResult, StopReason};
pub use engine::{HighlighterEngine, WindowReq, WindowResult};
