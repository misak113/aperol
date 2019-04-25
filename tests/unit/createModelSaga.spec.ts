
import '../../src/observable-polyfill';
import '../../src/asyncIterator-polyfill';
import 'babel-polyfill';
import { createStore, applyMiddleware, Action } from 'redux';
import * as should from 'should';
import {
	reduxInit,
	removeInternalActions,
	assertations,
	sumSaga,
	sumReducer,
	IAdd,
	IAutoAdding,
	asyncIteratorSumSaga,
} from './sumModelMock';
import createModelSaga from '../../src/createModelSaga';
import IPromiseAction from '../../src/IPromiseAction';
import ObservableSubscribed from '../../src/ObservableSubscribed';

describe('Application.craeteModelSaga', function () {

	beforeEach(() => {
		assertations.addedAmounts = [];
		assertations.updatedModels = [];
		assertations.reducedActions = [];
		assertations.updatedActions = [];
		assertations.dispatchedActions = [];
	});

	it('should reduce action & then apply async updater', function* () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const add113 = {
			type: 'Add',
			amount: 113,
		} as IAdd;
		const added = {
			type: 'Added',
			uid: 'new-uid',
		};
		const promiseAction = store.dispatch(add113) as Action as IPromiseAction;
		yield promiseAction.__promise;
		should.deepEqual(assertations.reducedActions, [
			reduxInit, // init redux in saga
			add113,
			added,
		]);
		should.deepEqual(assertations.updatedActions, [
			add113,
			added,
		]);
		should.deepEqual(assertations.dispatchedActions, [
			reduxInit, // init redux in saga
			add113,
			added,
		]);
		should.deepEqual(assertations.updatedModels, [
			{ sum: 113 },
			{ sum: 113 },
		]);
		should.deepEqual(assertations.addedAmounts, [
			113,
		]);
	});

	it('should reduce action & then apply async updater with yielded observable', function* () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const autoAdding113 = {
			type: 'AutoAdding',
			amount: 113,
		} as IAutoAdding;
		const added = {
			type: 'Added',
			uid: 'new-uid',
		};
		const promiseAction = store.dispatch(autoAdding113) as Action as IPromiseAction;
		yield promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		yield new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		autoAdding113.__doAdd!();
		yield new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
			added,
		]);
	});

	it('should unsubscribe all yielded observables after destroy', function* () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const autoAdding113 = {
			type: 'AutoAdding',
			amount: 113,
		} as IAutoAdding;
		const added = {
			type: 'Added',
			uid: 'new-uid',
		};
		const promiseAction = store.dispatch(autoAdding113) as Action as IPromiseAction;
		yield promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		yield new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		modelSaga.destroy();
		should.strictEqual(autoAdding113.__doAdd, null);
	});

	it('should dispatch ObservableSubscribed action when yielded observable', function* () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const autoAdding113 = {
			type: 'AutoAdding',
			amount: 113,
		} as IAutoAdding;
		const promiseAction = store.dispatch(autoAdding113) as Action as IPromiseAction;
		yield promiseAction.__promise;
		const observableSubscribed = assertations.reducedActions!
			.find((action: Action) => action.type === ObservableSubscribed);
		should.notStrictEqual(observableSubscribed, undefined);
	});

	it('should work even with async iterators as updater', function* () {
		const modelSaga = createModelSaga(asyncIteratorSumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const add113 = {
			type: 'Add',
			amount: 113,
		} as IAdd;
		const added = {
			type: 'Added',
			uid: 'new-uid',
		};
		const promiseAction = store.dispatch(add113) as Action as IPromiseAction;
		yield promiseAction.__promise;
		should.deepEqual(assertations.reducedActions, [
			reduxInit, // init redux in saga
			add113,
			added,
		]);
		should.deepEqual(assertations.updatedActions, [
			add113,
			added,
		]);
		should.deepEqual(assertations.dispatchedActions, [
			reduxInit, // init redux in saga
			add113,
			added,
		]);
		should.deepEqual(assertations.updatedModels, [
			{ sum: 113 },
			{ sum: 113 },
		]);
		should.deepEqual(assertations.addedAmounts, [
			113,
		]);
	});
});
