import { Action } from "redux";

export default class ActionYield<TAction extends Action = Action> {

	constructor(
		public readonly action: TAction,
	) {}
}
