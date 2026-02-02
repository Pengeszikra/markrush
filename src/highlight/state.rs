#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PluginId {
    Markdown,
    Js,
    HtmlText,
    HtmlTag,
    Bash,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PrevClass {
    None,
    Space,
    Newline,
    Word,
    Operator,
    Punct,
    ExprStart,
    ExprEnd,
}

#[derive(Clone, Debug)]
pub struct State {
    pub stack: SmallStack<PluginId, 8>,
    pub prev: PrevClass,

    pub in_block_comment: bool,
    pub in_string_delim: Option<u8>,
}

impl State {
    pub fn new_default() -> Self {
        let mut stack = SmallStack::new();
        stack.push(PluginId::Markdown);
        Self {
            stack,
            prev: PrevClass::None,
            in_block_comment: false,
            in_string_delim: None,
        }
    }

    pub fn current(&self) -> PluginId {
        *self.stack.last().unwrap()
    }
}

#[derive(Clone, Debug)]
pub struct SmallStack<T: Copy, const N: usize> {
    buf: [T; N],
    len: usize,
    has_overflow: bool,
}

impl<const N: usize> SmallStack<PluginId, N> {
    pub fn new() -> Self {
        let dummy = PluginId::Markdown;
        Self { buf: [dummy; N], len: 0, has_overflow: false }
    }
}

impl<T: Copy, const N: usize> SmallStack<T, N> {
    pub fn push(&mut self, v: T) {
        if self.len < N {
            self.buf[self.len] = v;
            self.len += 1;
        } else {
            self.has_overflow = true;
        }
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 { return None; }
        self.len -= 1;
        Some(self.buf[self.len])
    }

    pub fn last(&self) -> Option<&T> {
        if self.len == 0 { None } else { Some(&self.buf[self.len - 1]) }
    }

    pub fn len(&self) -> usize { self.len }

    #[allow(dead_code)]
    pub fn has_overflowed(&self) -> bool { self.has_overflow }
}

