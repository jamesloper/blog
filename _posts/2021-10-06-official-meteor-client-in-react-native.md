---
layout: "post"
title: "Official meteor client in react native"
categories: react native, javascript, meteor
---

When building a Meteor app for deployment, Meteor generates a js bundle that you can run anywhere. Using this knowledge, we can make use of the official, battle-tested client instead of the 3rd party one from npm.

<!--more-->

```javascript
import { Random } from 'meteor/random';

Meteor.call('Test', Random.id(), (err, res) => {
	console.log(err, res);
});
```

> Importing meteor within a React Native project seems like madness!

[comment]: <> (In my particular use case, I've made the decision to limit the scope of my bundler to only output official meteor code, including none of my isomorphic JS code at all. This makes it so you only have to regenerate the bundle once per meteor version.)

## Table of contents

- [Setup and build the meteor client](#setup-and-build-meteor-client)
- [Polyfills](#polyfills)
- [Get imports to work](#get-imports-to-work)
- [useTracker](#usetracker)
- [Meteor updates](#meteor-updates)

## Prior work

This blog post is based off of the work of Urigo and his [meteor-client-bundler](https://blog.meteor.com/leverage-the-power-of-meteor-with-any-client-side-framework-bfb909141008) and has been made more efficient through use of better polyfills and a smaller, simpler, more readily modified set of scripts.

## Setup and build meteor client

Here's a quick overview of the folder structure involved in the whole process:

``` directory
📂 .meteor-client
   📁 app
   📄 create-bundle.js
   📄 post-bundle.js
📂 util
   📂 meteor
      📄 polyfill.js
      📄 meteor-client.js
```

**Let's get started!** Create a folder to house the bundler and make a blank meteor app inside.

 ``` javascript
mkdir .meteor-client
cd .meteor-client
meteor create app
```

The bundler's purpose is to build the meteor client to a temporary folder and copy the client to a specific directory in your project, in this case `utils/meteor/meteor-client.js`. It also installs some boilerplate code to the top and bottom of the bundle. Contents of `create-bundle.js`:

``` javascript
 const execa = require('execa');
 const fs = require('fs');
 const path = require('path');
 
 const tempDir = '/tmp/meteor-client';
 const cwd = process.cwd();
 const destinationFile = path.resolve(cwd, 'utils/meteor/meteor-client.js');
 
 execa.sync('meteor', ['build', '--debug', '--directory', tempDir], {cwd: path.resolve(cwd, '.meteor-client/app'), stdio: 'inherit'});
 
 // Create top of file
 const runtimeConfig = '__meteor_runtime_config__ = Object.assign({meteorEnv: {}}, window.__meteor_runtime_config__);\n\n';
 fs.unlinkSync(destinationFile);
 fs.writeFileSync(destinationFile, runtimeConfig);
 
 // Copy modules to file
 const buildPath = path.resolve(tempDir, 'bundle/programs/web.browser');
 const program = require(path.resolve(buildPath, 'program.json'));
 program.manifest.filter(pack => {
     return (pack.where === 'client' &&
         pack.type === 'js' &&
         path.dirname(pack.path) === 'packages') ||
         pack.path.indexOf('global-imports') > -1;
 }).forEach(pack => {
     const packFile = path.resolve(buildPath, pack.path);
     const packContent = fs.readFileSync(packFile).toString() + '\n\n';
     fs.appendFileSync(destinationFile, packContent);
 });
 
 // Append bottom of file
 const postBundleFile = path.resolve(__dirname, 'post-bundle.js');
 const postBundleContent = fs.readFileSync(postBundleFile).toString();
 fs.appendFileSync(destinationFile, postBundleContent);
 ```

Contents of `post-bundle.js`

 ``` javascript
 // Disable hot-code-push
 if (Package.reload) {
     Package.reload.Reload._onMigrate(function () {
         return [false];
     });
 }
 ```

Install the devDependencies:

```bash
npm install --dev execa
```

In your `package.json` add a new script:

```javascript
"scripts": {
    ...
	"meteor-client-bundle": "node .meteor-client/create-bundle.js"
}
```

And run it...

```javascript
npm run meteor-client-bundle
```

In your root component, import the polyfill and the meteor client:

```javascript
import './utils/meteor/polyfills';
import './utils/meteor/meteor-client';

import React from 'react';
import { registerRootComponent } from 'expo';
import App from './containers/App';

registerRootComponent(App);
```

## Polyfills

This generated bundle is not much use yet, it was intended to be run within a browser environment. So we must polyfill all those browser apis. This polyfill depends on react-native-mmkv-storage.

```bash
npm install react-native-mmkv-storage
```

Contents of `/util/meteor/polyfill.js`:

```javascript
// Good stuff that is required to run meteor client
// https://blog.meteor.com/leverage-the-power-of-meteor-with-any-client-side-framework-bfb909141008

import { Dimensions, Linking, Vibration, Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import MMKVStorage from 'react-native-mmkv-storage';
import { baseUrl } from '../../constants/baseUrl';

export const polyfillMmkv = new MMKVStorage.Loader().withInstanceID('localStorage').initialize();

global.__meteor_runtime_config__ = {'DDP_DEFAULT_CONNECTION_URL': baseUrl};

let currentUrl = '';
let readyState = 'complete';

const netInfo = {
	changeListeners: [],
	addEventListener(eventName, callback) {
		if (eventName === 'change') this.changeListeners.push(callback);
	},
	removeEventListener(eventName, callback) {
		if (eventName === 'change') this.changeListeners.splice(this.changeListeners.indexOf(callback), 1);
	},
};

// Forward react native NetInfo events to polyfill
NetInfo.addEventListener(info => {
	// console.log('update', info);
	Object.assign(netInfo, info);
	netInfo.changeListeners.forEach(callback => callback(info));
});

// Sync currentUrl with new url
Linking.addEventListener('url', event => {
	if (event.url) currentUrl = event.url;
});

function parseUrl(url) {
	const urlArr = url.split('#');
	return {
		get href() {
			return urlArr[0];
		},
		set href(url) {
			return Linking.openURL(url);
		},
		get pathname() {
			return this.href;
		},
		get hash() {
			return urlArr[1] ? `#${urlArr[1]}` : "";
		},
		set hash(hash) {
			return Linking.openURL(this.href + '#' + hash);
		},
		replace(url) {
			return Linking.openURL(url);
		},
		toString() {
			return url;
		},
	};
}

export const localStorage = {
	setItem: (id, val) => {
		polyfillMmkv.setString(id, String(val));
	},
	getItem: id => {
		return polyfillMmkv.getString(id);
	},
	removeItem: id => {
		polyfillMmkv.removeItem(id);
	},
	clear: () => {
		polyfillMmkv.clearStore();
	},
};

Object.defineProperties(window, {
	localStorage: {
		get: () => localStorage,
	},
	sessionStorage: {
		get: () => localStorage,
	},
	document: {
		get() {
			return {
				readyState,
				addEventListener(eventName, callback) {
					if (eventName === 'deviceready' || eventName === 'DOMContentLoaded') {
						callback();
					} else if (eventName === 'visibilitychange') {
						AppState.addEventListener('change', e => {
							callback({'visibilitychange': e.match(/inactive|background/) ? 'hidden' : 'visible'});
						});
					}
				},
				getElementsByTagName() {
					return {
						item() {
							return {
								appendChild() {
								},
							};
						},
					};
				},
				createElement() {
					return {
						setAttribute() {
						},
						get pathname() {
							return '';
						},
					};
				},
				get hidden() {
					return AppState.currentState.match(/inactive|background/);
				},
				get visibilityState() {
					return this.hidden ? 'hidden' : 'visible';
				},
			};
		},
	},
	self: {
		configurable: true,
		value: global,
	},
	addEventListener: {
		configurable: true,
		value(eventName, callback) {
			switch (eventName) {
				case 'load':
					break;
				case 'online':
					netInfo.changeListeners.push(callback);
					break;
				case 'hashchange':
					let oldHash = location.hash;
					Linking.addEventListener('url', event => {
						const {hash} = parseUrl(event.url);
						if (hash !== oldHash) callback(event);
						oldHash = hash;
					});
					break;
			}
		},
	},
	attachEvent: {
		configurable: true,
		value(eventNameWithOn, callback) {
			const eventName = eventNameWithOn.replace('on', '');
			return this.addEventListener(eventName, callback);
		},
	},
	onload: {
		set(callback) {
			return this.addEventListener('load', callback);
		},
	},
	onhashchange: {
		set(callback) {
			return this.addEventListener('hashchange', callback);
		},
	},
	outerWidth: {
		configurable: true,
		get() {
			return Dimensions.get('window').width;
		},
	},
	outerHeight: {
		configurable: true,
		get() {
			return Dimensions.get('window').height;
		},
	},
	alert: {
		get() {
			return Alert.alert.bind(Alert);
		},
	},
});

const geolocation = navigator.geolocation;

Object.defineProperty(window, 'navigator', {
	get() {
		return {
			get onLine() {
				return !!netInfo.type;
			},
			get vibrate() {
				return Vibration.vibrate.bind(Vibration);
			},
			get geolocation() {
				return geolocation;
			},
			get connection() {
				return netInfo;
			},
		};
	},
});

Object.defineProperty(window, 'location', {
	configurable: true,
	get() {
		return parseUrl(currentUrl);
	},
	set(url) {
		return Linking.openURL(url);
	},
});


let newWindowMock = {closed: false};

Object.defineProperty(window, 'open', {
	configurable: true,
	value: url => {
		newWindowMock.closed = false;
		Linking.openURL(url);
		return newWindowMock;
	},
});
```

## Get imports to work

At this point you can access the meteor packages but unless you are a maniac, this is really unsatisfying.

| What works as of now... | How we would rather have it work... |
| ---- | ---- |
| `const {check} = Package['check'];` | `import { check } from 'meteor/check';` |

To be able to `import` meteor packages, you can implement an adapter in babel. Using AST explorer I developed a "[import from meteor package](https://astexplorer.net/#/gist/359ce39f3069f400426a2e1f3e0bce41/bedeac44b0f54d13945bb289e0d45126d87a3d49)" transpiler. By including the transpiler in `babel.config.js` babel (which is built in) will immediately make the new syntax work.

``` javascript
const adaptMeteor = (babel) => {
	const {types: t} = babel;
	return {
		visitor: {
			ImportDeclaration(path) {
				const modulePath = path.node.source.value;
				if (!modulePath.startsWith('meteor/')) return;
				const moduleName = modulePath.slice(7);
				const newNode = t.variableDeclaration('const', [
					t.variableDeclarator(
						t.objectPattern(path.node.specifiers.map(r => {
							return t.objectProperty(t.identifier(r.imported.name), t.identifier(r.local.name), false, true);
						})),
						t.identifier(`Package['${moduleName}']`),
					),
				]);
				path.replaceWith(newNode);
			},
		},
	};
};

module.exports = function(api) {
	api.cache(true);
	return {
		presets: ['babel-preset-expo'],
		plugins: [adaptMeteor],
	};
};
```

## useTracker

Here's a useTracker function you can drop into your project!

```javascript
import { Tracker } from 'meteor/tracker';
import { isEqual } from 'underscore';
import { useReducer, useRef, useMemo, useEffect } from 'react';

const add = (x) => x + 1;
const useForceUpdate = () => useReducer(add, 0)[1];

export const useTracker = (reactiveFn, deps = []) => {
	const forceUpdate = useForceUpdate();
	const {current: refs} = useRef({});

	refs.reactiveFn = reactiveFn; // keep reactiveFn ref fresh

	useMemo(() => {
		const handle = Tracker.autorun(() => {
			refs.data = refs.reactiveFn();
		});
		setTimeout(() => {
			handle.stop();
		}, 0);
	}, deps);

	useEffect(() => {
		const computation = Tracker.autorun(() => {
			const data = refs.reactiveFn();
			if (!isEqual(refs.data, data)) {
				refs.data = data;
				forceUpdate();
			}
		});
		return () => computation.stop();
	}, deps);

	return refs.data;
};
```

## Meteor updates

Meteor updates are a simple matter of accepting the update and re-running the bundler:

```bash
cd .meteor-client/app
meteor update
cd ../../
npm run meteor-client-bundle
```