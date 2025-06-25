---
title: Root-XMAS 2024 Day 14 - Almost a Gift
feed: hide
permalink: /RootXMAS_2024_14
date: 14-12-2024
summary: I only copy-paste, like a good programmer.
---

### summary

An RSA challenge where we get a complex problem of Approximate Greatest Common Divisor, using a Lattice Reduction attacks... coded by someone else ^^' 
### recon

We have a "simple" script that creates an RSA key to encrypt a flag, and prints the encrypted flag, and the public parts of the key (RSA exponent `n` and public modulus `e`)

To make the challenge solvable, it lets us guess one of the prime numbers ,`p`, that constitutes `n` as  `p*q == n`.
For this we are revealed 4 numbers in the form `p * getPrime(1337) +randbits(666)`

exact code below: 

```python
from secrets import randbits
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Util.number import getPrime, bytes_to_long

R, O, o, t, M, e = [getPrime(1337) for _ in "RootMe"]
gift = [
	R * O + randbits(666),
	R * o + randbits(666),
	R * t + randbits(666),
	R * M + randbits(666),
]

n = R * e
m = open("flag.txt", "rb").read()
c = bytes_to_long(PKCS1_OAEP.new(RSA.construct((n, 2 ** 16 + 1))).encrypt(m))
print(f"{n = }")
print(f"{c = }")
print(f"{gift = }")
```

My small brain that gave up on math at age 16 could guess that some strong mathematical concept was at place. My basic concepts understood that without the `randbits(666)` parts, we could compare `gifts` results to get their Greatest Common Divisor (GCD), and extract our prime number. But 666 bits of randomness is quite a lot!
### solution

Not knowing anything about the subject, I could not even know what to search, alas.
But by searching on the internet, and let's be honest, by innocently asking a cryptographer friend about the subject, he uttered one word: "lattice".

So of course, I read complex documentation on [Lattice reduction](https://en.wikipedia.org/wiki/Lattice_reduction), discovered this nice primer on [the Approximate GCD problem by Martin Ralbrecht ](https://martinralbrecht.wordpress.com/2020/03/21/the-approximate-gcd-problem/ ) , spent a week catching up on 7 years of missing mathematical background in order to code my own implementation, that I will summarize you in layman terms here...


Ahah, of course not, I'm a programmer and script kiddie, I copy paste things I do not understand from the web, and if it doesn't work I ask chatGPT 😶‍🌫️ (He suggested Lattice Reduction techniques, even if I didn't listened to him at the time)

So Now knowing I needed an Approximate GCD attack, I found a lib that had one readily available, [jvdsn/crypto-attacks](https://github.com/jvdsn/crypto-attacks/tree/master?tab=readme-ov-file#implemented-attacks ) !

It's documented, simple to use and to install (even if you have to  install the 500mb Sage math toolkit).
So I chose the first available attack, the [Multivariate polynomial attack](https://github.com/jvdsn/crypto-attacks/blob/master/attacks/acd/mp.py)

first I setup my environment for my script:

```bash
# your packaging equivalent here
sudo pacman -S sagemath 

git clone https://github.com/jvdsn/crypto-attacks.git
# python import do not like '-', let's not have any ambiguity
mv crypto-attacks crypto_attacks

# renaming so we can directly import the chall variables
mv output.txt output.py

```

and here the attack is done in one line, with the ... `attack` method. It just works!

```python
from crypto_attacks.attacks.acd.mp import attack

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Util.number import inverse, long_to_bytes

from output import n,c,gift
e = 2 ** 16 + 1

p = attack(n, gift, 666)[0]
q = n // p

assert(p * q == n)

# Step 3: Compute d (private exponent) as the modular inverse of e modulo phi(n)
phi_n = (p - 1) * (q - 1)
d = inverse(e, phi_n)

# generate private key and decode flag content
res = PKCS1_OAEP.new(RSA.construct((n, e, d, p, q))).decrypt(long_to_bytes(c))
print(res)
```

`b'RM{8553...56}'`

I win by learning almost nothing about maths, yay! 
(sorry if you wanted a serious write-up, today is not the day, go re-read my write-up of [[Day 11 - Padoru]] instead)

| Previous day | [[Day 13 - The lost gift]]         |
| ------------ | ---------------------------------- |
| Next day     | [[Day 15 - New new .. always new]] |
