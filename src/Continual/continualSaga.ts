
import { Action } from 'redux';
import {
	PromiseAction,
	sourceActionProperty,
} from '../internalActions';
import ContinualAsyncIteratorStarted from './ContinualAsyncIteratorStarted';
import RunAsyncIteratorGeneratorContinual from './RunAsyncIteratorGeneratorContinual';

export interface Model {}

const initialModel = {};

export function reducer(model: Model = initialModel, _action: Action) {
	return model;
}

export async function *updater(
	_model: Model,
	action: RunAsyncIteratorGeneratorContinual & PromiseAction
) {
	switch (action.type) {
		case RunAsyncIteratorGeneratorContinual:
			const sourceAction = action[sourceActionProperty];
			const asyncIterator = action.asyncIteratorGenerator();
			yield {
				type: ContinualAsyncIteratorStarted,
				asyncIterator,
				sourceAction,
				promise: action.__promise,
			} as ContinualAsyncIteratorStarted<Action>;
			yield* asyncIterator;
			break;
		default:
	}
}
