import ObservableYield from './ObservableYield';
import ActionYield from './ActionYield';

// yielding of Observable could by recursive. However typescript could not describe it
export type ISub2UpdaterYield = Promise<any>
	| ObservableYield
	| ActionYield;

export type ISubUpdaterYield = Promise<any>
	| ObservableYield<Observable<Iterator<ISub2UpdaterYield> | AsyncIterator<ISub2UpdaterYield>, Error>>
	| ActionYield;

type IUpdaterYield = Promise<any>
	| ObservableYield<Observable<Iterator<ISubUpdaterYield> | AsyncIterator<ISubUpdaterYield>, Error>>
	| ActionYield;
export default IUpdaterYield;

export type AnyIterator = Iterator<IUpdaterYield, any, IUpdaterYield | undefined>
	| AsyncIterator<IUpdaterYield, any, IUpdaterYield | undefined>;
