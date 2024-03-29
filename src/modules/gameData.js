const { Discord, MessageEmbed} = require('discord.js');
const fs = require('fs');
var bot;
var prefix;
var gameData = {};
const path = "SaveData/savedata.json";
const settings = JSON.parse(fs.readFileSync("Resources/ModuleResources/gameData.json"));
const ignoreGames = settings["ignoreGames"];
var stopped = false;
setTimeout(runEachMin, 60000);

exports.commands = {
    "games": (msg) => {
		printGameData(msg);
	},
	"resetgames": (msg) => {
		resetData(msg);
	}
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.getHelp = () => {
    return [{name:prefix + "games",value:"Game stats for the server."},
    {name:prefix + "resetgames",value:"Reset the game stats for the server."}];
}

exports.stop = () => {
    stopped = true;
}

function runEachMin() {
    calcGameData(bot.guilds.cache.at(0).presences.cache);
    if(!stopped){
        setTimeout(runEachMin, 60000);
    }
}

function calcGameData(ppl) {
    ppl.each(user => games = user.activities.forEach(game => {
        if (game.type == "PLAYING") {
            var name = game.name;
            if (!gameData.hasOwnProperty(name)) {
                gameData[name] = 1;
            } else {
                gameData[name]++;
            }
        }
    }));
    var data = JSON.parse(fs.readFileSync(path));
    for (var i in gameData) {
        if (!data.gametime.hasOwnProperty(i)) {
            data.gametime[i] = gameData[i];
        } else {
            data.gametime[i] += gameData[i];
        }
    }
    data.time++;
    var jsonData = JSON.stringify(data);
    fs.writeFileSync(path, jsonData, function (err) { if (err) { console.log(err); } });
    gameData = {};
}

function printGameData(msg) {
    var data = JSON.parse(fs.readFileSync(path));
    var sorted = [];
    for(var game in data.gametime){
        sorted.push([game,data.gametime[game]]);
    }
    sorted.sort(function (a,b) { return b[1] - a[1]});
    if(sorted.length == 0){
        msg.channel.send("No data yet.");
        return;
    }
    var max = sorted[0][1];

    var s = "";
    let embed = new MessageEmbed();
    embed.setColor(3447003).setTitle("Bot running for " + printTime(data.time));
    var page = 1;
    for (var i = 0; i < sorted.length; i++) {
        if (ignoreGames.indexOf(sorted[i][0]) == -1) {
            s = "";
            for (var j = 0; (j < (sorted[i][1] / max) * 40) || (j < 1); j++) {
                s += String.fromCharCode(10074);
            }
            embed.addField(sorted[i][0] + " - played for " + printTime(sorted[i][1]), s);
        }
        if((embed.fields.length % 20 == 0 || i == sorted.length - 1) && embed.fields.length > 0){
            msg.channel.send({embeds: [embed]});
            page++;
            embed = new MessageEmbed();
            embed.setColor(3447003).setTitle("page " + page);
        }
    }
}

function resetData(msg) {
    var jsonData = JSON.stringify({ "time": 0, "gametime": {} });
    fs.writeFileSync(path, jsonData, function (err) { if (err) { console.log(err); } });
    msg.channel.send("Game stats reset.");
}

function printTime(time) {
    var hours = parseInt(time / 60);
    var minutes = time % 60;
    return hours + "hr" + minutes + "min";
}