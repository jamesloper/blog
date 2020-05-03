---
layout: post
title:  "A proxy forwarding server in just a few lines of code"
categories: tech
---

Often times an application will provide the option to input a proxy url, but it won't accept anything beyond a simple HTTP proxy, making it next to useless. So I made a node script to serve up a proxy on localhost to forward the request to the real proxy. 

<!--more-->

## Using net.createServer
The application will request a connection and send down an initial request. This will look something like this:

```yaml
CONNECT example.com:80 HTTP/1.1 
Host: example.com:80
```

Once we have the request info, we can manipulate it and then turn around and forward it to the target proxy server. Then we can take the two connections and bind them together. We can use the pipeline function to handle this for us. 

```javascript
const {URL} = require('url');
const stream = require('stream');
const net = require('net');
const tls = require('tls');

const proxy = new URL('https://user:pass@https-us-east.privateinternetaccess.com');
const auth = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64');

net.createServer(async client => {
    const {clientData, targetHost} = await waitForHeaderData(client);

    const proxy = tls.connect({'host': proxy.host, 'port': 443}, () => {
        proxy.write(clientData); // Tell proxy to connect to target server
        stream.pipeline(client, proxy, (err) => {
            if (err) console.warn('clientToProxyError:', 'targetHost=', targetHost, 'error=', err.toString());
        });
        stream.pipeline(proxy, client, (err) => {
            if (err) console.warn('proxyToClientError:', 'targetHost=', targetHost, 'error=', err.toString());
        });
    });
    proxy.on('error', err => {
        console.warn('General Error:', 'targetHost=', targetHost, 'error=', err.toString());
    });
}).listen(port, () => {
    console.log(`Proxy listening on port ${port}`);
});

const extractHeader = (lines, header) => { // param must be already lowercase
	const line = lines.find(str => str.toLowerCase().startsWith(header));
	if (line) return line.split(': ').pop();
};

const headerFilterFn = (line) => {
	const str = line.toLowerCase();
	if (str.startsWith('x-')) return false;
	if (str.startsWith('proxy-authorization')) return false;
	return true;
};

const createClientData = (lines) => [
	...lines.filter(headerFilterFn),
	`Proxy-Authorization: Basic ${auth}`,
].join('\r\n') + '\r\n\r\n';

const getTargetHost = (lines) => {
	const isTls = lines[0].includes('CONNECT');
	if (isTls) return lines[0].split('CONNECT ')[1].split(' ')[0].split(':')[0];
	return extractHeader(lines, 'host');
};

const waitForHeaderData = (client) => new Promise(success => {
	client.once('data', data => {
		const lines = data.toString().trim().split('\r\n');
		success({clientData: createClientData(lines), targetHost: getTargetHost(lines)})
	});
});
```