#![allow(dead_code)]

use core::ops::Range;

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StyleId {
    Text = 0,
    Whitespace = 1,
    Keyword = 2,
    Ident = 3,
    Number = 4,
    String = 5,
    Comment = 6,

    PunctLow = 7,
    PunctMid = 8,
    Operator = 9,

    Tag = 10,
    AttrName = 11,
    AttrValue = 12,

    MdHeading = 13,
    MdFence = 14,
    MdCodeSpan = 15,

    Var = 16,

    Error = 255,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Span {
    pub range: Range<usize>,
    pub style: StyleId,
}
