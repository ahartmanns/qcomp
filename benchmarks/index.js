// View model
var qmcc = {};
qmcc.params = [];
qmcc.modelTypes = [ "CTMC", "DTMC", "MA", "MDP", "PTA" ];
qmcc.originals = ko.observableArray();
qmcc.models = ko.observableArray();
qmcc.filter = {
	name: ko.observable(""),
	type: ko.observable(undefined),
	original: ko.observable(undefined),
	minStates: ko.observable(""),
	maxStates: ko.observable("")
};
qmcc.sortBy = ko.observable("");
qmcc.sortAsc = ko.observable(true);
qmcc.filteredModels = ko.computed(function()
{
	return this.models().filter(m =>
	{
		var modelText = m.name.toUpperCase() + " "
			+ m.short.toUpperCase() + " "
			+ m.notes.toUpperCase();
		return (modelText.includes(this.filter.name().toUpperCase())) // name (via .name and .short)
		&& (this.filter.type() === undefined || m.type === this.filter.type().toLowerCase()) // model type
		&& (this.filter.original() === undefined || m.original.split("-")[0] === this.filter.original()) // original formalism
		&& (this.filter.minStates() === "" || isNaN(Number(this.filter.minStates())) || m.maxStates >= Number(this.filter.minStates())) // min. number of states
		&& (this.filter.maxStates() === "" || isNaN(Number(this.filter.maxStates())) || m.minStates <= Number(this.filter.maxStates())) // max. number of states
	});
}, qmcc);
qmcc.selectedModel = ko.observable(null);
qmcc.select = function(model)
{
	loadResults(model);
	qmcc.selectedModel(model);
	history.replaceState(null, document.title, "#" + model.short.toLowerCase());
	setTimeout(function() { document.getElementById("modelDiv").scrollIntoView(); }, 0);
};
qmcc.close = function()
{
	history.replaceState(null, document.title, location.pathname + location.search);
	qmcc.selectedModel(null);
}
qmcc.check = function(model)
{
	model.checked(!model.checked());
	return false;
};
qmcc.checkAll = function()
{
	setTimeout(function()
	{ 
		var targetState = !qmcc.allChecked();
		for(var i = 0; i < qmcc.models().length; ++i)
		{
			qmcc.models()[i].checked(targetState);
		}
	});
}
qmcc.hasChecked = ko.computed(function()
{
	return qmcc.models().find(model => model.checked()) !== undefined;
});
qmcc.allChecked = ko.computed(function()
{
	return qmcc.models().find(model => !model.checked()) === undefined;
});
qmcc.goToResultsBrowser = function(model)
{
	if(!qmcc.hasChecked()) return;
	window.location.href = "results.html?models=" + qmcc.models().reduce((acc, curr) =>
	{
		return curr.checked() ? acc + (acc === "" ? "" : ",") + curr.short : acc;
	}, "");
}

