
export default class ObservableYield<
	TObservable extends Observable<Iterator<any> | AsyncIterator<any>, Error> = Observable<Iterator<any> | AsyncIterator<any>, Error>> {

	constructor(
		public readonly observable: TObservable,
	) {}
}
