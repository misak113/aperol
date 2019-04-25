
import { Action } from 'redux';

// yielding of Observable could by recursive. However typescript could not describe it
export type ISub2UpdaterYield = Promise<any>
	| Observable<Iterator<any> | AsyncIterator<any>, Error>
	| Action;

export type ISubUpdaterYield = Promise<any>
	| Observable<Iterator<ISub2UpdaterYield> | AsyncIterator<ISub2UpdaterYield>, Error>
	| Action;

type IUpdaterYield = Promise<any>
	| Observable<Iterator<ISubUpdaterYield> | AsyncIterator<ISubUpdaterYield>, Error>
	| Action;
export default IUpdaterYield;
