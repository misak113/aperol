
export const promiseProperty = '__promise';
export interface PromiseAction {
	'__promise': Promise<void>;
}
