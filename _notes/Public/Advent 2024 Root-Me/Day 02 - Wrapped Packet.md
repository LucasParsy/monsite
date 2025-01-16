---
title: Root-XMAS 2024 Day 02 - Wrapped Packet
feed: hide
permalink: /RootXMAS_2024_02
date: 02-12-2024
summary: classic data exfiltration challenge.
---
### summary

Data exfiltration in a pcap via Ping requests (ICMP). 
I created a small scapy script to extract the data.
### recon

We have a pretty big Pcap (17Mb), so lots of possibilities are open to us.
Most of the requests are HTTPS. I first investigated on DNS exfiltration, before  thinking about [ping exfiltration](https://book.hacktricks.xyz/generic-methodologies-and-resources/exfiltration#icmp)


I applied the `icmp && ip.src==10.0.2.15` filter on Wireshark, and got loads of ping requests.
Their data field contained suspicious hex strings. I took one of the last one, put it on Cyberchef and got... `_Chr1stM_Chr1stM_Chr` ! Looks like a promising lead, just need to automate the extraction!
### solution

For once, i gave in to the easy way, and asked ChatGPT to generate me a script, and fixed it a bit.
I wouldn't have done better!

```python
from scapy.all import sniff
from scapy.layers.inet import IP, ICMP
import re

def process_packet(packet):
    if packet.haslayer(ICMP) and packet[IP].src == "10.0.2.15":
        # Extract the data field from the ICMP payload
        icmp_payload = packet[ICMP].payload.load
        # Convert the payload from hex to a string if it's hex-encoded
        try:
            hex_string = icmp_payload.decode('utf-8', errors='ignore')
            # there is some junk data at start, only keep hex
            hex_string = re.findall(r'[a-f0-9]{2,}',hex_string)[0]
            #print(hex_string)
            # Convert from hex to bytes, then decode into a string
            decoded_data = bytes.fromhex(hex_string).decode('utf-8', errors='ignore')
            print(decoded_data)
        except Exception as e:
            print(f"An error occurred while decoding: {e}")

# Sniff ICMP packets coming from the IP address "10.0.2.15"
sniff(offline='chall.pcapng', filter="icmp", prn=process_packet, store=0)

```

We get what seems to be a data exfiltration of OS information, with a flag at the end!
Data is repeated, across multiple packets, in order to prevent packet loss i guess.

```
PRETTY_NPRETTY_NPRET
AME="KalAME="KalAME=
i GNU/Lii GNU/Lii GN
nux Rollnux Rollnux 
ing"
NAMing"
NAMing"
E="Kali E="Kali E="K
GNU/LinuGNU/LinuGNU/
...
Hey you Hey you Hey 
found mefound mefoun
! Well d! Well d! We
one!
RM{M3rryRM{M3rryRM{M
_Chr1stM_Chr1stM_Chr
4s_R00T-4s_R00T-4s_R
M3}

```

Once manually cleaned, we get the flag!
`RM{M3rry_Chr1stM4s_R00T-M3}`

### aftertought

sneaky data exfiltration is real, By DNS or Ping, but if you do so, encrypt your data, as SOC can investigate the logs!

| Previous day | [[Day 01 - Generous Santa]]     |
| ------------ | ------------------------------- |
| Next day     | [[Day 03 - Santa's Magic Sack]] |