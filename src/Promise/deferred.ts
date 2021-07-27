
export type IDeferred<T> = {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (error: Error) => void;
};

/**
 * It creates outside controlled promise so you can do the resole and reject outside the Promise constructor callback.
 * In standard Promise instantiating, you have to do all logic inside the constructor callback.
 */
export function createDeferred<T>(): IDeferred<T> {
	const deferred: Partial<IDeferred<T>> = {};
	const promise = new Promise((resolve: (value: T) => void, reject: (error: Error) => void) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});
	deferred.promise = promise;
	return deferred as IDeferred<T>;
}
