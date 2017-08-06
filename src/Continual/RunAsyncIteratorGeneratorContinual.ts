
import { Action } from 'redux';
import { SourceAction } from '../internalActions';

export const RunAsyncIteratorGeneratorContinual = '@@aperol/Continual/RunAsyncIteratorGeneratorContinual';
export interface RunAsyncIteratorGeneratorContinual extends SourceAction<Action> {
	type: typeof RunAsyncIteratorGeneratorContinual;
	uid: string;
	asyncIteratorGenerator: () => AsyncIterableIterator<Action>;
}
export default RunAsyncIteratorGeneratorContinual;
