
interface SymbolConstructor {
	readonly observable: symbol;
}

declare interface ObservableConstructor<TValue, TError extends Error> {
	new(subscriber: SubscriberFunction<TValue, TError>): Observable<TValue, TError>;
}

declare class Observable<TValue, TError extends Error> {

	// Converts items to an Observable
	public static of<TValue>(...items: TValue[]): Observable<TValue, Error>;

	// Converts an observable or iterable to an Observable
	public static from<TValue, TError extends Error>(
		observable: Observable<TValue, TError> | IterableIterator<TValue>
	): Observable<TValue, TError>;

	constructor(subscriber: SubscriberFunction<TValue, TError>);

	// Subscribes to the sequence with an observer
	public subscribe(observer: Observer<TValue, TError>): Subscription;

	public map<TMappedValue>(mapFunction: (value: TValue) => TMappedValue): Observable<TMappedValue, TError>;
	public forEach(eachFunction: (value: TValue) => void): Promise<void>;
	public filter(filterFunction: (value: TValue) => boolean): Observable<TValue, TError>;
	public reduce<TReducetion>(
		reduceFunction: (value: TValue) => TReducetion,
		initialReduction?: TReducetion
	): Observable<TReducetion, TError>;
	public flatMap<TMappedValue>(
		mapFunction: (value: TValue | Observable<TMappedValue, TError>) => TMappedValue
	): Observable<TMappedValue, TError>;

	// Subscribes to the sequence with callbacks
	public subscribe(
		onNext: (value: TValue) => void,
		onError?: (error: TError) => void,
		onComplete?: () => void
	): Subscription;

	// Returns itself
	public [Symbol.observable](): Observable<TValue, TError>;
}

interface Subscription {

	// Cancels the subscription
	unsubscribe(): void;

	// A boolean value indicating whether the subscription is closed
	closed(): boolean;
}

interface SubscriberFunction<TValue, TError extends Error> {
	(observer: SubscriptionObserver<TValue, TError>): (() => void) | Subscription;
}

interface Observer<TValue, TError extends Error> {
	// Receives the subscription object when `subscribe` is called
	start(subscription: Subscription): void;

	// Receives the next value in the sequence
	next(value: TValue): void;

	// Receives the sequence error
	error(errorValue: TError): void;

	// Receives a completion notification
	complete(): void;
}

interface SubscriptionObserver<TValue, TError extends Error> {

	// Sends the next value in the sequence
	next(value: TValue): void;

	// Sends the sequence error
	error(errorValue: TError): void;

	// Sends the completion notification
	complete(): void;

	// A boolean value indicating whether the subscription is closed
	closed(): boolean;
}
