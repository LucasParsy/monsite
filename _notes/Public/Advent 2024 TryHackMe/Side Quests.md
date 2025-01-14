
## T1

On the Github repositories: 
on the repository of MM-[WarevilleTHM](https://github.com/MM-WarevilleTHM?tab=overview&from=2024-10-01&to=2024-10-31) , by searching the history of the user, we see he created an [issue](https://github.com/Bloatware-WarevilleTHM/CryptoWallet-Search/issues/1) for a C2 server created by "Bloatware-WarevilleTHM".
Let's check this [C2 server code](https://github.com/Bloatware-WarevilleTHM/C2-Server/blob/main/app.py): 

```python
from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)

app.secret_key = "@09JKD0934jd712?djD"

ADMIN_USERNAME = "admin"           
ADMIN_PASSWORD = "securepassword" #CHANGE ME!!!
...

@app.route("/login", methods=["GET", "POST"])
def login():
...
if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["logged_in"] = True
            session["username"] = username
            return redirect(url_for("dashboard"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
```

Lots of information! we know we have a C2, running on the port 8000, and we have the app secret key, and potentially default password!

Let's check on the instance of the day if there's something on port 8000...
http://INSTANCE_IP:8000/


![[c2_tryhackme.png]]

We have a C2! But the default password doesn't work...
Still we have the app key, let's check what hacktricks says about [Flask app keys](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/flask).

We can generate our own `session` cookie with this secret thanks to `flask-unsign` !

```bash
flask-unsign --sign --cookie "{'logged_in': True, 'username': 'tuxlu'}" --secret '@09JKD0934jd712?djD'
	eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoidHV...
```

We then get access to the C2, and by navigating on the `/data` tab we get our keycard!

We can the open our archive with a pcap inside.

Let's start by filtering clear text HTTP post requests

We get one POST `/register.php` with frostyfox's password!

```html
username=frostyfox&password=QU9DMjAyNHtUaW55X1R&confirm_password=QU9DMjAyNHtUaW55X1R
```

Let's switch to the [NetworkMiner](https://www.netresec.com/?page=NetworkMiner) tool.

There, in the Credential tab, we find a password for McSkidy, `pbnlfVGlueV9TaDNsbF` !

to search for the Zip file, we search for it's magic bytes `50 4B 03 04` , and we get an unmarked TCP stream. Didn't I know there was a Zip to find, I would have missed it!


QU9DMjAyNHtUaW55X1R
pbnlfVGlueV9TaDNsbF
mcskidy
