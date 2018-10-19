function propertyTypeToLongString(propertyType)
{
	if(propertyType === "prob-reach") return "probabilistic reachability";
	else if(propertyType === "prob-reach-step-bounded") return "step-bounded probabilistic reachability";
	else if(propertyType === "prob-reach-time-bounded") return "time-bounded probabilistic reachability";
	else if(propertyType === "prob-reach-reward-bounded") return "reward-bounded probabilistic reachability";
	else if(propertyType === "exp-steps") return "expected accumulated number of steps";
	else if(propertyType === "exp-steps-step-bounded") return "step-bounded expected number of steps";
	else if(propertyType === "exp-steps-time-bounded") return "time-bounded expected number of steps";
	else if(propertyType === "exp-steps-reward-bounded") return "reward-bounded expected number of steps";
	else if(propertyType === "exp-time") return "expected accumulated time";
	else if(propertyType === "exp-time-step-bounded") return "step-bounded expected time";
	else if(propertyType === "exp-time-time-bounded") return "time-bounded expected time";
	else if(propertyType === "exp-time-reward-bounded") return "reward-bounded expected time";
	else if(propertyType === "exp-reward") return "expected accumulated reward";
	else if(propertyType === "exp-reward-step-bounded") return "step-bounded expected accumulated reward";
	else if(propertyType === "exp-reward-time-bounded") return "time-bounded expected accumulated reward";
	else if(propertyType === "exp-reward-reward-bounded") return "reward-bounded expected accumulated reward";
	else if(propertyType === "exp-reward-step-instant") return "step-instantaneous reward";
	else if(propertyType === "exp-reward-time-instant") return "time-instantaneous reward";
	else if(propertyType === "exp-reward-reward-instant") return "time-instantaneous reward";
	else if(propertyType === "steady-state-reward") return "steady-state reward";
	else if(propertyType === "steady-state-prob") return "steady-state probability";
	else return propertyType;
}
function propertyTypeToShortString(propertyType)
{
	if(propertyType === "prob-reach") return "P";
	else if(propertyType === "prob-reach-step-bounded") return "Pb";
	else if(propertyType === "prob-reach-time-bounded") return "Pb";
	else if(propertyType === "prob-reach-reward-bounded") return "Pb";
	else if(propertyType === "exp-steps") return "E";
	else if(propertyType === "exp-steps-step-bounded") return "Eb";
	else if(propertyType === "exp-steps-time-bounded") return "Eb";
	else if(propertyType === "exp-steps-reward-bounded") return "Eb";
	else if(propertyType === "exp-time") return "E";
	else if(propertyType === "exp-time-step-bounded") return "Eb";
	else if(propertyType === "exp-time-time-bounded") return "Eb";
	else if(propertyType === "exp-time-reward-bounded") return "Eb";
	else if(propertyType === "exp-reward") return "E";
	else if(propertyType === "exp-reward-step-bounded") return "Eb";
	else if(propertyType === "exp-reward-time-bounded") return "Eb";
	else if(propertyType === "exp-reward-reward-bounded") return "Eb";
	else if(propertyType === "exp-reward-step-instant") return "Ei";
	else if(propertyType === "exp-reward-time-instant") return "Ei";
	else if(propertyType === "exp-reward-reward-instant") return "Ei";
	else if(propertyType === "steady-state-prob") return "S";
	else if(propertyType === "steady-state-reward") return "S";
	else return propertyType;
}
function CapitaliseFirst(str)
{
	return str.length === 0 ? str : str.charAt(0).toUpperCase() + str.slice(1)
}
function resultValueToString(value)
{
	if(typeof value === "object" && value.hasOwnProperty("approx")) return value["approx"];
	if(typeof value === 'number') return value.toString();
	return value;
}
