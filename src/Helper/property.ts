
export function extendWithInternalProperty(object: object, property: string, value: any) {
	Object.defineProperty(object, property, {
		enumerable: false,
		configurable: false,
		writable: false,
		value,
	});
}
