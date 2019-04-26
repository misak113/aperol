
import { Action } from 'redux';

export const sourceActionProperty = '@@aperol/sourceAction';
export interface SourceAction<TAction extends Action = Action> {
	'@@aperol/sourceAction': TAction;
}

export const asyncIteratorProperty = '@@aperol/asyncIterator';
export interface AsyncIteratorAction {
	'@@aperol/asyncIterator': AsyncIterableIterator<Action>;
}

export const promiseProperty = '__promise';
export interface PromiseAction {
	'__promise': Promise<void>;
}
