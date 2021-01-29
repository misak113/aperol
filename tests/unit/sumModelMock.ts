
import * as should from 'should';
import { Action } from 'redux';
import ObservableSubscribed from '../../src/ObservableSubscribed';
import { put, observe } from '../../src/index';

export interface ISumModel {
	sum: number;
}

export interface IAdd extends Action {
	type: 'Add';
	amount: number;
}

export interface IAdded extends Action {
	type: 'Added';
	uid: string;
}

export interface ISubtract extends Action {
	type: 'Subtract';
	amount: number;
}

export interface ISubtracted extends Action {
	type: 'Subtracted';
	uid: string;
}

export interface IAutoAdding extends Action {
	type: 'AutoAdding';
	amount: number;
	__doAdd: (() => void) | null; // only for test
}

export const initialSumModel = {
	sum: 0,
};

export function removeInternalActions(actions?: Action[]) {
	return actions!
		.filter((action: Action) => action.type.indexOf('@@redux/') !== 0)
		.filter((action: Action) => action.type !== ObservableSubscribed);
}

export const assertations: {
	addedAmounts?: number[];
	updatedModels?: ISumModel[];
	reducedActions?: Action[];
	updatedActions?: Action[];
	dispatchedActions?: Action[];
} = {};

export function sumReducer(state: null = null, action: Action) {
	should.strictEqual(state, null);
	assertations.dispatchedActions!.push(action);
	return state;
}

export function addAmount(amount: number) {
	assertations.addedAmounts!.push(amount);
	return new Promise<string>((resolve: (uid: string) => void) => {
		setTimeout(() => resolve('new-uid'), 1);
	});
}

export const sumSaga = {
	reducer(model: ISumModel = initialSumModel, action: IAdd | ISubtract) {
		assertations.reducedActions!.push(action);
		switch (action.type) {
			case 'Add':
				return {
					...model,
					sum: model.sum + action.amount,
				};
			case 'Subtract':
				return {
					...model,
					sum: model.sum - action.amount,
				};
			default:
				return model;
		}
	},
	*updater(model: ISumModel, action: IAdd | IAutoAdding) {
		assertations.updatedActions!.push(action);
		assertations.updatedModels!.push(model);
		switch (action.type) {
			case 'Add':
				const uid = yield addAmount(action.amount);
				yield put<IAdded>({
					type: 'Added',
					uid,
				});
				break;
			case 'AutoAdding':
				const observable = new Observable((observer: SubscriptionObserver<number, Error>) => {
					action.__doAdd = () => observer.next(action.amount);
					return () => {
						action.__doAdd = null;
					};
				});
				yield observe(observable.map(function* (amount: number) {
					const autoUid = yield addAmount(amount);
					yield put<IAdded>({
						type: 'Added',
						uid: autoUid,
					});
				}));
				break;
			default:
		}
	},
};

export const asyncIteratorSumSaga = {
	reducer(model: ISumModel = initialSumModel, action: IAdd | ISubtract) {
		assertations.reducedActions!.push(action);
		switch (action.type) {
			case 'Add':
				return {
					...model,
					sum: model.sum + action.amount,
				};
			case 'Subtract':
				return {
					...model,
					sum: model.sum - action.amount,
				};
			default:
				return model;
		}
	},
	async *updater(model: ISumModel, action: IAdd | IAutoAdding) {
		assertations.updatedActions!.push(action);
		assertations.updatedModels!.push(model);
		switch (action.type) {
			case 'Add':
				const uid = await addAmount(action.amount);
				yield put<IAdded>({
					type: 'Added',
					uid,
				});
				break;
			case 'AutoAdding':
				const observable = new Observable((observer: SubscriptionObserver<number, Error>) => {
					action.__doAdd = () => observer.next(action.amount);
					return () => {
						action.__doAdd = null;
					};
				});
				yield observe(observable.map(async function* (amount: number) {
					const autoUid = await addAmount(amount);
					yield put<IAdded>({
						type: 'Added',
						uid: autoUid,
					});
				}));
				break;
			default:
		}
	},
};
