const { Discord, Client, Intents, MessageEmbed } = require("discord.js");
const fs = require("fs");
//bot reference
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
	Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_VOICE_STATES] });
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
		startModules();
		for (var cmd in settings.commands) {
			commands[cmd] = settings.commands[cmd];
		}
		modules.forEach(function (mod) {
			for (var cmd in mod.commands) {
				commands[cmd] = mod.commands[cmd];
			}
		});
		settings.updateCommands(commands);
	});
}

function startModules() {
	modules.forEach(function (mod) {
		if (typeof mod.startup !== "undefined") {
			mod.startup();
		}
	});
}

bot.on("messageCreate", msg => {
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

function getHelp(msg) {
	let embed = new MessageEmbed();
    embed.setColor(3447003).setTitle("List of commands");
	modules.forEach(function (mod) {
		if (typeof mod.getHelp !== "undefined") {
			embed.addFields(mod.getHelp());
		}
	});
	embed.addFields(settings.getHelp());
	msg.channel.send({embeds: [embed]});
}

bot.login(settings.token);
settings.setSettingRefs({
	"bot": bot
});