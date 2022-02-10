import * as should from 'should';
import { Action, applyMiddleware, createStore } from "redux";
import { combineSagas, createModelSaga, IPromiseAction } from "../../src";
import { wait } from '../../src/Timer/wait';

describe('profiler', function () {

	const A1 = 'A1';
	type A1 = { type: typeof A1 };
	const A2 = 'A2';
	type A2 = { type: typeof A2 };

	const saga1 = {
		reducer: () => null,
		updater: async function* (_model: null, action: A1) {
			if (action.type === A1) {
				await wait(10);
				const startedAt = new Date().valueOf();
				while (new Date().valueOf() - startedAt < 200) { /* stuck thread */ }
				await wait(10);
			}
		},
	};

	const saga2 = {
		reducer: () => null,
		updater: async function* (_model: null, action: A2) {
			if (action.type === A2) {
				await wait(200);
			}
		},
	};

	let warnings: { message: string; sagaNames: string[]; action: Action }[];
	const onWarning = (message: string, sagaNames: string[], action: Action) => {
		warnings.push({ message, sagaNames, action });
	};

	beforeEach(function () {
		warnings = [];
	});

	it('should log when some saga takes too much time sync thread', async function () {
		const sagas = combineSagas({
			saga1,
		});
		const modelSaga = createModelSaga(sagas, { profiler: { thresholdMs: 100, onWarning } });

		const store = createStore(() => null, applyMiddleware(modelSaga.middleware));
		const action = store.dispatch({ type: A1 }) as IPromiseAction;
		await action.__promise;
		should(warnings).lengthOf(1);
		should(warnings[0].sagaNames).eql(['saga1']);
		should(warnings[0].action).eql({ type: A1 });

		modelSaga.destroy();
	});

	it('should log correct saga and action when more combined sagas', async function () {
		const sagas = combineSagas({
			saga1,
			saga2,
		});
		const modelSaga = createModelSaga(sagas, { profiler: { thresholdMs: 100, onWarning } });

		const store = createStore(() => null, applyMiddleware(modelSaga.middleware));
		const action1 = store.dispatch({ type: A1 }) as IPromiseAction;
		const action2 = store.dispatch({ type: A2 }) as IPromiseAction;
		await action1.__promise;
		await action2.__promise;
		should(warnings).lengthOf(1);
		should(warnings[0].sagaNames).eql(['saga1', 'saga2']);
		should(warnings[0].action).eql({ type: A1 });

		modelSaga.destroy();
	});
});
