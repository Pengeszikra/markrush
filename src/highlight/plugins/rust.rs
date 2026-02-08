#![allow(non_upper_case_globals)]

use crate::highlight::spec::language_plugin;

language_plugin! {
    id: Rust,
    name: "rust",
    extensions: ["rs"],

    keywords: [
        "fn","let","mut","if","else","match","loop","for","while","in","pub","mod","use","impl","trait","struct","enum","return","as","crate","super","Self","self","const","static","ref","move","async","await"
    ],

    punct_low: [",","::",";",":"],
    punct_mid: ["(",")","[","]","{","}"],
    operators: ["!","=","==","!=","<=",">=","<",">","+","-","*","/","%","&&","||","->","=>","&","|","^","~"],

    entry_rules: [],

    entry_style: PunctMid,
    scan_custom: None
}
