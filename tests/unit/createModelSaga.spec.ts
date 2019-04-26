
import { createStore, applyMiddleware, Action } from 'redux';
import * as should from 'should';
import {
	removeInternalActions,
	assertations,
	sumSaga,
	sumReducer,
	IAdd,
	IAutoAdding,
} from './sumModelMock';
import createModelSaga from '../../src/createModelSaga';
import { PromiseAction } from '../../src/internalActions';
import AsyncIteratorStarted from '../../src/AsyncIteratorStarted';

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
		const promiseAction = store.dispatch(add113) as Action as Action & PromiseAction;
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
			{ sum: 113 },
			{ sum: 113 },
		]);
		should.deepEqual(assertations.addedAmounts, [
			113,
		]);
	});

	it('should reduce action & then apply async updater with continual side-effect', async function () {
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
		store.dispatch(autoAdding113);
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 20));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 20));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
			added,
		]);
	});

	it('should return all async iterators after destroy', async function () {
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
		store.dispatch(autoAdding113);
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
		]);
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 20));
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			autoAdding113,
			added,
		]);
		modelSaga.destroy();
		// Because of polyfilled asyncIterator must be last promise resolved to correctly close iterator
		// In native asyncIterator it is not waiting for promise & return (throw) immediatelly
		// According to https://github.com/bergus/promise-cancellation/blob/master/API.md it is maybe not possible now
		autoAdding113.__doAdd!();
		await new Promise((resolve: () => void) => setTimeout(resolve, 20));
		const autoAddingAsyncIteratorStartedAction = assertations.dispatchedActions!
			.find((action: AsyncIteratorStarted<IAutoAdding>) => action.type === AsyncIteratorStarted && action.sourceAction === autoAdding113);
		should(autoAddingAsyncIteratorStartedAction).not.empty();
		const nextValue = await (autoAddingAsyncIteratorStartedAction as AsyncIteratorStarted<IAutoAdding>).asyncIterator.next();
		should(nextValue.done).true();
	});

	it('should dispatch AsyncIteratorStarted action always when iterator started', async function () {
		const modelSaga = createModelSaga(sumSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const autoAdding113 = {
			type: 'AutoAdding',
			amount: 113,
		} as IAutoAdding;
		const promiseAction = store.dispatch(autoAdding113) as Action as Action & PromiseAction;
		const asyncIteratorStarted = assertations.reducedActions!
			.find((action: Action) => action.type === AsyncIteratorStarted) as AsyncIteratorStarted<IAutoAdding>;
		should.notStrictEqual(asyncIteratorStarted, undefined);
		should(asyncIteratorStarted.type).equal(AsyncIteratorStarted);
		should(asyncIteratorStarted.promise).equal(promiseAction.__promise);
		should(asyncIteratorStarted.sourceAction).equal(autoAdding113);
	});
});
