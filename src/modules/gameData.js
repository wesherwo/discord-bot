const Discord = require('discord.js');
const fs = require('fs');
var bot;
var prefix;
var gameData = {};
const path = "SaveData/savedata.json";
const settings = JSON.parse(fs.readFileSync("Resources/ModuleResources/gameData.json"));
const ignoreGames = settings["ignoreGames"];
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

function runEachMin() {
	calcGameData(bot.channels.array()[0].guild.members.array());
	setTimeout(runEachMin, 60000);
}

function calcGameData(ppl) {
    for (var i = 0; i < ppl.length; i++) {
        game = ppl[i].user.presence.game;
        if (game != null) {
            var name = game.name;
            if(name == "MapleStory2"){
                name = "MapleStory 2";
            }
            if(name == "Tom Clancy's Rainbow Six Siege"){
                name = "Rainbow Six Siege";
            }

            if (!gameData.hasOwnProperty(name)) {
                gameData[name] = 1;
            } else {
                gameData[name]++;
            }
        }
    }
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
        return "No data yet.";
    }
    var max = sorted[0][1];

    let s = '';
    let tosend = {
		embed: {
			color: 3447003,
			title: "Bot running for " + printTime(data.time),
			fields: []
		}
    };
    let page = 2;
    for (var i = 0; i < sorted.length; i++) {
        if (ignoreGames.indexOf(sorted[i][0]) == -1) {
            s = "";
            for (var j = 0; (j < (sorted[i][1] / max) * 40) || (j < 1); j++) {
                s += String.fromCharCode(10074);
            }
            tosend.embed.fields.push({name:sorted[i][0] + " - played for " + printTime(sorted[i][1]),value:s});
            if(i % 25 == 0){
                msg.channel.send(tosend);
                tosend.embed.title = "page " + page;
                page++;
                tosend.embed.fields = [];
            }
        }
    }
    msg.channel.send(tosend);
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