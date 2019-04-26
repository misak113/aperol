
import '../../src/polyfill/observable';
import '../../src/polyfill/asyncIterator';
import { createStore, applyMiddleware, Action } from 'redux';
import * as should from 'should';
import {
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

	it('should reduce action & then apply async updater', async function () {
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
		await promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			add113,
			added,
		]);
		should.deepEqual(removeInternalActions(assertations.updatedActions), [
			add113,
			added,
		]);
		should.deepEqual(removeInternalActions(assertations.dispatchedActions), [
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

	it('should reduce action & then apply async updater with yielded observable', async function () {
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
		await promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
			added,
		]);
	});

	it('should unsubscribe all yielded observables after destroy', async function () {
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
		await promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 2));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		modelSaga.destroy();
		should.strictEqual(autoAdding113.__doAdd, null);
	});

	it('should dispatch ObservableSubscribed action when yielded observable', async function () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const autoAdding113 = {
			type: 'AutoAdding',
			amount: 113,
		} as IAutoAdding;
		const promiseAction = store.dispatch(autoAdding113) as Action as IPromiseAction;
		await promiseAction.__promise;
		const observableSubscribed = assertations.reducedActions!
			.find((action: Action) => action.type === ObservableSubscribed);
		should.notStrictEqual(observableSubscribed, undefined);
	});

	it('should work even with async iterators as updater', async function () {
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
		await promiseAction.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			add113,
			added,
		]);
		should.deepEqual(removeInternalActions(assertations.updatedActions), [
			add113,
			added,
		]);
		should.deepEqual(removeInternalActions(assertations.dispatchedActions), [
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
