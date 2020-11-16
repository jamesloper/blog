---
layout: post
title:  "How to install MozJPEG on macOS and Ubuntu"
categories: ubuntu
---

I recently had to make a Node script that would interface with the command line program `cjpeg`. I will show you how to install that on both your development laptop and on the Ubuntu server it will ultimately be deployed to.

<!--more-->

## Install MozJPEG on macOS with brew

``` bash
brew install mozjpeg
```
If cjpeg isn't found after installing, you can add it and djpeg with...

``` bash
ln -s /usr/local/Cellar/mozjpeg/4.0.0/bin/cjpeg /usr/local/bin/cjpeg
ln -s /usr/local/Cellar/mozjpeg/4.0.0/bin/djpeg /usr/local/bin/djpeg
```

## Install MozJPEG on Ubuntu from source
The developers did an excellent job with the makefile. Just make sure you've installed all the necessary tools and libraries.

``` bash
sudo apt-get update
sudo apt-get install cmake autoconf automake libtool nasm make pkg-config git libpng-dev
git clone https://github.com/mozilla/mozjpeg.git
```

Then do the following to compile mozjpeg:

``` bash
cd mozjpeg
mkdir build && cd build
sudo cmake -G"Unix Makefiles" ../
sudo make install
```

This will create a folder in `/opt/mozjpeg` with all the goodies for mozjpeg. If you want to use any of the binaries in the directory, you'll need to just create a symlink to it.

``` bash
cd /usr/local/bin
sudo ln -s /opt/mozjpeg/bin/cjpeg
sudo ln -s /opt/mozjpeg/bin/djpeg
```


## Raw CJPEG usage examples

``` bash
cjpeg -quality 80 test.jpg output.jpg  # convert a file
djpeg test.jpg | cjpeg -quality 80  # pipe the output to stdout
```

## How to compress and minify a buffered JPEG in NodeJS

In Node, you can spawn a process and pipe a stream to stdin. When you pipe to `cjpeg`, however, as opposed to passing a file name, `cjpeg` won't know the file extension of the piped file, therefore, the pipe *must* be in a bitmap format. So for us to be able to pipe in a jpeg to compress, the command we must execute involves `djpeg` which will decode a jpeg file for use in a stream pipeline.


``` javascript
const bufferToStream = (buffer) => {
	const stream = new Readable();
	stream.push(buffer);
	stream.push(null);
	return stream;
};

export const compressPhotoAsync = (buf) => new Promise((resolve, reject) => {
	const cjpeg = cp.exec(`djpeg | cjpeg -optimize -quality 80`, {encoding: 'buffer'});
	const parts = [];
	cjpeg.stderr.on('data', reject);
	cjpeg.stdout.on('data', part => parts.push(part));
	cjpeg.on('close', () => resolve(Buffer.concat(parts)));
	bufferToStream(buf).pipe(cjpeg.stdin);
});
```