import { SearchSite } from "../../archive/search/search-site.js"
import { update, setRenderFunction, l } from "../../archive/arf/arf.js"
import { NavGroup, NavEntry } from "../../archive/search/section-navigation.js"
import { CollectionSetup } from "../../archive/search/collection-setup.js"
import { ExportView } from "../../archive/search/export-view.js"
import { ImportView } from "../../archive/search/import-view.js"
import { PokemonData, Pokemon } from "./pokemon-data.js"
import { State } from "./state.js"
import { formName, sprite, typesText, abilitiesText, statText, eggGroupsText, typeText, learnMethodText, IVEVText, ballSprites, movesText } from "./pokemon-display.js"
import { CollectionGroup } from "./local-collection.js"
import { PokemonView } from "./pokemon-view.js"
import { getSpreadsheetUrl } from "./spreadsheet-parser.js"

window.onload = function () {
	var site = new SearchSite()
	window.site = site
	var stuff = new PokemonStuff(site)
	window.stuff = stuff
	site.header = "Stuff"
	site.sections.navigation.navigationEntries = () => stuff.navThing()
	setRenderFunction(() => site.render())
	update()
}

function pokemonCollectionSetup() {
	const setup = new CollectionSetup()
	setup.allowAnythingFilter = false
	setup.defaultFilter = "name"
	setup.add("sprite", "Sprite", { value: p => sprite(p) }, false, "id")
	setup.add("id", "ID")
	setup.add("name", "Name")
	setup.add("form", "Form", {}, { options: ["Base", "Alola", "Mega"] })
	setup.add("name+form", "Name & Form", { value: formName }, false, "name")
	setup.add("types", "Types", { value: typesText }, { options: stuff.data.typeNames, restricted: true })
	setup.add("abilities", "Abilities", { value: abilitiesText }, { options: Object.keys(stuff.data.abilities) })
	setup.add("hp", "HP", { value: p => statText(p.stats.hp), data: p => p.stats.hp })
	setup.add("atk", "Atk", { value: p => statText(p.stats.atk), data: p => p.stats.atk })
	setup.add("def", "Def", { value: p => statText(p.stats.def), data: p => p.stats.def })
	setup.add("spa", "SpA", { value: p => statText(p.stats.spa), data: p => p.stats.spa })
	setup.add("spd", "SpD", { value: p => statText(p.stats.spd), data: p => p.stats.spd })
	setup.add("spe", "Spe", { value: p => statText(p.stats.spe), data: p => p.stats.spe })
	setup.add("total", "Total", { value: p => sumStats(p) + "" })
	setup.add("eggGroups", "Egg Groups", { value: eggGroupsText }, { options: stuff.data.eggGroups, restricted: true })
	setup.showTableEntries(["sprite", "name+form", "types", "abilities", "hp", "atk", "def", "spa", "spd", "spe", "total", "eggGroups"])
	setup.showGridEntries(["sprite"])
	setup.gridSetup.compact = true
	const view = new PokemonView()
	setup.view = (pokemon, collection) => view.withPokemon(pokemon, collection)
	var setupIndividual = new CollectionSetup()
	setupIndividual.add("nickname", "Nickname")
	setupIndividual.add("ability", "Ability", { value: p => abilitiesText(p, true) }, { options: Object.keys(stuff.data.abilities) })
	setupIndividual.add("nature", "Nature", { options: Object.keys(stuff.data.natures) })
	setupIndividual.copyFrom(setup)
	setupIndividual.add("hpivev", "HP IV/EV", { value: p => new IVEVText("hp", p), data: p => p.ivs.hp })
	setupIndividual.add("atkivev", "Atk IV/EV", { value: p => new IVEVText("atk", p), data: p => p.ivs.atk })
	setupIndividual.add("defivev", "Def IV/EV", { value: p => new IVEVText("def", p), data: p => p.ivs.def })
	setupIndividual.add("spaivev", "SpA IV/EV", { value: p => new IVEVText("spa", p), data: p => p.ivs.spa })
	setupIndividual.add("spdivev", "SpD IV/EV", { value: p => new IVEVText("spd", p), data: p => p.ivs.spd })
	setupIndividual.add("speivev", "Spe IV/EV", { value: p => new IVEVText("spe", p), data: p => p.ivs.spe })
	setupIndividual.add("learntMoves", "Moves", { value: movesText })
	setupIndividual.add("balls", "Balls", { value: ballSprites })
	setupIndividual.add("count", "Count")
	setupIndividual.showTableEntries(["sprite", "name+form", "types", "ability", "nature", "hpivev", "atkivev", "defivev", "spaivev", "spdivev", "speivev", "learntMoves", "balls"])
	setupIndividual.showGridEntries(["sprite"])
	const viewIndividual = new PokemonView()
	viewIndividual.onSave = () => stuff.localCollectionGroup.saveToLocalStorage()
	setupIndividual.view = (pokemon, collection) => viewIndividual.withPokemon(pokemon, collection)
	return [setup, setupIndividual]
}

