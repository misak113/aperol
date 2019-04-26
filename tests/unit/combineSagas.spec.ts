
import '../../src/polyfill/observable';
import { put } from '../../src/index';
import { createStore, applyMiddleware, Action } from 'redux';
import * as should from 'should';
import {
	removeInternalActions,
	assertations,
	sumSaga,
	sumReducer,
	IAdd,
	IAdded,
	ISubtract,
} from './sumModelMock';
import createModelSaga from '../../src/createModelSaga';
import combineSagas from '../../src/combineSagas';
import IPromiseAction from '../../src/IPromiseAction';

describe('Application.combineSaga', function () {

	let shownWarningsCount: number;

	interface IWarningShown extends Action {
		type: 'WarningShown';
	}

	type IWarningModel = string[];

	function alertAllWarnings() {
		shownWarningsCount++;
		return new Promise<string>((resolve: (uid: string) => void) => {
			setTimeout(() => resolve('new-uid'), 1);
		});
	}

	const warningSaga = {
		reducer(model: IWarningModel = [], action: ISubtract) {
			switch (action.type) {
				case 'Subtract':
					return [
						...model,
						'Subtract ' + action.amount
					];
				default:
					return model;
			}
		},
		*updater(model: IWarningModel, action: ISubtract) {
			switch (action.type) {
				case 'Subtract':
					if (model.length % 2 === 0) {
						yield alertAllWarnings();
						yield put<IWarningShown>({
							type: 'WarningShown',
						});
					}
					break;
				default:
			}
		},
	};

	beforeEach(() => {
		assertations.addedAmounts = [];
		assertations.updatedModels = [];
		assertations.reducedActions = [];
		assertations.updatedActions = [];
		assertations.dispatchedActions = [];
		shownWarningsCount = 0;
	});

	it('should combine sagas deep structure', async function () {
		const appSaga = combineSagas({
			math: combineSagas({
				sum: sumSaga,
			}),
			warning: warningSaga,
		});
		const modelSaga = createModelSaga(appSaga);
		const store = createStore(sumReducer, applyMiddleware(modelSaga.middleware));
		const add113 = {
			type: 'Add',
			amount: 113,
		} as IAdd;
		const subtract112 = {
			type: 'Subtract',
			amount: 112,
		} as ISubtract;
		const added = {
			type: 'Added',
			uid: 'new-uid',
		} as IAdded;
		const warningShown = {
			type: 'WarningShown',
		} as IWarningShown;
		const promiseAdd113 = store.dispatch(add113) as Action as IPromiseAction;
		await promiseAdd113.__promise;
		const promiseSubtract112 = store.dispatch(subtract112) as Action as IPromiseAction;
		await promiseSubtract112.__promise;
		const secondSubtract112 = { ...subtract112 } as Action;
		const promiseSubtract112Again = store.dispatch(secondSubtract112) as Action as IPromiseAction;
		await promiseSubtract112Again.__promise;
		should.deepEqual(removeInternalActions(assertations.reducedActions), [
			add113,
			added,
			subtract112,
			secondSubtract112,
			warningShown,
		]);
		should.deepEqual(removeInternalActions(assertations.updatedActions), [
			add113,
			added,
			subtract112,
			secondSubtract112,
			warningShown,
		]);
		should.deepEqual(removeInternalActions(assertations.dispatchedActions), [
			add113,
			added,
			subtract112,
			secondSubtract112,
			warningShown,
		]);
		should.deepEqual(assertations.updatedModels, [
			{ sum: 113 },
			{ sum: 113 },
			{ sum: 1 },
			{ sum: -111 },
			{ sum: -111 },
		]);
		should.deepEqual(assertations.addedAmounts, [
			113,
		]);
		should.strictEqual(shownWarningsCount, 1);
	});
});
