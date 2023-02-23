---
layout: post
title:  "How to serve jQuery from CDN in Meteor"
categories: meteor javascript web
---

Meteor projects using Blaze have a gigantic payload of backward compatible jQuery. Every site should be serving this from a CDN, rather than embedding it.
To switch to jQuery 3.4.0, first place the CDN reference in your head tag. Most visitors should have this file in their local cache, makiing loading it instant.
<!--more-->

``` javascript
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"></script>
````

At this point you now have 2 versions of jQuery, which is even worse. You need to replace the built in jQuery payload with a stub because other packages have jQuery as a dependency and they don't acknowledge the jQuery in the head tag:

- Create a folder in your project directory called packages. If you use local packages (you should if you haven't adopted the modules system yet) then you'll already have this folder.
- Create a dir named jquery and place a file named package.js in it and paste in the following contents: 
``` javascript
Package.describe({name:'jquery', version:'1.11.10'});
```

Boom, you just removed 100 Kb off your payload.