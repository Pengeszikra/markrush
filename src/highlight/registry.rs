use crate::highlight::state::PluginId;
use crate::highlight::spec::PluginSpec;

pub struct Registry {
    pub markdown: &'static PluginSpec,
    pub js: &'static PluginSpec,
    pub html_text: &'static PluginSpec,
    pub html_tag: &'static PluginSpec,
    pub bash: &'static PluginSpec,
}

impl Registry {
    pub fn by_id(&self, id: PluginId) -> &'static PluginSpec {
        match id {
            PluginId::Markdown => self.markdown,
            PluginId::Js => self.js,
            PluginId::HtmlText => self.html_text,
            PluginId::HtmlTag => self.html_tag,
            PluginId::Bash => self.bash,
        }
    }
}

use crate::highlight::plugins::{Bash, HtmlTag, HtmlText, Js, Markdown};

pub const REGISTRY: Registry = Registry {
    markdown: &Markdown,
    js: &Js,
    html_text: &HtmlText,
    html_tag: &HtmlTag,
    bash: &Bash,
};
