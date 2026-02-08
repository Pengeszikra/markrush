mod markdown;
mod js;
mod html;
mod bash;
mod rust;

pub use markdown::Markdown;
pub use js::Js;
pub use html::{HtmlText, HtmlTag};
pub use bash::Bash;
pub use rust::Rust;
