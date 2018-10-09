'use strict';
var vm = {};
vm.aggregateOptions = [ "average", "maximum", "minimum" ];
vm.aggregateConfig = ko.observable(vm.aggregateOptions[0]);
vm.aggregateConfig.subscribe(updateData);
vm.valueOptions = [ "runtime" ];
vm.valueConfig = ko.observable(vm.valueOptions[0]);
vm.valueConfig.subscribe(updateData);
vm.axisOptions = [ "tool", "tool version", "model", "parameters", "property" ];
vm.rowConfig = ko.observable(vm.axisOptions[2]);
vm.rowConfig.subscribe(updateData);
vm.columnConfig = ko.observable(vm.axisOptions[0]);
vm.columnConfig.subscribe(updateData);
vm.plotTypes = [ "table", "bar chart" ];
vm.plotType = ko.observable(vm.plotTypes[0]);
vm.plotType.subscribe(updateData);
vm.tools = ko.observableArray();
vm.toolVersions = ko.observableArray();
vm.models = ko.observableArray();
vm.paramCombs = ko.observableArray();
vm.properties = ko.observableArray();
vm.data = ko.observable(null);
function init()
{
	ko.applyBindings(vm);
	var queryString = window.location.href.split("?");
	if(queryString.length > 1) for(var param of queryString[1].split("&"))
	{
		var split = param.split("=");
		if(split[0] === "models" && split.length === 2)
		{
			var modelsToLoad = split[1].split(",");
			loadJson("index.json", index =>
			{
				modelsToLoad = modelsToLoad
					.map(mtl => index.find(i => i.path.endsWith("/" + mtl)))
					.filter(i => i !== undefined);
				vm.modelsToLoadCount = modelsToLoad.length;
				modelsToLoad.forEach(mr => loadJson(mr.path + "/index.json", model => loadModel(model, mr.path)));
			});
		}
	}
}
function onEndInit()
{
	vm.tools.sort(compareTools);
	vm.toolVersions.sort(compareToolVersions);
	updateData();
}
function loadModel(m, path)
{
	var model = {
		short: m.short,
		name: m.name,
		path: path,
		selected: ko.observable(true),
		properties: [],
		files: [],
		paramCombs: ko.observableArray(),
		results: ko.observableArray()
	};
	model.selected.subscribe(onSelectedChanged);
	for(var i = 0; i < m.properties.length; ++i)
	{
		var p = m.properties[i];
		var property = {
			model: model,
			name: p.name,
			type: p.type,
			selected: ko.observable(true)
		};
		property.selected.subscribe(onSelectedChanged);
		model.properties.push(property);
		vm.properties.push(property);
	}
	m.files.forEach(f =>
	{
		var file = {
			file: f.file,
			parameterValues: []
		};
		if(f["file-parameter-values"] !== undefined) file.parameterValues.push(...f["file-parameter-values"]);
		model.files.push(file);
	});
	if(m.parameters !== undefined) model.parameters = m.parameters.map(p => p.name);
	model.resultsToLoadCount = m.results.length;
	vm.models.push(model);
	loadResults(model, m.results);
}
function compareModels(m1, m2)
{
	return m1.short < m2.short ? -1 : m1.short > m2.short ? 1 : 0;
}
function compareProperties(p1, p2)
{
	var mc = compareModels(p1.model, p2.model);
	if(mc !== 0) return mc;
	return p1.name < p1.name ? -1 : p1.name > p1.name ? 1 : 0;
}
function loadResults(model, rs)
{
	rs.forEach(mr =>
	{
		if(typeof mr !== "string") mr = mr.file;
		loadJson(model.path + "/" + mr, r =>
		{
			// Create result object
			var result = {
				model: model,
				tool: createAndRegisterTool(r.tool),
				toolVersion: createAndRegisterToolVersion(r.tool, r.tool.version),
				time: r.time,
				memory: r.memory,
				propertyTimes: []
			};
			
			// Collect property times
			if(r["property-times"] === undefined)
			{
				// Divide total time evenly over properties
				for(var i = 0; i < model.properties.length; ++i)
				{
					result.propertyTimes.push({
						property: model.properties[i],
						time: result.time / model.properties.length
					});
				}
			}
			else
			{
				// Calculate overhead
				var overhead = result.time;
				for(var i = 0; i < r["property-times"].length; ++i) overhead -= r["property-times"][i].time;
				if(overhead < 0.0) overhead = 0.0;
				
				// Evenly distribute overhead over property times
				for(var i = 0; i < model.properties.length; ++i)
				{
					var pt = 0.0;
					var ptt = r["property-times"].find(pttt => pttt.name === model.properties[i].name);
					if(ptt !== undefined) pt = ptt.time;
					result.propertyTimes.push({
						property: model.properties[i],
						time: pt + overhead / model.properties.length
					});
				}
			}
			
			// Find parameter combination of this result
			if(r.file.startsWith("../"))
			{
				var fileName = r.file.substring(3);
				var modelFile = model.files.find(mf => mf.file === fileName);
				if(modelFile !== undefined)
				{
					var paramComb = "";
					var paramCombShort = "";
					for(var i = 0; i < model.parameters.length; ++i)
					{
						if(paramComb !== "") paramComb += ", ";
						if(paramCombShort !== "") paramCombShort += "-";
						paramComb += model.parameters[i] + " = ";
						
						// File parameter?
						var fpv = modelFile.parameterValues.find(pv => pv.name == model.parameters[i]);
						if(fpv !== undefined) { paramComb += fpv.value; paramCombShort += fpv.value; }
						else if(r["open-parameter-values"] !== undefined)
						{
							// Open parameter?
							var opv = r["open-parameter-values"].find(pv => pv.name == model.parameters[i]);
							if(opv !== undefined) { paramComb += opv.value; paramCombShort += opv.value; }
							else { paramComb += "?"; paramCombShort += "X"; } // should not happen with proper result files
						}
						else { paramComb += "?"; paramCombShort += "X"; } // should not happen with proper result files
					}
					result.paramComb = createAndRegisterParamComb(model, paramComb, paramCombShort);
				}
			}
			if(result.paramComb === undefined) result.paramComb = createAndRegisterParamComb(model, "INVALID", "INVALID");
			
			// Add result to model and vm
			model.results.push(result);
			--model.resultsToLoadCount;
			if(model.resultsToLoadCount === 0)
			{
				--vm.modelsToLoadCount;
				if(vm.modelsToLoadCount === 0) onEndInit();
			}
		})
	});
}
function createAndRegisterParamComb(model, name, short)
{
	var paramComb = model.paramCombs().find(pc => pc.short === short);
	if(paramComb === undefined)
	{
		paramComb = {
			model: model,
			name: name,
			short: short,
			selected: ko.observable(true)
		};
		paramComb.selected.subscribe(newValue => onParamCombSelectedChanged(paramComb, newValue));
		model.paramCombs.push(paramComb);
		vm.paramCombs.push(paramComb);
	}
	return paramComb;
}
function compareParamCombs(pc1, pc2)
{
	var mc = compareModels(pc1.model, pc2.model);
	if(mc !== 0) return mc;
	return pc1.short < pc1.short ? -1 : pc1.short > pc1.short ? 1 : 0;
}
function onParamCombSelectedChanged(paramComb, newValue)
{
	updateData();
}
function createAndRegisterTool(t)
{
	var tool = vm.tools().find(vmt => vmt.name === t.name);
	if(tool === undefined)
	{
		tool = {
			name: t.name,
			versionCount: ko.observable(0),
			selected: ko.observable(true)
		};
		tool.selected.subscribe(newValue => onToolSelectedChanged(tool, newValue));
		vm.tools.push(tool);
	}
	return tool;
}
function compareTools(t1, t2)
{
	return t1.name < t2.name ? -1 : t1.name > t2.name ? 1 : 0;
}
function onToolSelectedChanged(tool, newValue)
{
	if(newValue && vm.toolVersions().filter(tv => tv.tool === tool && tv.selected()).length === 0)
	{
		for(var i = 0; i < vm.toolVersions().length; ++i)
		{
			if(vm.toolVersions()[i].tool === tool) vm.toolVersions()[i].selected(true);
		}
	}
	onSelectedChanged();
}
function createAndRegisterToolVersion(t, v)
{
	var tool = vm.tools().find(vmt => vmt.name === t.name);
	var toolVersion = vm.toolVersions().find(vmtv => vmtv.tool === tool && vmtv.version === v);
	if(toolVersion === undefined)
	{
		tool.versionCount(tool.versionCount() + 1);
		toolVersion = {
			tool: tool,
			version: v,
			selected: ko.observable(true)
		};
		toolVersion.selected.subscribe(newValue => onToolVersionSelectedChanged(toolVersion, newValue));
		vm.toolVersions.push(toolVersion);
	}
	return toolVersion;
}
function compareToolVersions(tv1, tv2)
{
	var tc = compareTools(tv1.tool, tv2.tool);
	if(tc !== 0) return tc;
	return tv1.version < tv2.version ? -1 : tv1.version > tv2.version ? 1 : 0;
}
function onToolVersionSelectedChanged(toolVersion, newValue)
{
	var selectedVersionCount = vm.toolVersions().filter(tv => tv.tool === toolVersion.tool && tv.selected()).length;
	toolVersion.tool.selected(selectedVersionCount !== 0);
	onSelectedChanged();
}
function onSelectedChanged()
{
	updateData();
}
function updateData()
{
	var data = {
		display: vm.plotType(),
		valuesCaption: CapitaliseFirst(vm.aggregateConfig() + " " + vm.valueConfig()),
		values: [],
		rows: []
	};
		
	// Row caption
	switch(vm.rowConfig())
	{
		case "tool":
			data.rowsCaption = { caption: "Tool" };
			break;
		case "tool version":
			data.rowsPreCaption = { caption: "Tool" };
			data.rowsCaption = { caption: "Version" };
			break;
		case "model":
			data.rowsCaption = { caption: "Model" };
			break;
		case "parameters":
			data.rowsPreCaption = { caption: "Model" };
			data.rowsCaption = { caption: "Parameters" };
			break;
		case "property":
			data.rowsPreCaption = { caption: "Model" };
			data.rowsCaption = { caption: "Property" };
			break;
	}

	// Column captions
	switch(vm.columnConfig())
	{
		case "tool":
			data.columnsCaption = { caption: "Tool" };
			data.columnCaptions = vm.tools()
				.map(t => t.selected() ? { caption: t.name, isFirst: true, isLast: true } : null).filter(v => v !== null);
			break;
		case "tool version":
			data.columnsTopCaption = { caption: "Tool" };
			data.columnsCaption = { caption: "Version" };
			data.columnTopCaptions = vm.tools()
				.map(t => t.selected() ? { caption: t.name, span: vm.toolVersions().filter(tv => tv.selected() && tv.tool === t).length } : null)
				.filter(v => v !== null && v.span !== 0);
			data.columnCaptions = vm.toolVersions()
				.map(tv => tv.selected() && tv.tool.selected() ? { caption: "v" + tv.version, isFirst: true, isLast: true } : null)
				.filter(v => v !== null);
			break;
		case "model":
			data.columnsCaption = { caption: "Model" };
			data.columnCaptions = vm.models()
				.map(m => m.selected() ? { caption: m.short, isFirst: true, isLast: true } : null)
				.filter(v => v !== null);
			break;
		case "parameters":
			data.columnsTopCaption = { caption: "Model" };
			data.columnsCaption = { caption: "Parameters" };
			data.columnTopCaptions = vm.models()
				.map(m => m.selected() ? { caption: m.short, span: vm.paramCombs().filter(pc => pc.selected() && pc.model === m).length } : null)
				.filter(v => v !== null && v.span !== 0);
			data.columnCaptions = vm.paramCombs()
				.map(pc => pc.selected() && pc.model.selected() ? { caption: pc.short, isFirst: true, isLast: true } : null)
				.filter(v => v !== null);
			break;
		case "property":
			data.columnsTopCaption = { caption: "Model" };
			data.columnsCaption = { caption: "Property" };
			data.columnTopCaptions = vm.models()
				.map(m => m.selected() ? { caption: m.short, span: vm.properties().filter(p => p.selected() && p.model === m).length } : null)
				.filter(v => v !== null && v.span !== 0);
			data.columnCaptions = vm.properties()
				.map(p => p.selected() && p.model.selected() ? { caption: p.name, isFirst: true, isLast: true } : null)
				.filter(v => v !== null);
			break;
		default:
			data.columnCaptions = [{ caption: CapitaliseFirst(vm.valueConfig()), isFirst: true, isLast: true }];
			break;
	}
	if(data.columnTopCaptions !== undefined)
	{
		var c = 0;
		for(var i = 0; i < data.columnTopCaptions.length; ++i)
		{
			for(var j = c; j < c + data.columnTopCaptions[i].span; ++j)
			{
				data.columnCaptions[j].isFirst = j == c;
				data.columnCaptions[j].isLast = j == c + data.columnTopCaptions[i].span - 1;
			}
			c += data.columnTopCaptions[i].span;
		}
	}
	
	// Row iteration
	iterateRows(data);
	
	// Add pre-caption column
	if(vm.rowConfig() === "tool version" || vm.rowConfig() === "parameters" || vm.rowConfig() === "property")
	{
		for(var i = 0; i < data.rows.length; ++i)
		{
			var row = data.rows[i];
			switch(vm.rowConfig())
			{
				case "tool version":
					row.preCaption = vm.plotType() !== "table" || i === 0 || data.rows[i - 1].obj.tool !== row.obj.tool ? row.obj.tool.name : "";
					break;
				case "parameters":
				case "property":
					row.preCaption = vm.plotType() !== "table" || i === 0 || data.rows[i - 1].obj.model !== row.obj.model ? row.obj.model.short : "";
					break;
			}
		}
	}
	
	// Show the table
	vm.data(data);

	// Chart
	if(vm.plotType() !== "table")
	{
		// Collect all data items, adding column information in the process
		for(var i = 0; i < data.rows.length; ++i)
		{
			var co = 0;
			for(var j = 0; j < (data.columnTopCaptions === undefined ? data.columnCaptions.length : data.columnTopCaptions.length); ++j)
			{
				for(var k = 0; k < (data.columnTopCaptions === undefined ? 1 : data.columnTopCaptions[j].span); ++k, ++co)
				{
					var value = data.rows[i].columnValues[co];
					value.rowPreCaption = value.row.preCaption;
					value.rowCaption = value.row.caption;
					value.columnTopCaption = data.columnTopCaptions === undefined ? "" : data.columnTopCaptions[j].caption;
					value.columnCaption = value.columnTopCaption + (value.columnTopCaption.length === 0 ? "" : " ") + data.columnCaptions[co].caption;
					data.values.push(value);
				}
			}
		}
		
		// Configure chart
		var chartConfig = {
			data: data.values,
			dimensions: { },
			type: "bar",
			x: [],
			y: [],
			guide: [],
			settings: {
				asyncRendering: true
			}
		};
		
		if(data.rowsPreCaption !== undefined)
		{
			chartConfig.x.push("rowPreCaption");
			chartConfig.dimensions["rowPreCaption"] = { type: "category", scale: "ordinal" };
			chartConfig.guide.push({
				x: { label: { text: data.rowsPreCaption.caption } }
			});
		}
		chartConfig.x.push("rowCaption");
		chartConfig.dimensions["rowCaption"] = { type: "category", scale: "ordinal" };
		chartConfig.guide.push({
			x: { label: { text: data.rowsCaption.caption } },
			y: { label: { text: data.valuesCaption } }
		});
		chartConfig.y.unshift("value");
		chartConfig.dimensions["value"] = { type: "measure" };
		if(vm.columnConfig() !== undefined)
		{
			chartConfig.y.unshift("columnCaption");
			chartConfig.dimensions["columnCaption"] = { type: "category", scale: "ordinal" };
			if(chartConfig.guide[0].y !== undefined) chartConfig.guide.unshift({ });
			chartConfig.guide[0].y = { label: { text: data.columnsCaption.caption } };
		}
		
		// Create the chart
		var chart = new Taucharts.Chart(chartConfig);
		chart.renderTo(document.getElementById("chart"));
	}
}
function iterateRows(data)
{
	switch(vm.rowConfig())
	{
		case "tool":
			for(var i = 0; i < vm.tools().length; ++i)
			{
				var tool = vm.tools()[i];
				if(!tool.selected()) continue;
				data.rows.push(iterateColumns(tool, tool.name));
			}
			break;
		case "tool version":
			for(var i = 0; i < vm.toolVersions().length; ++i)
			{
				var toolVersion = vm.toolVersions()[i];
				if(!toolVersion.selected() || !toolVersion.tool.selected()) continue;
				data.rows.push(iterateColumns(toolVersion, "v" + toolVersion.version));
			}
			break;
		case "model":
			for(var i = 0; i < vm.models().length; ++i)
			{
				var model = vm.models()[i];
				if(!model.selected()) continue;
				data.rows.push(iterateColumns(model, model.short));
			}
			break;
		case "parameters":
			for(var i = 0; i < vm.paramCombs().length; ++i)
			{
				var paramComb = vm.paramCombs()[i];
				if(!paramComb.selected() || !paramComb.model.selected()) continue;
				data.rows.push(iterateColumns(paramComb, paramComb.short));
			}
			break;
		case "property":
			for(var i = 0; i < vm.properties().length; ++i)
			{
				var property = vm.properties()[i];
				if(!property.selected() || !property.model.selected()) continue;
				data.rows.push(iterateColumns(property, property.name));
			}
			break;
		default:
			data.rows.push(iterateColumns(null, CapitaliseFirst(vm.valueConfig())));
			break;
	}
}
function iterateColumns(rowObj, caption)
{
	var row = {
		obj: rowObj,
		caption: caption,
		columnValues: []
	};

	// Iterate columns
	switch(vm.columnConfig())
	{
		case "tool":
			for(var i = 0; i < vm.tools().length; ++i)
			{
				var tool = vm.tools()[i];
				if(!tool.selected()) continue;
				var value = iterateValue(rowObj, tool);
				value.row = row;
				row.columnValues.push(value);
			}
			break;
		case "tool version":
			for(var i = 0; i < vm.toolVersions().length; ++i)
			{
				var toolVersion = vm.toolVersions()[i];
				if(!toolVersion.selected() || !toolVersion.tool.selected()) continue;
				var value = iterateValue(rowObj, toolVersion);
				value.row = row;
				row.columnValues.push(value);
			}
			break;
		case "model":
			for(var i = 0; i < vm.models().length; ++i)
			{
				var model = vm.models()[i];
				if(!model.selected()) continue;
				var value = iterateValue(rowObj, model);
				value.row = row;
				row.columnValues.push(value);
			}
			break;
		case "parameters":
			for(var i = 0; i < vm.paramCombs().length; ++i)
			{
				var paramComb = vm.paramCombs()[i];
				if(!paramComb.selected() || !paramComb.model.selected()) continue;
				var value = iterateValue(rowObj, paramComb);
				value.row = row;
				row.columnValues.push(value);
			}
			break;
		case "property":
			for(var i = 0; i < vm.properties().length; ++i)
			{
				var property = vm.properties()[i];
				if(!property.selected() || !property.model.selected()) continue;
				var value = iterateValue(rowObj, property);
				value.row = row;
				row.columnValues.push(value);
			}
			break;
		default:
			var value = iterateValue(rowObj, null);
			value.row = row;
			row.columnValues.push(value);
			break;
	}
	
	// Done
	return row;
}
function iterateValue(rowObj, columnObj)
{
	var cv = {
		hasValue: true,
		value: 0,
		displayValue: 0,
		unit: null
	};

	// Sum over matching models
	var hasCvValue = false;
	for(var m = 0; m < vm.models().length; ++m)
	{
		var model = vm.models()[m];
		if(!model.selected()) continue;
		if(vm.rowConfig() === "model" && model !== rowObj) continue;
		if(vm.columnConfig() === "model" && model !== columnObj) continue;
		
		// Sum over parameter combinations
		for(var pc = 0; pc < model.paramCombs().length; ++pc)
		{
			var paramComb = model.paramCombs()[pc];
			if(!paramComb.selected()) continue;
			
			// Average/min/max over matching tools
			var toolsN = 0;
			var toolsValue = vm.aggregateConfig() === "minimum" ? Number.POSITIVE_INFINITY : 0.0;
			var hasToolsValue = false;
			for(var t = 0; t < vm.tools().length; ++t)
			{
				var tool = vm.tools()[t];
				if(!tool.selected()) continue;
				if(vm.rowConfig() === "tool" && tool !== rowObj || vm.rowConfig() === "tool version" && tool !== rowObj.tool) continue;
				if(vm.columnConfig() === "tool" && tool !== columnObj || vm.columnConfig() === "tool version" && tool !== columnObj.tool) continue;
				
				// Average/min/max over matching results
				var toolN = 0;
				var toolValue = vm.aggregateConfig() === "minimum" ? Number.POSITIVE_INFINITY : 0.0;
				var hasToolValue = false;
				for(var r = 0; r < model.results().length; ++r)
				{
					var result = model.results()[r];
					if(result.paramComb != paramComb || result.tool != tool) continue;
					
					// Match rowObj
					switch(vm.rowConfig()) // cases "model" and "tool" have already been checked above, case "property" is checked below
					{
						case "tool version":
							if(result.toolVersion !== rowObj) continue;
							break;
						case "parameters":
							if(result.paramComb !== rowObj) continue;
							break;
					}
					
					// Match columnObj
					switch(vm.columnConfig()) // cases "model" and "tool" have already been checked above, case "property" is checked below
					{
						case "tool version":
							if(result.toolVersion !== columnObj) continue;
							break;
						case "parameters":
							if(result.paramComb !== columnObj) continue;
							break;
					}
					
					// Check if the tool version was selected
					if(!result.toolVersion.selected()) continue;

					// Get value
					var value = 0;
					var hasValue = false;
					switch(vm.valueConfig())
					{
						case "runtime":
							// Sum over property times
							for(var j = 0; j < result.propertyTimes.length; ++j)
							{
								var pt = result.propertyTimes[j];
								if(!pt.property.selected()) continue;
								if(vm.rowConfig() === "property" && pt.property !== rowObj) continue;
								if(vm.columnConfig() === "property" && pt.property !== columnObj) continue;
								hasValue = true;
								value += pt.time;
							}
							break;
					}
					
					// Average/max/min for this tool
					if(hasValue)
					{
						hasToolValue = true;
						switch(vm.aggregateConfig())
						{
							case "average":
								toolValue += (value - toolValue) / (++toolN);
								break;
							case "maximum":
								toolValue = Math.max(toolValue, value);
								break;
							case "minimum":
								toolValue = Math.min(toolValue, value);
								break;
						}
					}
				}
				
				// Average/max/min over different tools
				if(hasToolValue)
				{
					hasToolsValue = true;
					switch(vm.aggregateConfig())
					{
						case "average":
							toolsValue += (toolValue - toolsValue) / (++toolsN);
							break;
						case "maximum":
							toolsValue = Math.max(toolsValue, toolValue);
							break;
						case "minimum":
							toolsValue = Math.min(toolsValue, toolValue);
							break;
					}
				}
			}
			
			// Sum
			if(hasToolsValue)
			{
				hasCvValue = true;
				cv.value += toolsValue;
			}
		}
	}
	
	// Finalise column value
	if(hasCvValue)
	{
		switch(vm.valueConfig())
		{
			case "runtime":
				cv.displayValue = cv.value.toFixed(1);
				cv.unit = "s";
				break;
		}
	}
	else
	{
		cv.hasValue = false;
		cv.displayValue = "";
	}

	// Done
	return cv;
}
// alert(JSON.stringify(model.files.map(mf => mf.file)));
