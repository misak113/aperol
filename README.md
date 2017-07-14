# Aperol

JS library for asynchronous processing of side effects in action based application.

## Install
```sh
npm install aperol --save
```

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
	*updater(model, action) {
		switch (action.type) {
			case 'GREET_WITH_DELAY':
				yield wait(1e3); // wait 1 second
				// dispatch GREET action to store after delay
				yield { type: 'GREET', model.message };
				break;
		}
	},
};
const modelSaga = createModelSaga(appSaga);
const store = createStore(appReducer, applyMiddleware(modelSaga.middleware));
```


### Observing continual side-effects

```js
const { ObservableSubscribed } = require('aperol');
function repeat(interval) {
	return new Observable((observer) => {
		const handler = setInterval(() => observer.next());
		return () => clearInterval(handler);
	});
}
const appSaga = {
	reducer(model, action) {
		switch (action.type) {
			case 'GREET':
				return { ...model, count: model.count + 1 };
			case ObservableSubscribed:
				if (action.sourceAction.type === 'GREET_REPEATABLE') {
					return { ...model, greetingSubscription: action.subscription };
				}
			default:
				return model;
		}
	},
	*updater(model, action) {
		switch (action.type) {
			case 'GREET_REPEATABLE':
				yield repeat(1e3) // repeat every 1 second
				.map(function () {
					// dispatch GREET action to store repeatable
					yield { type: 'GREET' };
				});
				break;
			case 'GREET':
				if (model.count > 10) {
					// dispatch GREETED_10_TIMES action to store after every 10th greeting
					yield { type: 'GREETED_10_TIMES' };
				}
				break;
			case 'STOP_GREETING':
				// When no more needed subscribing side-effect greeting
				model.greetingSubscription.unsubscribe();
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
// It will unsubscribe all Observable subscriptions
modelSaga.destroy();
```

## Notes
*library automatically polyfill Observable if not available in global Symbol context with `zen-observable`*

## Conclusion
This library was involved because there was no standardized pure-functional way how handle asynchronous side effects in redux based application.
Also missing standard way how to handle continual side-effects.
Aperol was inspired in some existing libraries like a [prism](https://github.com/salsita/prism) or [redux-saga](https://github.com/redux-saga/redux-saga).
Aperol uses the last syntactic sugar from ES2016/TypeScript like a `async/await`, `iterator`, `asyncIterator` etc. For using is strictly recommended using transpilers like a TypeScript or Babel.
