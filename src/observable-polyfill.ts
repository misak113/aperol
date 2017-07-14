
/// <reference types="zen-observable" />
/// <reference types="lib.es2017.observable" />

import * as Observable from 'zen-observable';

let root;

if (typeof self !== 'undefined') {
	root = self;
} else if (typeof window !== 'undefined') {
	root = window;
} else if (typeof global !== 'undefined') {
	root = global;
} else if (typeof module !== 'undefined') {
	root = module;
} else {
	root = Function('return this')();
}

if (typeof root.Observable === 'undefined') {
	root.Observable = Observable;
	(Symbol as any).observable = Observable;
}
if (typeof root.Observable.prototype.map === 'undefined') {
	root.Observable.prototype.map = Observable.prototype.map;
}
if (typeof root.Observable.prototype.filter === 'undefined') {
	root.Observable.prototype.filter = Observable.prototype.filter;
}
