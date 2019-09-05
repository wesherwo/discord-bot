const Discord = require("discord.js");
const fs = require("fs");
//bot reference
const bot = new Discord.Client();
//user settings
const settings = require("./src/settings.js");

var modules = [];
//path to modules
const modulePath = "./src/modules/";

//avalible commands
var commands;

bot.on("ready", () => {
	updateModules();
	console.log("Bot Running");
});

function updateModules() {
	modules.forEach(function (mod) {
		if (typeof mod.stop !== "undefined") {
			mod.stop();
		}
	});
	modules = [];
	commands = {
		"help": (msg) => {
			getHelp(msg);
		}
	};
	fs.readdir(modulePath, function (err, files) {
		files.forEach(function (mod) {
			if (mod.endsWith(".js") && !settings.isDisabled(mod.slice(0, -3))) {
				modules.push(require(modulePath + mod));
			}
		});
		modules.forEach(function (mod) {
			if (typeof mod.setRefs !== "undefined") {
				mod.setRefs({
					"bot": bot,
					"prefix": settings.prefix()
				});
			}
		});
	});
	startModules();
	for (var cmd in settings.commands) {
		commands[cmd] = settings.commands[cmd];
	}
	modules.forEach(function (mod) {
		for (var cmd in mod.commands) {
			commands[cmd] = mod.commands[cmd];
		}
	});
}

function startModules() {
	modules.forEach(function (mod) {
		if (typeof mod.startup !== "undefined") {
			mod.startup();
		}
	});
}

bot.on("message", msg => {
	if (!msg.content.startsWith(settings.prefix())) return;
	command = msg.content.toLowerCase().slice(settings.prefix().length).split(" ")[0];
	if (commands.hasOwnProperty(command)) {
		if (settings.hasRole(msg, command)) {
			commands[msg.content.toLowerCase().slice(settings.prefix().length).split(" ")[0]](msg);
			if (settings.isSetting(command)) {
				updateModules();
			}
		}
	}
});

bot.login(settings.token);

function getHelp(msg) {
	let tosend = {
		embed: {
			color: 3447003,
			title: "List of commands",
			fields: []
		}
	};
	modules.forEach(function (mod) {
		if (typeof mod.getHelp !== "undefined") {
			tosend.embed.fields = tosend.embed.fields.concat(mod.getHelp());
		}
	});
	tosend.embed.fields = tosend.embed.fields.concat(settings.getHelp());

	msg.channel.send(tosend);
}