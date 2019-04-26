
import * as should from 'should';
import createModelSaga from '../../src/createModelSaga';
import combineSagas from '../../src/combineSagas';
import AsyncIteratorStarted from '../../src/AsyncIteratorStarted';

describe('index', () => {

	it('should export all public object', () => {
		const {
			createModelSaga: actualCreateModelSaga,
			combineSagas: actualCombineSagas,
			AsyncIteratorStarted: actualAsyncIteratorStarted,
		} = require('../../src/index');

		should(actualCreateModelSaga).ok();
		should(actualCombineSagas).ok();
		should(actualAsyncIteratorStarted).ok();

		should(actualCreateModelSaga).Function();
		should(actualCombineSagas).Function();
		should(actualAsyncIteratorStarted).String();

		should(actualCreateModelSaga).equal(createModelSaga);
		should(actualCombineSagas).equal(combineSagas);
		should(actualAsyncIteratorStarted).equal(AsyncIteratorStarted);
	});
});
