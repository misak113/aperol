
import { Action } from 'redux';

export type ObservableSubscribedType = '@@aperol/ObservableSubscribed';
export const ObservableSubscribed: ObservableSubscribedType = '@@aperol/ObservableSubscribed';
export interface ObservableSubscribed<TSourceAction extends Action> {
	type: ObservableSubscribedType;
	observable: Observable<any, Error>;
	subscription: Subscription;
	sourceAction: TSourceAction;
}
export default ObservableSubscribed;
