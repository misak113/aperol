
import { Action } from 'redux';
import { generateUid } from '../Helper/hash';
import RunAsyncIteratorGeneratorContinual from './RunAsyncIteratorGeneratorContinual';

export function runItContinual(asyncIteratorGenerator: () => AsyncIterableIterator<Action>) {
	return {
		type: RunAsyncIteratorGeneratorContinual,
		uid: generateUid(),
		asyncIteratorGenerator,
	} as RunAsyncIteratorGeneratorContinual;
}
