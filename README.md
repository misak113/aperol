# Aperol

[![Build Status](https://travis-ci.org/misak113/aperol.svg?branch=master)](https://travis-ci.org/misak113/aperol)

JS library for asynchronous processing of side effects in action based application.

## Install
<big><pre>
npm install [aperol](https://www.npmjs.com/package/aperol) --save
</pre></big>


## Usage
### Basic with redux

```js
const wait = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));
const { createModelSaga } = require('aperol');
const appReducer = require('./appReducer');
const appSaga = {
	reducer(model, action) {
		switch (action.type) {
			case 'SET_GREETING':
				return { ...model, message: 'hello world' };
			default:
				return model;
		}
	},
	async *updater(model, action) {
		switch (action.type) {
			case 'GREET_WITH_DELAY':
				await wait(1e3); // wait 1 second
				// dispatch GREET action to store after delay
				yield { type: 'GREET', message: model.message };
				break;
		}
	},
};
const modelSaga = createModelSaga(appSaga);
const store = createStore(appReducer, applyMiddleware(modelSaga.middleware));
```


### Processing continual side-effects

```js
const { AsyncIteratorStarted } = require('aperol');
async function* repeat(interval) {
	while (true) {
		await wait(interval);
		yield;
	}
}
const appSaga = {
	reducer(model, action) {
		switch (action.type) {
			case 'GREET':
				return { ...model, count: model.count + 1 };
			case AsyncIteratorStarted:
				if (action.sourceAction.type === 'GREET_REPEATABLE') {
					return { ...model, greetingAsyncIterator: action.asyncIterator };
				}
			default:
				return model;
		}
	},
	async *updater(model, action) {
		switch (action.type) {
			case 'GREET_REPEATABLE':
				for await (let _ of repeat(1e3)) { // repeat every 1 second
					// dispatch GREET action to store repeatable
					yield { type: 'GREET' };
				}
				break;
			case 'GREET':
				if (model.count > 10) {
					// dispatch GREETED_10_TIMES action to store after every 10th greeting
					yield { type: 'GREETED_10_TIMES' };
				}
				break;
			case 'STOP_GREETING':
				// When no more needed processing side-effect greeting
				model.greetingAsyncIterator.return();
				break;
		}
	},
};
// ... app code
```


### Combining more sagas

```js
const { combineSagas } = require('aperol');
const appSaga = combineSagas({
	greetSaga,
	otherCoolSaga,
});
const modelSaga = createModelSaga(appSaga);
// ... app code
```


### Destroy for backend
When you plan to use aperol in node.js on backend it should be destroyed model saga when you no more needs it for user.

```js
// It will return to all async iterators
modelSaga.destroy();
```


### Model-less saga
*Analogy to stateless components in React*
```js
async function* appSaga(action) {
	switch (action.type) {
		case 'GREET_WITH_DELAY':
			await wait(1e3);
			yield { type: 'GREET' };
			break;
	}
}
```


### Polyfill
For running library in old browsers & non harmony flagged Node.js is necessary to polyfill `Symbol.asyncIterator`. You can achieve it by simple implementation included in library.
```js
require('aperol').polyfillAsyncIterator();
```


## Motivation
Many other projects like `redux-saga` & simple libraries like `prism` already supports side-effects, continual processing etc.
However there are some deal breakers which motivates me to write self library. Here are the main points:
- using asyncIterators with support for async/await instead of `yield`ing promises (like in redux-saga),
- model should be functional mainteined (like a redux state)
- functional model allows you to use already existing dev tools for redux
- Be less robust (then redux-saga)
- Better static typing (with TypeScript)
- Allow use same library for server-side rendering


## TypeScript support
Library is written in TypeScript & we are supporting it for you. It can be found all compiled `*.d.ts` files in `aperol/dist/` folder. By importing module with [`node` module resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html#node) configuration the library is typed automatically.
```ts
import { ISaga } from 'aperol';
const mySaga: ISaga = ...my typed saga :)
```

## Nightly builds
New ideas, unconfirmed issueses & pull requests are always available in nightly build branch [`next`](https://github.com/misak113/aperol/tree/next). The corresponding built of npm package is also available under npm tag `next` in npm registry.
```sh
npm install aperol@next --save
```

## Conclusion
This library was involved because there was no standardized pure-functional way how process asynchronous side effects in redux based application.
Also missing standard way how to handle continual side-effects.
Aperol was inspired in some existing libraries like a [prism](https://github.com/salsita/prism), [redux-saga](https://github.com/redux-saga/redux-saga) or [RxJS](https://github.com/Reactive-Extensions/RxJS).
Aperol uses the last syntactic sugar from ES2016/TypeScript like a `async/await`, `iterator`, `asyncIterator` etc. For using is strictly recommended using transpilers like a TypeScript or Babel.