// Functions
function init()
{
	var queryString = window.location.href.split("?");
	if(queryString.length > 1) for(var param of queryString[1].split("&"))
	{
		var split = param.split("=");
		qmcc.params.push({ name: split[0], value: split.length > 1 ? split[1] : true });
	}
	ko.applyBindings(qmcc);
	var modelCount = -1;
	loadJson("index.json", index =>
	{
		modelCount = index.length;
		index.forEach(mr => loadJson(mr.path + "/index.json", model =>
		{
			model.path = mr.path;
			if(model.references === undefined) model.references = [];
			if(model.parameters === undefined) model.parameters = [];
			if(model.results === undefined) model.results = [];
			if(model.original !== undefined && !qmcc.originals().includes(model.original.split("-")[0])) qmcc.originals.push(model.original.split("-")[0]);
			model.loadedResults = ko.observableArray();
			model.minStates = getStateCount(model.files, Math.min, Number.MAX_SAFE_INTEGER);
			model.maxStates = getStateCount(model.files, Math.max, 0);
			if(typeof model.author === "string") model.author = [separatePersonRef(model.author)];
			else
			{
				for(var i = 0; i < model.author.length; ++i)
				{
					model.author[i] = separatePersonRef(model.author[i]);
				}
			}
			model.submitter = separatePersonRef(model.submitter);
			model.checked = ko.observable(false);
			if(model.notes === undefined) model.notes = "";
			if(model.challenge !== undefined) model.notes += model.challenge;
			if(model.files !== undefined)
			{
				for(var i = 0; i < model.files.length; ++i)
				{
					if(model.files[i]["original-file"] !== undefined)
					{
						if(typeof model.files[i]["original-file"] === "string") model.files[i].originals = [ model.files[i]["original-file"] ];
						else model.files[i].originals = model.files[i]["original-file"];
					}
				}
			}
			qmcc.models.push(model);
			if(qmcc.models().length === modelCount) onEndInit();
		}));
	});
}
function onEndInit()
{
	sortModels("short");
	qmcc.originals.sort();
	if(window.location.hash !== "")
	{
		// Show the model whose short name was specified in the URL's #hash
		for(var i = 0; i < qmcc.models().length; ++i)
		{
			if(qmcc.models()[i].short.toLowerCase() === window.location.hash.substr(1))
			{
				qmcc.select(qmcc.models()[i]);
				break;
			}
		}
		if(qmcc.selectedModel() === null) history.replaceState(null, document.title, location.pathname + location.search);
	}
}
function toggleShowResultDetails(result)
{
	result.showDetails(!result.showDetails());
}
function loadResults(model)
{
	if(model.results === undefined) return; // results have already been loaded
	var modelResults = model.results;
	var modelResultsCount = model.results.length;
	model.results = undefined;
	modelResults.forEach(mr =>
	{
		if(typeof mr === "string") mr = { file: mr, reference: false };
		loadJson(model.path + "/" + mr.file, result =>
		{
			result.model = model;
			result.path = model.path + "/" + mr.file;
			result.path = result.path.substr(0, result.path.lastIndexOf("/"));
			result.showDetails = ko.observable(false);
			result.submitter = separatePersonRef(result.submitter);
			result.isReference = mr.reference;
			model.loadedResults.push(result);
			--modelResultsCount;
			if(modelResultsCount === 0) onResultsLoaded(model);
		})
	});
}
function onResultsLoaded(model)
{
	model.loadedResults.sort(compareResultParameterValues);
}
function compareResultParameterValues(r1, r2)
{
	// Compare the models
	if(r1.model !== r2.model) return r1.model.short < r2.model.short ? -1 : 1;
	
	// Find the files in the models to get the values of the per-file parameters
	var file1 = r1.file.substr(r1.file.lastIndexOf('/') + 1);
	for(var i = 0; i < r1.model.files.length; ++i)
	{
		if(file1 === r1.model.files[i].file.substr(r1.model.files[i].file.lastIndexOf('/') + 1))
		{
			file1 = r1.model.files[i];
			break;
		}
	}
	var file2 = r2.file.substr(r2.file.lastIndexOf('/') + 1);
	for(var i = 0; i < r2.model.files.length; ++i)
	{
		if(file1 === r2.model.files[i].file.substr(r2.model.files[i].file.lastIndexOf('/') + 1))
		{
			file2 = r2.model.files[i];
			break;
		}
	}
	
	// Compare the per-file parameter values
	var pv1 = file1["file-parameter-values"] === undefined ? [] : file1["file-parameter-values"];
	var pv2 = file2["file-parameter-values"] === undefined ? [] : file2["file-parameter-values"];
	for(var i = 0; i < pv1.length && i < pv2.length; ++i)
	{
		if(pv1[i].value < pv2[i].value) return -1;
		else if(pv1[i].value > pv2[i].value) return 1;
	}
	
	// Compare the open parameter values
	pv1 = r1["open-parameter-values"] === undefined ? [] : r1["open-parameter-values"];
	pv2 = r2["open-parameter-values"] === undefined ? [] : r2["open-parameter-values"];
	for(var i = 0; i < pv1.length && i < pv2.length; ++i)
	{
		if(pv1[i].value < pv2[i].value) return -1;
		else if(pv1[i].value > pv2[i].value) return 1;
	}
	
	// The results are for the same parameter values: compare the tool
	var t1 = (r1.tool.name + "-" + r1.tool.version).toUpperCase();
	var t2 = (r2.tool.name + "-" + r2.tool.version).toUpperCase();
	return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
}
function sortModels(sortBy)
{
	var sortAsc = true;
	var sortFun = null;
	if(sortBy === "short") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.short.toUpperCase() == right.short.toUpperCase() ? 0 : (left.short.toUpperCase() < right.short.toUpperCase() ? -1 : 1));
	else if(sortBy === "name") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.name.toUpperCase() == right.name.toUpperCase() ? 0 : (left.name.toUpperCase() < right.name.toUpperCase() ? -1 : 1));
	else if(sortBy === "type") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.type == right.type ? 0 : (left.type < right.type ? -1 : 1));
	else if(sortBy === "original") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.original == right.original ? 0 : (left.original < right.original ? -1 : 1));
	else if(sortBy === "parameters") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.parameters.length - right.parameters.length);
	else if(sortBy === "states") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.minStates - right.minStates === 0 ? left.maxStates - right.maxStates : left.minStates - right.minStates);
	else if(sortBy === "properties") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.properties.length - right.properties.length);
	else if(sortBy === "notes") sortFun = (left, right) => (sortAsc ? 1 : -1) * (left.notes.toUpperCase() == right.notes.toUpperCase() ? 0 : (left.notes.toUpperCase() < right.notes.toUpperCase() ? -1 : 1));
	else return; // should not happen
	if(qmcc.sortBy() === sortBy) qmcc.sortAsc(!qmcc.sortAsc());
	else qmcc.sortAsc(true);
	sortAsc = qmcc.sortAsc();
	qmcc.sortBy(sortBy);
	qmcc.models.sort(sortFun);
}
function getStateCount(files, op, states)
{
	var result = states;
	for(var i = 0; i < files.length; ++i)
	{
		var openParamValues = files[i]["open-parameter-values"];
		if(openParamValues.length === 0) result = op(result, Number.POSITIVE_INFINITY); // no states for certain parameter configuration = too large to find out
		else
		{
			for(var j = 0; j < openParamValues.length; ++j)
			{
				if(openParamValues[j].states !== undefined)
				{
					result = op(result, op(...openParamValues[j].states.map(s => s.number !== undefined ? s.number : s.order !== undefined ? Math.pow(10, s.order) : states)));
				}
				else // no states for certain parameter configuration = too large to find out
				{
					result = op(result, Number.POSITIVE_INFINITY);
				}
			}
		}
	}
	return result;
}
function separatePersonRef(pref)
{
	if (pref.indexOf(" <") > -1)
	{
		var name = pref.substr(0, pref.indexOf(" <"));
		var email = pref.substr(pref.indexOf("<") + 1, pref.length - pref.indexOf("<") - 2);
		return { "name": name, "email": email };		
	}
	else
	{
		return { "name": pref, "email": ""};
	}
}
function getLinkTitle(url)
{
	if(url.length > 16 && url.substr(0, 16) === "https://doi.org/") return "DOI " + url.substr(16);
	else if(url.length > 8 && url.substr(0, 8) === "https://") return url.substr(8);
	else if(url.length > 7 && url.substr(0, 7) === "http://") return url.substr(7);
	else return url;
}
function toVersionFileName(file, version)
{
	return file.substr(0, file.lastIndexOf(".")) + ".v" + version.toString() + file.substr(file.lastIndexOf("."));
}
function stateCountToHtmlString(count)
{
	return count >= 1000000 && Number.isInteger(Math.log10(count)) ? "~ 10<sup>" + Math.log10(count).toString() + "</sup>" : numberToOrderString(count);
}