function movesCollectionSetup() {
	const setup = new CollectionSetup()
	setup.allowAnythingFilter = false
	setup.defaultFilter = "name"
	setup.add("name", "Name")
	setup.add("type", "Type", { value: m => typeText(m.type) }, { options: stuff.data.typeNames, restricted: true })
	setup.add("category", "Category", {}, { options: ["Physical", "Special", "Status"], restricted: true })
	setup.add("power", "Power")
	setup.add("accuracy", "Accuracy")
	setup.add("pp", "PP")
	setup.add("priority", "Priority")
	setup.add("target", "Target")
	setup.add("gameDescription", "Game Description")
	setup.showTableEntries(["name", "type", "category", "power", "accuracy", "gameDescription"])
	setup.showGridEntries(["name", "type", "category", "power", "accuracy"])
	var setupPokemonMoves = new CollectionSetup()
	setupPokemonMoves.add("method", "Learned By", { value: learnMethodText },
		{ options: ["Level", "TM", "Egg", "Tutor"], specialQueries: { "level": (m) => m > 0 }, restricted: true })
	setupPokemonMoves.copyFrom(setup)
	setupPokemonMoves.showTableEntries(["method", "name", "type", "category", "power", "accuracy", "gameDescription"])
	setupPokemonMoves.showGridEntries(["method", "name", "type", "category", "power", "accuracy"])
	return [setup, setupPokemonMoves]
}

function sumStats(p) {
	var sum = 0
	for (var i in p.stats)
		sum += p.stats[i]
	return sum
}

class PokemonStuff {
	constructor(site) {
		this.site = site
		this.data = new PokemonData()
		this.state = new State()
		this.localCollectionGroup = new CollectionGroup("Local")
		this.collectionGroups = []
		this.load()
	}

	navThing() {
		return [
			new NavGroup("Game data",
				new NavEntry("Pokémon", () => {
					this.site.setCollection(this.data.pokemons, "pokemon")
					update()
				}, () => this.site.sections.collection.collection == this.data.pokemons),
				new NavEntry("Moves", () => {
					this.site.setCollection(this.data.movesList, "moves")
					update()
				}, () => this.site.sections.collection.collection == this.data.movesList)
			),
			...this.collectionGroups.map(group => new NavGroup(group.title,
				...Object.keys(group.tabs).map(title => {
					return new NavEntry(title, () => {
						this.site.setCollection(group.tabs[title].pokemons, "pokemonIndividuals")
						update()
					}, () => this.site.sections.collection.collection == group.tabs[title].pokemons)
				})
			)),
			new NavGroup(this.localCollectionGroup.title,
				...Object.keys(this.localCollectionGroup.tabs).map(title => {
					return new NavEntry(title, () => {
						this.site.setCollection(this.localCollectionGroup.tabs[title].pokemons, "pokemonIndividuals")
						update()
					}, () => this.site.sections.collection.collection == this.localCollectionGroup.tabs[title].pokemons)
				})
			),
			new NavGroup("Actions",
				new NavEntry("Export", () => {
					this.site.show(new ExportView(this.site))
				}),
				new NavEntry("Import", () => {
					this.site.show(new ImportView(this.site, (collection) => {
						this.localCollectionGroup.addTab("Imported", collection.map(e => new Pokemon(e)))
						this.site.setCollection(this.localCollectionGroup.tabs["Imported"].pokemons, "pokemonIndividuals")
						this.site.clearSelection()
						this.localCollectionGroup.saveToLocalStorage()
						update()
					}))
				})
			)
		].filter(e => e)
	}

	insertImported() {
		var index = this.collections.findIndex(e => e.title == "Imported")
		this.currentSetup.collection.push(...this.collections[index].collection)
		this.collections.splice(index, 1)
		this.site.engine.updateFilteredCollection()
		this.save()
		update()
	}

	load() {
		this.loadBaseData()
		this.loadCollectionData()
		//this.settings.load()
	}

	loadBaseData() {
		this.loadJSONData("pokemons")
		this.loadJSONData("moves")
		this.loadJSONData("abilities")
		this.loadJSONData("natures")
		this.loadJSONData("eggGroups", "egg-groups")
		requestJSON("./data-usum/types.json", (types) => {
			this.data.types = types
			this.data.typeNames = Object.keys(types)
			this.state.thingsLoaded.types = true
			this.tryLoad()
		})
	}

	loadJSONData(thing, file) {
		if (!file)
			file = thing
		requestJSON("./data-usum/" + file + ".json", (data) => {
			this.data[thing] = data
			this.state.thingsLoaded[thing] = true
			this.tryLoad()
		})
	}

