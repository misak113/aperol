
import { Action } from 'redux';

interface IPromiseAction extends Action {
	__promise: Promise<void>;
}
export default IPromiseAction;
