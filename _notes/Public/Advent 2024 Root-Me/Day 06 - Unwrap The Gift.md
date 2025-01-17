---
title: Root-XMAS 2024 Day 06 - Unwrap The Gift
feed: hide
permalink: /RootXMAS_2024_06
date: 06-12-2024
summary: We use safe crypto implementations, no vuln can arise.
---
### summary

an AES challenge where the CTR mode is used and the same key and IV is reused.
A simple xor with a known encrypted text gives us the flag.
### recon

Today we have a simple remote interface accessible via `nc` where Santa gives us an encrypted "wrapped" flag. He also allows us to encrypt another string we want to "wrap"
```bash
	nc 163.172.68.42 10006
--------------------------------------------------
  .-""-.
 /,..___\
() {_____}
  (/-@-@-\)
  {`-=^=-'}
  {  `-'  } Oh Oh Oh! Merry Root-Xmas to you!
   {     }
    `---'
--------------------------------------------------
[SANTA]: Hello player, welcome! Here is your gift for this christmas: ae6559387840c188285dd39d13915dafd5ddc4dfc3aced394b81f7d581654bc2b28cdcf6018860b78fac752dee7ea56c95a8f46d937f115bb6f49f189ef48e9c
[SANTA]: Oh, I forgot to tell you, you will only be able to unwrap it on the 25th, come back to me on that date to get the key!
--------------------------------------------------
[SANTA]: While Im at it, do you wish to wrap a present for someone? (Y/N)
	Y
[SANTA]: Enter the message you wish to wrap:
	aaaa
[SANTA]: Here is your wrapped present: 9d49431d440299db7303ebc140c41ef6
[SANTA]: Merry Christmas!
```

by checking the source code, we see the flag is encrypted in AES, but the key and IV are reused for the session.

```python
class Gift:
    def __init__(self):
        self.key = urandom(16)
        self.iv = urandom(12)
    
    def wrap(self, data):
        cipher = AES.new(self.key, 6, nonce=self.iv)
        data = data.encode()
        return hexlify(cipher.encrypt(pad(data, 16))).decode()
```

We also see the AES mode used is "6". That's not very clear, I suppose there is an enum with a more descriptive name.
Hopefully, with VSCode (or other editors), I can right click on the AES object, "go to definition" and get the AES lib source where i find

```python
MODE_CTR = 6
```

Then I just typed online "AES ctr CtF challenge" and landed On [John Hammonds' AES-CTR Cryptography: Reused Key Weakness - HackTheBox Cyber Apocalypse CtF](https://www.youtube.com/watch?v=Gtfr1dBGzHg) video.

The gist of it is on AES-CTR , with a reused key and IV, and if we can encrypt our known text, we get the flag if:

- we XOR the encrypted flag with the encrypted known payload
- we then XOR the result with the known payload plain-text
### solution

We could have done it manually, but for the challenge, let's automate the solution with a python script:

```python
from binascii import unhexlify
from pwn import *
import re

def get_encoded(conn, recvuntil :str):
    res = conn.recvuntil(bytes(recvuntil, "utf-8"), drop=True).decode("utf-8")
    return unhexlify(re.findall(r'[a-f0-9]{8,}',res)[0])

conn = remote('163.172.68.42',10006)
payload = "a"*60

flag_crypted = get_encoded(conn, '(Y/N)')
conn.send(bytes(f"Y\n{payload}\n", "utf-8"))
payload_crypted = get_encoded(conn, 'Merry Christmas')

blob = xor(flag_crypted, payload_crypted)
flag = xor(blob, payload)
print(flag)
```

`b'RM{D0NT_WR4P_YOUR_GIFTS_ W1TH_W3AK_CRYPTOGRAPHY:(} \x0f\x0f\x0f\x0f\...\x0fjjjj'`


now go do the [AES128-CTR](https://www.root-me.org/fr/Challenges/Cryptanalyse/AES128-CTR) challenge on Root-me, it's in the same vibe! (but harder ^^')


| Previous day | [[Day 05 - The Friendly Snowman]] |
| ------------ | --------------------------------- |
| Next day     | [[Day 07 - Go, Pwn, Gown]]        |