	loadCollectionData() {
		if (!window.location.search)
			return
		const args = this.parseLocationSearch()
		//this.state.externalInventory.load = true
		for (let i in this.site.importMethods)
			if (i.toLowerCase() == args.type.toLowerCase()) {
				request("https://" + args.path, (response) => {
					this.loadData = () => {
						return {
							title: args.tab,
							collection: this.site.importMethods[i](response).map(e => new Pokemon(e))
						}
					}
					this.tryLoad()
				})
				return
			}
		requestJSON(getSpreadsheetUrl(argument), (response) => {
			this.state.spreadsheet = { id: argument, spreadsheet: response }
			this.tryLoad()
		})
	}

	parseLocationSearch() {
		const args = window.location.search.substring(1).split(":")
		if (args.length == 1)
			return { type: "sheet", path: args[0] }
		if (args.length == 2)
			return { type: args[0], path: args[1] }
		if (args.length == 3)
			return { type: args[1], path: args[2], tab: args[0] }
		return {}
	}

	tryLoad() {
		if (!this.state.thingsAreLoaded)
			return
		//dfs
		this.data.movesList = Object.keys(this.data.moves).map(key => this.data.moves[key])
		var moveSetups = movesCollectionSetup()
		site.addCollectionSetup("moves", moveSetups[0])
		site.addCollectionSetup("pokemonMoves", moveSetups[1])
		var pokemonSetups = pokemonCollectionSetup()
		site.addCollectionSetup("pokemon", pokemonSetups[0])
		site.addCollectionSetup("pokemonIndividuals", pokemonSetups[1])
		this.site.setCollection(this.data.pokemons, "pokemon")
		this.localCollectionGroup.loadFromLocalStorage()
		if (this.loadData) {
			const loaded = this.loadData()
			this.collectionGroups.push(new CollectionGroup("Loaded"))
			this.collectionGroups[0].addTab(loaded.title, loaded.collection)
		}
		if (this.state.externalInventory.load) {
			if (this.state.script)
				for (var i in this.optionsSection.importMethods) {
					if (i.toLowerCase() == this.state.script.type) {
						this.loadScript((content) => this.optionsSection.importMethods[i].method(content))
						break
					}
				}
			else if (this.state.spreadsheet)
				this.loadSpreadsheet()
			if (!this.state.externalInventory.isLoaded)
				return
		}
		this.state.loaded = true
		/*this.headerSection.setup()
		this.collection.loadLocalTabs()
		this.settings.loadLocalScript()*/
		update()
		/*if (!this.collection.pokemons.length && this.state.destination)
			this.selectPokemonBasedOn(this.state.destination)
		setInterval(() => { this.listSection.loadMoreWhenScrolledDown() }, 500)*/
	}

	selectPokemonBasedOn(destination) {
		for (var n in this.data.pokemons) {
			var pokemon = this.data.pokemons[n]
			var name = pokemon.name.toLowerCase().replace(" ", "-").replace("♀", "-f").replace("♂", "-m").replace("'", "").replace(".", "").replace("ébé", "ebe").replace(":", "")
			if (pokemon.id == destination || name == destination.toLowerCase()) {
				this.selectPokemon(pokemon)
				return
			}
		}
	}

	loadScript(parser) {
		var pokemons
		try {
			pokemons = parser(this.state.script.content)
		}
		catch (e) {
			document.getElementById("loading").innerHTML = "Failed to load external collection: " + e.message
			document.getElementById("loading").onclick = () => {
				this.state.externalInventory.load = false
				this.tryLoad()
			}
			return
		}
		this.state.script = undefined
		this.state.externalInventory.isLoaded = true
		if (!pokemons)
			return
		var tab = this.collection.addTab("Pokémon list", pokemons)
		this.selectTab(tab)
	}

	loadSpreadsheet() {
		this.spreadsheetParser.parse(this.state.spreadsheet)
		this.state.spreadsheet = undefined
	}
}


function requestJSON(url, callback) {
	request(url, function (response) {
		callback(JSON.parse(response))
	})
}

function request(url, callback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200)
				callback(xmlHttp.responseText)
			else {
				document.getElementById("loading").innerHTML = "Failed to load external data"
				document.getElementById("loading").onclick = () => {
					stuff.state.externalInventory.load = false
					stuff.tryLoad()
				}
			}
		}
	}
	xmlHttp.onerror = function () {
		document.getElementById("loading").innerHTML = "Failed to load external data"
		document.getElementById("loading").onclick = () => {
			stuff.state.externalInventory.load = false
			stuff.tryLoad()
		}
	}
	xmlHttp.open("GET", url, true)
	xmlHttp.send()
}