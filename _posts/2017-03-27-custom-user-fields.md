---
layout: post
title:  "Custom User Fields in Meteor"
categories: meteor
---

It looks like the current community recommendation is to create a secondary publication, usually called 'userData', but that seems like a hack. Instead, you can edit the fields exposed by an interval variable.

``` javascript
import { AccountsServer } from 'meteor/accounts-base';

AccountsServer._autopublishFields = {
	loggedInUser: ['profile', 'username', 'emails', 'provider', 'secret', 'city', 'payout', 'isAdmin'],
	otherUsers: ['profile', 'username']
};
```
