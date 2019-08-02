const Discord = require("discord.js");
const fs = require("fs");
//bot reference
const bot = new Discord.Client();
//user settings
const settings = require("./src/settings.js");

const modules = [];
//path to modules
const modulePath = "./src/modules/";

bot.on("ready", () => {
	setUp();
	console.log("Bot Running");
});

function setUp() {
	//configure modules
	fs.readdir(modulePath, function (err, files) {
		files.forEach(function (mod) {
			if (mod.endsWith(".js"))
				modules.push(require(modulePath + mod));
		});
		updateModules();
		for (var cmd in settings.commands) {
			commands[cmd] = settings.commands[cmd];
		}
		modules.forEach(function (mod) {
			for (var cmd in mod.commands) {
				commands[cmd] = mod.commands[cmd];
			}
		});
	});
}

function updateModules() {
	modules.forEach(function (mod) {
		if (typeof mod.setRefs !== "undefined") {
			mod.setRefs({
				"bot": bot,
				"prefix": settings.prefix()
			});
		}
	});
}

//avalible commands
const commands = {
	"help": (msg) => {
		getHelp(msg);
	}
};

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