# markrush is a minimal CLI code editor

This is a minimalist CLI code editor, 
written in rust. Start as markdown editor
with real time syntax highlithing.

README.md also writen itself.

## test
```
cargo run
./target/debug/md-rush README.md
```

## latest modification:
visual mode, yank and paste working
even for outside of this editor.

```js
const z = 2456;

var doSomeFunction = (z) => console.log(z);

const (p) => {
  for (const m=2; m<20; m++){
    // solve some cycle
    doSomeFunction(m);   
  }
}
```