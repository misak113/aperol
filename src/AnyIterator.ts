import IUpdaterYield from "./IUpdaterYield";

type AnyIterator = Iterator<IUpdaterYield, any, IUpdaterYield | undefined> | AsyncIterator<IUpdaterYield, any, IUpdaterYield | undefined>;
export default AnyIterator;
