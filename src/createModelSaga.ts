import { createStore, Store, Middleware, Dispatch, Action, AnyAction } from 'redux';
import IPromiseAction from './IPromiseAction';
import ISaga from './ISaga';
import IUpdaterYield from './IUpdaterYield';
import ObservableSubscribed from './ObservableSubscribed';
import ObservableYield from './ObservableYield';
import ActionYield from './ActionYield';
import { startProfiler, IProfilerOptions, IProfiler } from './profiler';
import { ISagasMapObject } from './combineSagas';

export interface IUpdaterContext {
	currentSaga: ISaga<unknown, unknown, unknown> | null;
	combinedSagas: ISagasMapObject | null;
	profiler: IProfiler | null;
}

async function update(
	subscriptions: Subscription[],
	iterator: Iterator<IUpdaterYield, any, IUpdaterYield | undefined> | AsyncIterator<IUpdaterYield, any, IUpdaterYield | undefined>,
	dispatch: Dispatch<Action>,
	sourceAction: Action,
	updaterContext: IUpdaterContext,
) {
	let nextResult: IUpdaterYield | undefined;
	do {
		let item: IteratorResult<IUpdaterYield> = await iterator.next(nextResult);
		const lastTimeViolation = updaterContext.profiler?.popLastTimeViolation();
		if (lastTimeViolation) {
			const combinedSagaNames = Object.keys(updaterContext.combinedSagas ?? {});
			const combinedSagas = Object.values(updaterContext.combinedSagas ?? {});
			const index = updaterContext.currentSaga && combinedSagas.indexOf(updaterContext.currentSaga);
			console.warn(
				`The threshold of profiler has been reached: ${lastTimeViolation} ms`,
				index !== null ? combinedSagaNames[index] : 'unknown saga',
				sourceAction,
			);
		}
		nextResult = undefined;
		if (item.done) {
			break;
		} else
		if (isPromiseIteration(item.value)) {
			const promiseResult: IUpdaterYield = await item.value;
			if (isObservableIteration(promiseResult)) {
				await handleObservable(dispatch, promiseResult.observable, subscriptions, sourceAction, updaterContext);
			} else
			if (isActionIteration(promiseResult)) {
				await handleAction(dispatch, promiseResult.action);
			} else {
				nextResult = promiseResult;
			}
		} else
		if (isObservableIteration(item.value)) {
			await handleObservable(dispatch, item.value.observable, subscriptions, sourceAction, updaterContext);
		} else
		if (isActionIteration(item.value)) {
			await handleAction(dispatch, item.value.action);
		} else {
			nextResult = item.value;
		}
	} while (true);
}

function isPromiseIteration(value: IUpdaterYield): value is Promise<any> {
	return value instanceof Promise;
}

function isObservableIteration(value: IUpdaterYield): value is ObservableYield {
	return value instanceof ObservableYield;
}

function isActionIteration(value: IUpdaterYield): value is ActionYield {
	return value instanceof ActionYield;
}

async function handleObservable(
	dispatch: Dispatch<Action>,
	observable: Observable<Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>, Error>,
	subscriptions: Subscription[],
	sourceAction: Action,
	updaterContext: IUpdaterContext,
) {
	const subscription = observable.subscribe(function (observableIterator: Iterator<IUpdaterYield> | AsyncIterator<IUpdaterYield>) {
		update(subscriptions, observableIterator, dispatch, sourceAction, updaterContext);
	});
	subscriptions.push(subscription);
	const promiseObservableSubscribed = dispatch({
		type: ObservableSubscribed,
		observable,
		subscription,
		sourceAction,
	} as ObservableSubscribed<Action>) as Action as IPromiseAction;
	if (promiseObservableSubscribed?.__promise instanceof Promise) {
		await promiseObservableSubscribed.__promise;
	}
}

async function handleAction(dispatch: Dispatch<Action>, action: Action) {
	const promiseAction = dispatch(action) as IPromiseAction;
	if (promiseAction?.__promise instanceof Promise) {
		await promiseAction.__promise;
	}
}

export interface IOptions {
	profiler?: IProfilerOptions;
}

export default function createModelSaga<TModel>(saga: ISaga<TModel, unknown, unknown>, options: IOptions = {}) {
	let profiler: IProfiler | null = null;
	if (options.profiler) {
		profiler = startProfiler(options.profiler);
	}
	const updaterContext: IUpdaterContext = {
		currentSaga: null,
		profiler,
		combinedSagas: saga.__combinedSagas ?? null,
	};
	const sagaStore = createStore(saga.reducer);
	const subscriptions: Subscription[] = [];
	const middleware: Middleware = (store: Store<any>) => (nextDispatch: Dispatch<AnyAction>) => (action: Action) => {
		const result = nextDispatch(action);
		sagaStore.dispatch(action);
		const model = sagaStore.getState();
		const iterator = saga.updater.call(updaterContext, model, action);
		const promise = update(subscriptions, iterator, store.dispatch, action, updaterContext);
		Object.defineProperty(result, '__promise', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: promise
		});
		return result as any;
	};
	const destroy = () => {
		profiler?.stop();
		subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
	};
	return {
		middleware,
		destroy
	};
}
