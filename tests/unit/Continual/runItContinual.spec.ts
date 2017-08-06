
import * as should from 'should';
import { Action } from 'redux';
import { runItContinual } from '../../../src/Continual/continualActionCreators';
import createModelSaga from '../../../src/createModelSaga';
import ContinualAsyncIteratorStarted from '../../../src/Continual/ContinualAsyncIteratorStarted';
import { repeat as fakeRepeat } from '../fakeTimer';
import { wait } from '../timer';

describe('runItContinual', function () {

	let doRepeat: () => void;
	const getRepeatTick = (tick: () => void) => doRepeat = tick;

	const WelterBegun = 'WelterBegun';
	interface WelterBegun {
		type: typeof WelterBegun;
		greetsLimit: number;
	}

	const Greeted = 'Greeted';
	interface Greeted {
		type: typeof Greeted;
	}

	const WelterTired = 'WelterTired';
	interface WelterTired {
		type: typeof WelterTired;
	}

	interface GreetModel {
		numberOfGreets: number;
		currentGreetsLimit?: number;
		currentGreeting?: AsyncIterableIterator<Action>;
	}

	const initialModel = {
		numberOfGreets: 0,
	};

	const greetSaga = {
		reducer(
			model: GreetModel = initialModel,
			action: Greeted | WelterBegun | WelterTired | ContinualAsyncIteratorStarted<WelterBegun>
		) {
			switch (action.type) {
				case WelterBegun:
					return { ...model, currentGreetsLimit: action.greetsLimit };
				case Greeted:
					return { ...model, numberOfGreets: model.numberOfGreets + 1 };
				case ContinualAsyncIteratorStarted:
					return action.sourceAction.type === WelterBegun ? { ...model, currentGreeting: action.asyncIterator } : model;
				case WelterTired:
					return { ...model, currentGreeting: undefined, currentGreetsLimit: undefined };
				default:
					return model;
			}
		},
		async *updater(model: GreetModel, action: Greeted | WelterBegun) {
			switch (action.type) {
				case WelterBegun:
					yield runItContinual(async function* () {
						for await (let _ of fakeRepeat(getRepeatTick)) {
							yield { type: Greeted };
						}
					});
					break;
				case Greeted:
					if (model.currentGreeting && model.currentGreetsLimit && model.numberOfGreets >= model.currentGreetsLimit) {
						await model.currentGreeting.return!();
						yield { type: WelterTired };
					}
					break;
				default:
			}
		},
	};

	it('should greet 3 times by welter & then stop because welter is tired', async function () {
		const modelSaga = createModelSaga<GreetModel>(greetSaga);
		should.strictEqual(modelSaga.getModel().currentGreeting, undefined);
		modelSaga.dispatch<WelterBegun>({
			type: WelterBegun,
			greetsLimit: 3,
		});
		should.strictEqual(modelSaga.getModel().currentGreetsLimit, 3);
		await wait(0);
		should.notStrictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 0);
		doRepeat();
		await wait(0);
		should.notStrictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 1);
		doRepeat();
		await wait(0);
		should.notStrictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 2);
		doRepeat();
		await wait(0);
		should.strictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 3);
		doRepeat();
		await wait(0);
		should.strictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 3);
		doRepeat();
		await wait(0);
		should.strictEqual(modelSaga.getModel().currentGreeting, undefined);
		should.strictEqual(modelSaga.getModel().numberOfGreets, 3);
	});
});
