
import { Action } from 'redux';

export const ContinualAsyncIteratorStarted = '@@aperol/Continual/ContinualAsyncIteratorStarted';
export interface ContinualAsyncIteratorStarted<TSourceAction extends Action> {
	type: typeof ContinualAsyncIteratorStarted;
	asyncIterator: AsyncIterableIterator<Action>;
	promise: Promise<void>;
	sourceAction: TSourceAction;
}
export default ContinualAsyncIteratorStarted;
