
import { Action } from 'redux';

export type AsyncIteratorStartedType = '@@aperol/AsyncIteratorStarted';
export const AsyncIteratorStarted: AsyncIteratorStartedType = '@@aperol/AsyncIteratorStarted';
export interface AsyncIteratorStarted<TSourceAction extends Action> {
	type: AsyncIteratorStartedType;
	asyncIterator: AsyncIterableIterator<Action>;
	promise: Promise<void>;
	sourceAction: TSourceAction;
}
export default AsyncIteratorStarted;
