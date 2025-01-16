---
title: Root-XMAS 2024 Day 03 - Santa's Magic Sack
feed: hide
permalink: /RootXMAS_2024_03
date: 03-12-2024
summary: You would never cheat a video game...
---
### summary

A video game where we have to get an high score. 
It sends it to the server and if we have the highest score we get the flag.
There is no cheat verification on the client, but the code is minified and the message sent to the server is encoded with AES.
### recon

A video game! I love video game hacking! (more on that soon :FarFaceSmile: )
It's a simple game where we have to catch gifts in our sack. It's not an easy one, because the sack moves slowly, and we only have 20 seconds... 

![[rmxmas24d03CtfRootmePic.png|Video games!]]


I managed to get a high score of 500 , but Santa got ... *133337* ??

![[rmxmas24d03Combien.png]]


Ok, first let's see what kind of request we send to the server, maybe we can catch it with Caido and resend it with our score.

```js
url: "https://day3.challenges.xmas.root-me.org/api/scores",
method: "POST",
body: {"data":"U2FsdGVkX18ax/LOHkssFEQ4ZSyTg..."}
```

Rats, the data is encrypted! We'll have to check the source code.
We have one JS file... where everything is inside, and is minified.

There are lots of libraries, as we see comments with licenses, but the last line is intriguing, let's beautify it and investigate.

```js
function Gd({
        playerName: e,
        onGameOver: t
    }) {
    ...
            try {
                const C = await Vd(e, v);
                C.isNewRecord && C.flag && y(C.flag)
            } catch (C) {
                console.error("Error submitting score:", C)
            }
    }

    async function Vd(e, t) {
        const {
            checksum: r,
            salt: n
        } = $d(e, t), l = Wd({
            playerName: e,
            score: t,
            checksum: r,
            salt: n
        });
        try {
            return await (await fetch("/api/scores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: l
                })
            })).json()
        } catch (i) {
            return console.error("Error submitting score:", i), {
                success: !1
            }
        }
    }

	...
    const gf = Rf(Md),
        Ud = "S4NT4_S3CR3T_K3Y_T0_ENCRYPT_DATA";
    
    function Wd(e) {
        const t = JSON.stringify(e);
        return gf.AES.encrypt(t, Ud).toString()
    }
```

All right! Just by searching for `flag`  or `score` we get very interesting results!
So at the end of the game , the `Vd()` method is called, with the username and the score as parameters. They are then encrypted in AES (`Wd` method) before being sent to the server.

### solution

We only need to call the  `Vd` method with our very high score.
However, when we try to access it from the console, we see it's not available as a global! 
Worse, when we try to [list available global variables](https://stackoverflow.com/a/52693392) , we see there are none!

My solution was setting a breakpoint on the `Vd()` call in my Firefox devtools. 
On break, the method became available in my console as I was in its scope. I called it and checked the result in the `Network` tab of the Firefox devtools.

```json
Vd("username", 133337+1)

	{"isNewRecord":true,
	 "flag":"RM{S4NT4_H0PE_Y0U_D1DN'T_CHEAT}"
	}
```

### issues 

At first, I tried to edit the JS file and play on my modified version, where I replaced the score parameter in the `Vd()` call with an hardcoded new highscore.

However, there is a `checksum` parameter used during the encryption. 
When sending our high score , the server sends something like "nice try", so I guess it checks the JS hasn't been tampered. 
Investigating further, like finding the exact payload sent to the AES encryption, would have led to more debugging than needed to flag, so I didn't checked this further.

I also tried dynamically modifying the score in the browser's memory with the Cheat Engine and its Linux alternative [Pince](https://github.com/korcankaraokcu/PINCE) . However, it lead to nothing, as it didn't found the score value. And it was hard to use as the game had a 20 seconds time limit! 
I suppose some browser memory management shenanigans prevented Pince from finding the value.


| Previous day | [[Day 02 - Wrapped Packet]]     |
| ------------ | ------------------------------- |
| Next day     | [[Day 04 - Build And Drustroy]] |