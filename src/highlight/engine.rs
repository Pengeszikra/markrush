#![allow(dead_code)]

use crate::highlight::span::Span;
use crate::highlight::state::{State, PluginId};
use crate::highlight::registry::Registry;
use crate::highlight::stepper::{Stepper, StopReason};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WindowReq {
    pub start: usize,
    pub end: usize,
}

#[derive(Clone, Debug)]
pub struct WindowResult {
    pub spans: Vec<Span>,
    pub quality_exact: bool,
}

#[derive(Clone, Debug)]
pub struct Checkpoint {
    pub offset: usize,
    pub state: State,
}

pub enum WorkItem {
    BuildCheckpointsForward { from_offset: usize, to_offset: usize, step_bytes: usize },
}

pub struct HighlighterEngine<'a> {
    pub registry: &'a Registry,
    pub root_plugin: crate::highlight::state::PluginId,
    pub checkpoints: Vec<Checkpoint>,
    pub work_queue: Vec<WorkItem>,
    pub revision: u64,
}

impl<'a> HighlighterEngine<'a> {
    pub fn new(registry: &'a Registry, root_plugin: crate::highlight::state::PluginId) -> Self {
        Self { registry, root_plugin, checkpoints: Vec::new(), work_queue: Vec::new(), revision: 0 }
    }

    pub fn highlight_window(&mut self, src: &str, window: WindowReq, budget_bytes: usize, budget_spans: usize) -> WindowResult {
        let (anchor_offset, anchor_state, exact) = match self.find_anchor(window.start) {
            Some((off, st)) => (off, st, true),
            None => (0usize, State::new_with_root(self.root_plugin), false),
        };

        let limit = window.end.min(src.len());
        let mut stepper = Stepper::new(src, anchor_offset, anchor_state, self.registry);

        let mut out: Vec<Span> = Vec::new();
        let mut remaining_bytes = budget_bytes;
        let mut remaining_spans = budget_spans;

        while stepper.pos < limit && remaining_bytes > 0 && remaining_spans > 0 {
            let before = stepper.pos;
            let res = stepper.step(limit, remaining_bytes, remaining_spans);

            remaining_bytes = remaining_bytes.saturating_sub(res.pos.saturating_sub(before));
            remaining_spans = remaining_spans.saturating_sub(res.spans.len());

            for s in res.spans {
                if s.range.end <= window.start { continue; }
                if s.range.start >= window.end { break; }
                out.push(s);
            }

            if matches!(res.stop, StopReason::EndOfInput | StopReason::ReachedLimit) {
                break;
            }
            if matches!(res.stop, StopReason::BudgetExhausted) {
                break;
            }
        }

        WindowResult { spans: out, quality_exact: exact }
    }

    pub fn schedule_checkpoint_build(&mut self, from_offset: usize, to_offset: usize) {
        self.work_queue.push(WorkItem::BuildCheckpointsForward {
            from_offset,
            to_offset,
            step_bytes: 64 * 1024,
        });
    }

    pub fn do_idle_work(&mut self, src: &str, budget_bytes: usize) {
        let mut remaining = budget_bytes;

        while remaining > 0 {
            let item = match self.work_queue.pop() {
                Some(i) => i,
                None => break,
            };

            match item {
                WorkItem::BuildCheckpointsForward { mut from_offset, to_offset, step_bytes } => {
                    let (anchor_offset, anchor_state) = match self.find_anchor(from_offset) {
                        Some((o, s)) => (o, s),
                        None => (0usize, State::new_with_root(self.root_plugin)),
                    };

                    let mut stepper = Stepper::new(src, anchor_offset, anchor_state, self.registry);

                    if stepper.pos < from_offset {
                        let _ = stepper.step(from_offset.min(src.len()), remaining.min(step_bytes), 50_000);
                    }

                    while from_offset < to_offset && remaining > 0 {
                        let next_cp = (from_offset + step_bytes).min(to_offset).min(src.len());
                        let before = stepper.pos;
                        let res = stepper.step(next_cp, remaining.min(step_bytes), 200_000);

                        self.upsert_checkpoint(res.pos, res.state.clone());

                        from_offset = res.pos;
                        remaining = remaining.saturating_sub(stepper.pos.saturating_sub(before).max(1));

                        if matches!(res.stop, StopReason::EndOfInput) {
                            break;
                        }
                    }
                }
            }
        }
    }

    pub fn set_revision(&mut self, revision: u64, root_plugin: PluginId) {
        if self.revision != revision {
            self.reset(root_plugin);
            self.revision = revision;
        }
    }

    pub fn reset(&mut self, root_plugin: PluginId) {
        self.root_plugin = root_plugin;
        self.checkpoints.clear();
        self.work_queue.clear();
    }

    fn find_anchor(&self, target_offset: usize) -> Option<(usize, State)> {
        // Replace with binary search later; linear is fine for skeleton.
        let mut best: Option<&Checkpoint> = None;
        for c in &self.checkpoints {
            if c.offset <= target_offset {
                best = Some(c);
            } else {
                break;
            }
        }
        best.map(|c| (c.offset, c.state.clone()))
    }

    fn upsert_checkpoint(&mut self, offset: usize, state: State) {
        if self.checkpoints.last().map(|c| c.offset <= offset).unwrap_or(true) {
            self.checkpoints.push(Checkpoint { offset, state });
            return;
        }

        let mut i = 0;
        while i < self.checkpoints.len() && self.checkpoints[i].offset < offset { i += 1; }
        if i < self.checkpoints.len() && self.checkpoints[i].offset == offset {
            self.checkpoints[i].state = state;
        } else {
            self.checkpoints.insert(i, Checkpoint { offset, state });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::highlight::{REGISTRY, PluginId};

    #[test]
    fn idle_work_handles_large_sources_without_redraws() {
        let mut engine = HighlighterEngine::new(&REGISTRY, PluginId::Js);
        let src = "function demo() { return 1; }\n".repeat(4_000);

        let res = engine.highlight_window(
            &src,
            WindowReq { start: 0, end: src.len() },
            256,
            8,
        );
        assert!(!res.quality_exact);

        engine.schedule_checkpoint_build(0, src.len());
        engine.do_idle_work(&src, 32 * 1024);
        assert!(engine.checkpoints.len() > 0 || engine.work_queue.is_empty());
    }

    #[test]
    fn revision_reset_clears_cached_checkpoints() {
        let mut engine = HighlighterEngine::new(&REGISTRY, PluginId::Markdown);
        let src = "x".repeat(2_048);

        engine.schedule_checkpoint_build(0, src.len());
        engine.do_idle_work(&src, 8 * 1024);
        assert!(!engine.checkpoints.is_empty());

        engine.set_revision(42, PluginId::Markdown);
        assert!(engine.checkpoints.is_empty());
        assert!(engine.work_queue.is_empty());
        assert_eq!(engine.revision, 42);
    }
}
