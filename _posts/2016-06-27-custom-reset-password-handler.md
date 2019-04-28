---
layout: post
title:  "How to set a custom reset password handler in Meteor"
categories: meteor
---

I figured out how to override the default reset password handler and send the password reset email via CustomerIO.
<!--more-->

``` javascript
Accounts.sendResetPasswordEmail = function(userId) {
	var token = Random.secret();
	Meteor.users.update(userId, {$set: {
		'services.password.reset': {
			'token': token,
			'email': email,
			'when': new Date()
		}
	}});
	
	CustomerIO.event(userId, {
		'name': 'reset_password',
		'data': {'reset_link': Accounts.urls.resetPassword(token)},
	});
};
```