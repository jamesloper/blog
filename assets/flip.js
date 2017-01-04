function num(evt) {
	var code = (evt.which) ? evt.which : event.keyCode
	if (code > 31 && (code < 48 || code > 57)) return false;
	return true;
}

function currencySymbol(fld) {
	var val = fld.value.replace(/\D+/g,'');
	if (val.charAt(0) !== "$" || val.length == 0) {$fld.val("$"+val);}
	return;
}

function clearDefault(fld) {if ($fld.value == "$") fld.value=""}

(function() {
	var baseName, className, css, cssClass, defaults, faceNames, faceSequence, prefixList, prefixProp, prop, _len, _ref, _ref1, _this = this;

	baseName = 'flip';

	className = baseName[0].toUpperCase() + baseName.slice(1);

	prefixList = ['webkit', 'Moz', 'O', 'ms'];

	prefixProp = function(prop) {
		var prefix, prefixed, i, _len;
		if (document.body.style[prop.toLowerCase()] != null) return prop.toLowerCase();
		for (var i = 0; i < prefixList.length; i++) {
			prefixed = prefixList[i] + prop;
			if (document.body.style[prefixed] != null) return prefixed;
		}
		return false;
	};

	css = {};

	_ref = ['Transform', 'Perspective'];
	for (var i = 0; i < _ref.length; i++) {
		css[_ref[i].toLowerCase()] = prefixProp(_ref[i]);
	}
	
	defaults = {size:30, margin:2, fontSize:20, perspective:100};

	cssClass = baseName.toLowerCase();

	faceNames = ['front', 'bottom', 'back', 'top', 'left', 'right'];

	faceSequence = faceNames.slice(0, 4);

	window.HexaFlip = (function() {
		function HexaFlip(el, sets, options) {
			var cube, cubeFragment, i, image, key, midPoint, option, set, setsKeys, setsLength, val, value, z, _j, _len1, _ref1, _ref2, _this = this;
			this.el = el;
			this.sets = sets;
			this._onMouseOut = function(e, cube) {
				return HexaFlip.prototype._onMouseOut.apply(_this, arguments);
			};
			if (!(css.transform && this.el)) return;
			for (option in defaults) {
				this[option] = defaults[option];
			}
			if (typeof this.fontSize === 'number') this.fontSize += 'px';
			setsKeys = Object.keys(this.sets);
			setsLength = setsKeys.length;
			cubeFragment = document.createDocumentFragment();
			i = z = 0;
			midPoint = setsLength / 2 + 1;
			this.cubes = {};
			_ref2 = this.sets;
			for (key in _ref2) {
				set = _ref2[key];
				cube = this.cubes[key] = this._createCube(key);
				if (++i < midPoint) {
					z++;
				} else {
					z--;
				}
				cube.el.style.zIndex = z;
				this._setContent(cube.front, set[0]);
				cubeFragment.appendChild(cube.el);
				for (_j = 0, _len1 = set.length; _j < _len1; _j++) {
					val = set[_j];
				}
			}
			this.cubes[setsKeys[0]].el.style.marginLeft = '0';
			this.cubes[setsKeys[setsKeys.length - 1]].el.style.marginRight = '0';
			this.el.classList.add(cssClass);
			this.el.style.height = this.size + 'px';
			this.el.style.width = ((this.size + this.margin * 2) * setsLength) - this.margin * 2 + 'px';
			this.el.style[css.perspective] = this.perspective + 'px';
			this.el.appendChild(cubeFragment);
		}

		HexaFlip.prototype._createCube = function(set) {
			var cube, eString, eventPair, eventPairs, mouseLeaveSupport, rotate3d, side, _fn, _j, _k, _l, _len1, _len2, _len3,
				_this = this;
			cube = {
				set: set,
				offset: 0,
				y1: 0,
				yDelta: 0,
				yLast: 0,
				el: document.createElement('div')
			};
			cube.el.className = "" + cssClass + "-cube " + cssClass + "-cube-" + set;
			cube.el.style.margin = "0 " + this.margin + "px";
			cube.el.style.width = cube.el.style.height = this.size + 'px';
			cube.el.style[css.transform] = this._getTransform(0);
			for (_j = 0, _len1 = faceNames.length; _j < _len1; _j++) {
				side = faceNames[_j];
				cube[side] = document.createElement('div');
				cube[side].className = cssClass + '-' + side;
				rotate3d = (function() {
					switch (side) {
						case 'front':
							return '0, 0, 0, 0deg';
						case 'back':
							return '1, 0, 0, 180deg';
						case 'top':
							return '1, 0, 0, 90deg';
						case 'bottom':
							return '1, 0, 0, -90deg';
						case 'left':
							return '0, 1, 0, -90deg';
						case 'right':
							return '0, 1, 0, 90deg';
					}
				})();
				cube[side].style[css.transform] = "rotate3d(" + rotate3d + ") translate3d(0, 0, " + (this.size / 2) + "px)";
				cube[side].style.fontSize = this.fontSize;
				cube.el.appendChild(cube[side]);
			}
			eventPairs = [['TouchStart', 'MouseDown'], ['TouchMove', 'MouseMove'], ['TouchEnd', 'MouseUp'], ['TouchLeave', 'MouseLeave']];
			mouseLeaveSupport = 'onmouseleave' in window;
			for (_k = 0, _len2 = eventPairs.length; _k < _len2; _k++) {
				eventPair = eventPairs[_k];
				_fn = function(fn, cube) {
					if (!((eString === 'TouchLeave' || eString === 'MouseLeave') && !mouseLeaveSupport)) {
						return cube.el.addEventListener(eString.toLowerCase(), (function(e) {
							return _this[fn](e, cube);
						}), true);
					} else {
						return cube.el.addEventListener('mouseout', (function(e) {
							return _this._onMouseOut(e, cube);
						}), true);
					}
				};
				for (_l = 0, _len3 = eventPair.length; _l < _len3; _l++) {
					eString = eventPair[_l];
					_fn('_on' + eventPair[0], cube);
				}
			}
			this._setSides(cube);
			return cube;
		};

		HexaFlip.prototype._getTransform = function(deg) {
			return "translateZ(-" + (this.size / 2) + "px) rotateX(" + deg + "deg)";
		};

		HexaFlip.prototype._setContent = function(el, content) {
			return el.innerHTML = content;
		};

		HexaFlip.prototype._setSides = function(cube) {
			var bottomAdj, faceOffset, offset, set, setLength, setOffset, topAdj;
			cube.el.style[css.transform] = this._getTransform(cube.yDelta);
			cube.offset = offset = Math.floor(cube.yDelta / 90);
			if (offset === cube.lastOffset) return;
			cube.lastOffset = faceOffset = setOffset = offset;
			set = this.sets[cube.set];
			setLength = set.length;
			if (offset < 0) {
				faceOffset = setOffset = ++offset;
				if (offset < 0) {
					if (-offset > setLength) {
						setOffset = setLength - -offset % setLength;
						if (setOffset === setLength) {
							setOffset = 0;
						}
					} else {
						setOffset = setLength + offset;
					}
					if (-offset > 4) {
						faceOffset = 4 - -offset % 4;
						if (faceOffset === 4) faceOffset = 0;
					} else {
						faceOffset = 4 + offset;
					}
				}
			}
			if (setOffset >= setLength) setOffset %= setLength;
			if (faceOffset >= 4) faceOffset %= 4;
			topAdj = faceOffset - 1;
			bottomAdj = faceOffset + 1;
			if (topAdj === -1) topAdj = 3;
			if (bottomAdj === 4) bottomAdj = 0;
			this._setContent(cube[faceSequence[topAdj]], set[setOffset - 1] || set[setLength - 1]);
			return this._setContent(cube[faceSequence[bottomAdj]], set[setOffset + 1] || set[0]);
		};

		HexaFlip.prototype._onTouchStart = function(e, cube) {
			e.preventDefault();
			cube.touchStarted = true;
			e.currentTarget.classList.add('no-tween');
			if (e.type === 'mousedown') {
				return cube.y1 = e.pageY;
			} else {
				return cube.y1 = e.touches[0].pageY;
			}
		};

		HexaFlip.prototype._onTouchMove = function(e, cube) {
			if (!cube.touchStarted) return;
			e.preventDefault();
			cube.diff = (e.pageY - cube.y1);
			cube.yDelta = cube.yLast - cube.diff;
			return this._setSides(cube);
		};

		HexaFlip.prototype._onTouchEnd = function(e, cube) {
			var mod;
			cube.touchStarted = false;
			mod = cube.yDelta % 90;
			if (mod < 45) {
				cube.yLast = cube.yDelta + mod;
			} else {
				if (cube.yDelta > 0) {
					cube.yLast = cube.yDelta + mod;
				} else {
					cube.yLast = cube.yDelta - (90 - mod);
				}
			}
			if (cube.yLast % 90 !== 0) cube.yLast -= cube.yLast % 90;
			cube.el.classList.remove('no-tween');
			return cube.el.style[css.transform] = this._getTransform(cube.yLast);
		};

		HexaFlip.prototype._onTouchLeave = function(e, cube) {
			if (!cube.touchStarted) return;
			return this._onTouchEnd(e, cube);
		};

		HexaFlip.prototype._onMouseOut = function(e, cube) {
			if (!cube.touchStarted) return;
			if (e.toElement && !cube.el.contains(e.toElement)) return this._onTouchEnd(e, cube);
		};

		HexaFlip.prototype.setValue = function(settings) {
			var cube, index, key, value, _results;
			_results = [];
			for (key in settings) {
				value = settings[key];
				if (!(this.sets[key] && !this.cubes[key].touchStarted)) continue;
				cube = this.cubes[key];
				index = this.sets[key].indexOf(value);
				cube.yDelta = cube.yLast = 90 * index;
				this._setSides(cube);
				_results.push(this._setContent(cube[faceSequence[index % 4]], value));
			}
			return _results;
		};

		HexaFlip.prototype.getValue = function() {
			var cube, offset, set, setLength, _ref1, _results;
			_ref1 = this.cubes;
			_results = [];
			for (set in _ref1) {
				cube = _ref1[set];
				set = this.sets[set];
				setLength = set.length;
				offset = cube.yLast / 90;
				if (offset < 0) {
					if (-offset > setLength) {
						offset = setLength - -offset % setLength;
						if (offset === setLength) offset = 0;
					} else {
						offset = setLength + offset;
					}
				}
				if (offset >= setLength) offset %= setLength;
				if (typeof set[offset] === 'object') {
					_results.push(set[offset].value);
				} else {
					_results.push(set[offset]);
				}
			}
			return _results;
		};

		HexaFlip.prototype.flip = function(back) {
			var cube, delta, set, _ref1, _results;
			delta = back ? -90 : 90;
			_ref1 = this.cubes;
			_results = [];
			for (set in _ref1) {
				cube = _ref1[set];
				if (cube.touchStarted) {
					continue;
				}
				cube.yDelta = cube.yLast += delta;
				_results.push(this._setSides(cube));
			}
			return _results;
		};

		HexaFlip.prototype.flipBack = function() {
			return this.flip(true);
		};

		return HexaFlip;
	})();

}).call(this);


