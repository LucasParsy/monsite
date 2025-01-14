---
title: Root-XMAS 2024 Day 09 - The Christmas Thief
feed: show
permalink: /RootXMAS_2024_09
date: 09-12-2024
summary: clear-text encryption
---
### summary

A PCAP containing clear HTTP uploads, notably a remoting tool config file containing passwords. The passwords are encrypted, but with a default key. 
### recon

We have a PCAP file, and let's just navigate it with Wireshark and follow our instinct.
We see some HTTP requests, notably to `naughty-santa.xmas:8080` . The website is innacessible, and reading the content of the GET requests don't reveal any interesting leads, despite the mention of a `/flag.txt` .

However we see some POST request that look promising! Let's filter them on Wireshark:

```c
http.request.method =="POST"
```

then we can extract their content, by inspecting the Multipart Post content of the packet and right-click -> "export packet bytes"

![[rmxmas24d09_exportpacket.png|"exporter Packets Octets" as we say in french...]]


We get some funny memes!

![[rmxmas24d09_memespip.png]]

![[rmxmas24d09_meme.png]]
### solution

But more importantly, we extract a `consconf.xml` file that seems juicy!

```xml
<?xml version="1.0" encoding="utf-8"?>
<mrng:Connections xmlns:mrng="http://mremoteng.org" ... EncryptionEngine="AES" BlockCipherMode="GCM"...>
<Node Name="root-me prod" ... Username="root" ... Password="XD6l5yf...".../>
<Node Name="root-me challenges" ... Username="challenges" ... />
<Node Name="root-me v2" ... Username="nishacid" ... />
```

Passwords! but they're encrypted... maybe we can bruteforce them, is there a tool?
We search "mremoteng password config decrypt" and immediatly get [mRemoteNG_password_decrypt](https://github.com/gquere/mRemoteNG_password_decrypt) . And apparently passwords are by default encrypted with an hardcoded key, `mR3m` !!

```bash
./mremoteng_decrypt.py consconf.xml
	Name: root-me prod
	Hostname: 10.0.16.100
	Username: root
	Password: grosbisous
	
	Name: root-me challenges
	Hostname: 10.0.12.98
	Username: challenges
	Password: letsgrabflags
	
	Name: root-me v2
	Hostname: 10.1.13.37
	Username: nishacid
	Password: RM{R3m0t3_cLi3Nt_4r3_n0t_S0_s3cur3}
```

### closing thoughts

It's been 10 years we repeat it, never use HTTP!
Also, if your tools that store sensitive data use a default password, change it with a strong one!

An easy one today after an heavy weekend :) Funny memes, but does this mean a V2 for root-me is really coming? 👀 Don't give me hope...
