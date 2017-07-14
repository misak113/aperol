
import * as should from 'should';
import createModelSaga from '../../src/createModelSaga';
import combineSagas from '../../src/combineSagas';
import ObservableSubscribed from '../../src/ObservableSubscribed';

describe('index', () => {

	it('should export all public object', () => {
		const {
			createModelSaga: actualCreateModelSaga,
			combineSagas: actualCombineSagas,
			ObservableSubscribed: actualObservableSubscribed,
		} = require('../../src/index');

		should(actualCreateModelSaga).ok();
		should(actualCombineSagas).ok();
		should(actualObservableSubscribed).ok();

		should(actualCreateModelSaga).Function();
		should(actualCombineSagas).Function();
		should(actualObservableSubscribed).String();

		should(actualCreateModelSaga).equal(createModelSaga);
		should(actualCombineSagas).equal(combineSagas);
		should(actualObservableSubscribed).equal(ObservableSubscribed);
	});
});
