---
layout: post
title:  "Replace Ancient jQuery"
date:   2017-01-04 12:28:18 -0500
categories: meteor
---

All projects have a quite gigantic payload of backward compatible jQuery.
To switch to jQuery 3.0 reference the CDN version in your head tag:

	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.0.0/jquery.min.js"></script>
	
At this point you now have 2 versions of jQuery, which is even worse. You need to replace the built in jQuery payload with a stub because other packages have jQuery as a dependency and they don't acknowledge the jQuery in the head tag:

- Create a folder in your project directory called packages. If you use local packages (you should if you haven't adopted the modules system yet) then you'll already have this folder.
- Create a dir named jquery and place a file named package.js in it and paste in the following contents: 

	`Package.describe({name:'jquery', version:'1.11.9'});`

Boom, you've just removed 100 Kb off your payload.