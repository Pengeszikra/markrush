# markrush is a minimal CLI code editor
caro build under 2sec.

## fast JS lexer added

```html
<div>hello</div>
<!-- bit interesting -->
```


This is a minimalist CLI code editor, 
written in rust. Start as markdown editor - super
with real time syntax highlithing.


README.md also writen itself.

## test
```bash
# remark in CLI
cargo run
./target/debug/md-rush README.md
```
## latest modification:
visual mode, yank and paste working
even for outside of this editor.

```js
//** @type{number} */
const z = 2456;

var doSomeFunction = (z) => console.log(z);

const (p) => {
  for (const m=2; m<20; m++){
    // solve some cycle
    doSomeFunction(m);   
  }
}
```

## RUST example
```rust
  print!("hello speed rust!");
```

> good or bad?