var text1 = 'JAMES'.split(''), text2 = 'LOPER'.split(''),
	makeObject = function(a){
		var o = {};
		for(var i = 0, l = a.length; i < l; i++){
			o['letter' + i] = a;
		}
		return o;
	},
	getSequence = function(a, reverse, random){
		var o = {}, p;
		for (var i = 0, l = a.length; i < l; i++){
			if (reverse){
				p = l - i - 1;
			} else if(random){
				p = Math.floor(Math.random() * l);
			} else {
				p = i;
			}
		o['letter' + i] = a[p];
	}
	return o;
};

document.addEventListener('DOMContentLoaded', function(){
	f1 = new HexaFlip(document.getElementById('flip1'), makeObject(text1));
	f2 = new HexaFlip(document.getElementById('flip2'), makeObject(text2));

	setTimeout(function(){
		f1.setValue(getSequence(text1, true));
		f2.setValue(getSequence(text2, true));
	}, 0);

	setTimeout(function(){
		f1.setValue(getSequence(text1));
		f2.setValue(getSequence(text2));
	}, 1000);

	setTimeout(function(){
		setInterval(function(){
			f1.setValue(getSequence(text1, false, true));
			f2.setValue(getSequence(text2, false, true));
		}, 3000);
	}, 5000);
});
