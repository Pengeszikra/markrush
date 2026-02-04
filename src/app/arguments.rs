#[derive(Clone)]
pub struct CliConfig {
    pub file: Option<String>,
    pub print_mode: bool,
    pub help: bool,
    pub copy_mode: bool,
}

pub fn parse_args<I: Iterator<Item = String>>(args: I) -> CliConfig {
    let mut cfg = CliConfig { file: None, print_mode: false, help: false, copy_mode: false };
    for arg in args {
        match arg.as_str() {
            "-p" | "--print" => cfg.print_mode = true,
            "-h" | "--help" | "-?" => cfg.help = true,
            "-c" | "--copy" => cfg.copy_mode = true,
            _ if arg.starts_with('-') => {
                eprintln!("Unknown flag: {arg}");
            }
            _ => {
                if cfg.file.is_none() {
                    cfg.file = Some(arg);
                } else {
                    eprintln!("Ignoring extra argument: {arg}");
                }
            }
        }
    }
    cfg
}
