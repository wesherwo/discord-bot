const fs = require("fs");
//user settings
const settings = JSON.parse(fs.readFileSync("settings.json"));
const token = settings["token"];
var prefix = settings["prefix"];
//admin command setings
const adminCommands = settings["admincommands"];
const settingCommands = ["addadmincommand", "removeadmincommand", "setprefix", "enablemodule", "disablemodule"];

exports.token = token;
exports.prefix = () => {
	return prefix;
}

exports.commands = {
	"admincommands": (msg) => {
		printAdminCommands(msg);
	},
	"addadmincommand": (msg) => {
		addAdminCommand(msg);
	},
	"removeadmincommand": (msg) => {
		removeAdminCommand(msg);
	},
	"setprefix": (msg) => {
		setPrefix(msg);
	},
	"modules": (msg) => {
		printModules(msg);
	},
	"enablemodule": (msg) => {
		enableModule(msg);
	},
	"disablemodule": (msg) => {
		disableModule(msg);
	},
	"settingshelp": (msg) => {
		getSettingsHelp(msg);
	}
};

exports.getHelp = () => {
	return [{ name: prefix + "settingshelp", value: "Setting commands." }];
}

function getSettingsHelp(msg) {
	let tosend = {
		embed: {
			color: 3447003,
			title: "List of commands",
			fields: []
		}
	};
	tosend.embed.fields = [{ name: prefix + "admincommands", value: "Displays the commands with admin privileges." },
	{ name: prefix + "modules", value: "Shows modules." }];
	tosend.embed.fields = tosend.embed.fields.concat(getSettingsPermissions());
	tosend.embed.fields = tosend.embed.fields.concat(
		[{ name: prefix + "addadmincommand [command] [role]", value: "Add a role requirement to a command." },
		{ name: prefix + "removeadmincommand [command] [role]", value: "remove a role requirement from a command." },
		{ name: prefix + "setprefix [new prefix]", value: "change the pefix." },
		{ name: prefix + "enablemodule [module name]", value: "Enable a module." },
		{ name: prefix + "disablemodule [module name]", value: "Disable a module." }]);
	msg.channel.send(tosend);
}

//used to check if user has required role for commands
exports.hasRole = (msg, command) => {
	if (this.isSetting(command)) {
		command = "settings";
	}
	if (!adminCommands.hasOwnProperty(command)) {
		return true;
	}
	for (var i = 0; i < adminCommands[command].length; i++) {
		var adminId = msg.guild.roles.find(x => x.name === adminCommands[command][i]).id;
		if (msg.member.roles.has(adminId)) {
			return true;
		}
	}
	msg.channel.send("You do not have access to this");
	return false;
}

exports.isSetting = (command) => {
	return settingCommands.indexOf(command) != -1;
}

exports.isDisabled = (moduleName) => {
	return settings.disabledmodules.indexOf(moduleName) != -1;
}

function getSettingsPermissions() {
	let s = "";
	if (adminCommands.hasOwnProperty("settings")) {
		if (adminCommands["settings"].length > 0) {
			s = "Must be a " + adminCommands["settings"][0]
			for (var i = 1; i < adminCommands["settings"].length - 1; i++) {
				s += ", " + adminCommands["settings"][i];
			}
			if (adminCommands["settings"].length > 2) {
				s += ",";
			}
			if (adminCommands["settings"].length > 1) {
				s += " or " + adminCommands["settings"][adminCommands["settings"].length - 1];
			}
		}
	}
	return [{ name: "\u200b", value: "--------------------" },
	{ name: "Roles: " + s, value: "\u200b" }];
}

//save current settings
function saveSettings() {
	var jsonSettings = JSON.parse(fs.readFileSync("settings.json"));
	jsonSettings.prefix = prefix;
	jsonSettings.admincommands = adminCommands;
	jsonSettings.disabledmodules = settings.disabledmodules;
	jsonSettings = JSON.stringify(jsonSettings);
	fs.writeFileSync("settings.json", jsonSettings, function (err) { if (err) { console.log(err); } });
}

