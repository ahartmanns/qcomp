'use strict';
function modelTypeToLongString(modelType)
{
	if(modelType === "ctmc") return "continuous-time Markov chain";
	else if(modelType === "dtmc") return "discrete-time Markov chain";
	else if(modelType === "ma") return "Markov automaton";
	else if(modelType === "mdp") return "Markov decision process";
	else if(modelType === "pta") return "probabilistic timed automaton";
	else return modelType;
}
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
	else if(propertyType === "exp-reward-reward-instant") return "reward-instantaneous reward";
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
function propertiesToShortList(properties)
{
	var list = "";
	var props = properties.filter(p => p.type === "prob-reach");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × P";
	props = properties.filter(p => p.type === "prob-reach-step-bounded" || p.type === "prob-reach-time-bounded" || p.type === "prob-reach-reward-bounded");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × Pb";
	props = properties.filter(p => p.type === "exp-steps" || p.type === "exp-time" || p.type === "exp-reward");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × E";
	props = properties.filter(p => p.type === "exp-steps-step-bounded" || p.type === "exp-steps-time-bounded" || p.type === "exp-steps-reward-bounded"
		|| p.type === "exp-time-step-bounded" || p.type === "exp-time-time-bounded" || p.type === "exp-time-reward-bounded"
		|| p.type === "exp-reward-step-bounded" || p.type === "exp-reward-time-bounded" || p.type === "exp-reward-reward-bounded");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × Eb";
	props = properties.filter(p => p.type === "exp-reward-step-instant" || p.type === "exp-reward-time-instant" || p.type === "exp-reward-reward-instant");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × Ei";
	props = properties.filter(p => p.type === "steady-state-reward" || p.type === "steady-state-prob");
	if(props.length !== 0) list += ", " + props.length.toLocaleString() + " × S";
	return list.length === 0 ? list : list.substr(2);
}
function CapitaliseFirst(str)
{
	return str.length === 0 ? str : str.charAt(0).toUpperCase() + str.slice(1)
}
function resultValueToString(value)
{
	if(typeof value === "object" && value.hasOwnProperty("approx")) return value["approx"];
	if(typeof value === "object" && value.hasOwnProperty("lower") && value.hasOwnProperty("upper")) return "[" + value["lower"] + ", " + value["upper"] + "]";
	if(typeof value === 'number') return value.toString();
	return value;
}
function numberToOrderString(number)
{
	if(number < 1000) return number.toLocaleString();
	else if(number < 10000) return (number / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " k";
	else if(number < 100000) return (number / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " k";
	else if(number < 1000000) return (number / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " k";
	else if(number < 10000000) return (number / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " M";
	else if(number < 100000000) return (number / 1000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " M";
	else if(number < 1000000000) return (number / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " M";
	else if(number < 10000000000) return (number / 1000000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " G";
	else if(number < 100000000000) return (number / 1000000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " G";
	else if(number < 1000000000000) return (number / 1000000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " G";
	else if(number < 10000000000000) return (number / 1000000000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " T";
	else if(number < 100000000000000) return (number / 1000000000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " T";
	else return (number / 1000000000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " T";
}
function formatText(text)
{
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/`/g, "<span class=\"tt\">")
		.replace(/´/g, "</span>");
}