function printAdminCommands(msg) {
	let tosend = {
		embed: {
			color: 3447003,
			title: "List of commands",
			fields: []
		}
	};
	for (var cmd in adminCommands) {
		if (cmd == "settings") {
			for (var cmdset in settingCommands) {
				tosend.embed.fields.push({ name: "" + prefix + cmdset, value: addAdminCommand[cmd].sort().toString() });
			}
		} else {
			tosend.embed.fields.push({ name: "" + prefix + cmd, value: adminCommands[cmd].sort().toString() });
		}
	}
	msg.channel.send(tosend);
}

//adds roles or makes commands admin commands
function addAdminCommand(msg) {
	var command = msg.content.toLowerCase().slice(prefix.length).split(" ")[1];
	var role = msg.content.slice(prefix.length).split(" ")[2];
	if (!commands.hasOwnProperty(command)) {
		msg.channel.send("Command not found.");
		return;
	}
	if (msg.guild.roles.find(x => x.name === role) == undefined) {
		msg.channel.send("Role not found.");
		return;
	}
	if (settingCommands.find(command) != -1) {
		command = "settings";
		msg.channel.send("WARNING!  Careful with permissions for this setting!  Changing this changes other permissions as well.");
	}
	if (adminCommands.hasOwnProperty(command)) {
		if (adminCommands[command].indexOf(role) == -1) {
			adminCommands[command].push(role);
		} else {
			msg.channel.send("Role already has this permission.");
			return;
		}
	} else {
		adminCommands[command] = [role];
	}
	saveSettings();
}

//removes roles or commands form admin commands
function removeAdminCommand(msg) {
	var command = msg.content.toLowerCase().slice(prefix.length).split(" ")[1];
	var role = msg.content.slice(prefix.length).split(" ")[2];
	if (!commands.hasOwnProperty(command)) {
		msg.channel.send("Command not found.");
		return;
	}
	if (msg.guild.roles.find(x => x.name === role) == undefined) {
		msg.channel.send("Role not found.");
		return;
	}
	if (settingCommands.find(command) != -1) {
		command = "settings";
		msg.channel.send("WARNING!  Careful with permissions for this setting!  Changing this changes other permissions as well.");
	}
	if (adminCommands.hasOwnProperty(command)) {
		var i = adminCommands[command].indexOf(role);
		if (i != -1) {
			adminCommands[command].splice(i, 1);
			if (adminCommands[command].length == 0) {
				delete adminCommands[command];
			}
		} else {
			msg.channel.send("Role did not have permission.");
		}
	} else {
		msg.channel.send("Role did not have permission.");
	}
	saveSettings();
}

function setPrefix(msg) {
	prefix = msg.content.toLowerCase().slice(prefix.length).split(" ")[1];
	msg.channel.send("The prefix has been changed.");
	saveSettings();
}

function moduleExists(moduleName) {
	try {
		if (fs.existsSync("./src/modules/" + moduleName + ".js")) {
			return true;
		}
	} catch (err) {
	}
	return false;
}

function printModules(msg) {
	let tosend = {
		embed: {
			color: 3447003,
			title: "List of modules",
			description: ""
		}
	};
	let modules = "";
	fs.readdir("./src/modules/", function (err, files) {
		files.forEach(function (mod) {
			if (mod.endsWith(".js")) {
				modules += mod.slice(0, -3);
				if(settings.disabledmodules.includes(mod.slice(0, -3))) {
					modules += " disabled";
				} else {
					modules += " enabled";
				}
				modules += "\n";
			}
		});
		tosend.embed.description = modules;
		msg.channel.send(tosend);
	});
}

function enableModule(msg) {
	let moduleName = msg.content.split(" ")[1];
	if (moduleExists(moduleName)) {
		settings.disabledmodules = settings.disabledmodules.filter(x => x != moduleName);
		msg.channel.send("Module enabled.");
		saveSettings();
		return;
	}
	msg.channel.send("Could not find module.");
}

function disableModule(msg) {
	let moduleName = msg.content.split(" ")[1];
	if (moduleExists(moduleName)) {
		settings.disabledmodules.push(moduleName);
		msg.channel.send("Module disabled.");
		saveSettings();
		return;
	}
	msg.channel.send("Could not find module.");
}