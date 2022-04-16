const { MessageEmbed, MessageAttachment } = require('discord.js');
const fs = require('fs');
var bot;
var prefix;
const settings = JSON.parse(fs.readFileSync("Resources/ModuleResources/tournyMaker.json"));

const defaultChannel = settings["defaultChannel"];

var players = [];
var teams = [];
var teamNames = [];
var teamImg = [];
var matches = [];
var teamsScore = -1;
var teamNum = 0;
var subsNum = 0;

var playersPerTeam = 1;
var minMMR = 0;
var maxMMR = 1;

var teamsCreated = false;
var matchesCreated = false;

var joinMsgs = settings["joinMsgs"];
var leaveMsgs = settings["leaveMsgs"];

var Icons = JSON.parse(fs.readFileSync("Resources/Images/DefaultImages.json")).images;

exports.commands = {
	"join": (msg) => {
		join(msg);
	},
	"leave": (msg) => {
		leave(msg);
	},
	"kick": (msg) => {
		kick(msg);
	},
	"players": (msg) => {
		printPlayers(msg);
	},
	"maketeams": (msg) => {
		makeTeams(msg);
		makeChannels(msg);
	},
	"teams": (msg) => {
		printTeams(msg);
	},
	"teamstats": (msg) => {
		printTeamData(msg);
	},
	"makematches": (msg) => {
		makeMatches(msg);
	},
	"matches": (msg) => {
		printMatches(msg);
	},
	"teamname": (msg) => {
		nameTeam(msg);
	},
	"teamicon": (msg) => {
		changeIcon(msg);
	},
	"test": (msg) => {
		testTeams(msg);
	},
	"clear": () => {
		clear();
	},
	"moveplayers": (msg) => {
		movePlayers(msg);
	},
	"tournytype": (msg) => {
		clear();
		tournyType(msg);
	},
	"tournypresets": (msg) => {
		presets(msg);
	},
	"setplayers": (msg) => {
		setPlayers(msg);
	},
	"setminmmr": (msg) => {
		setMinMMR(msg);
	},
	"setmaxmmr": (msg) => {
		setMaxMMR(msg);
	},
	"tournyinfo": (msg) => {
		currentSettings(msg);
	},
	"tournyhelp": (msg) => {
		let tosend = {embed: {
			color: 3447003,
			title: "List of commands",
			fields: []
		  }
		};
		tosend.embed.fields = [{name:prefix + "Join [MMR]",value:" Join tournament"},
			{name:prefix + "Leave",value:"Leave tournament"},
			{name:prefix + "TeamName",value:"Name your team"},
			{name:prefix + "TeamIcon [link](.png or .jpg)",value:"Set the icon for your team"},
			{name:prefix + "Players",value:"Players in tournament"},
			{name:prefix + "Teams",value:"Shows teams for the tournament"},
			{name:prefix + "TeamStats",value:"Shows stats for teams"},
			{name:prefix + "Matches",value:"Shows matches for the tournament"},
			{name:prefix + "MakeTeams",value:"Put players into teams"},
			{name:prefix + "MakeMatches [type]",value:"Make matches and channels for the tournament (type = single, double, round)"},
			{name:prefix + "MovePlayers",value:"Moves players to their team channels"},
			{name:prefix + "Clear",value:"Clear player list and remove generated channels"},
			{name:prefix + "Kick [name]",value:"kick from the tournament"},
			{name:prefix + "tournypresets",value:"Displays presets for tournaments"},
			{name:prefix + "tournytype [preset]",value:"Sets tournament settings to a preset"},
			{name:prefix + "setplayers",value:"Sets the amount of players for each team"},
			{name:prefix + "setminmmr",value:"Sets the minimum mmr"},
			{name:prefix + "setmaxmmr",value:"Sets the maximum mmr"},
			{name:prefix + "tournyinfo",value:"Displays current settings for the tournament"}];
		msg.channel.send(tosend);
	}
}

exports.setRefs = (refs) => {
	bot = refs.bot;
	prefix = refs.prefix;
}

exports.getHelp = () => {
	return [{name:prefix + "tournyhelp",value:"Tournament maker commands"}];
}

function presets(msg) {
	let s = [];
	s.push('```xl');
	for (var i = 0; i < settings.presets.length; i++) {
		s.push(settings.presets[i].name + ' - Players: ' + settings.presets[i].players + ', MMR range: ' + settings.presets[i].min + ' - ' + settings.presets[i].max);
	}
	s.push('```');
	msg.channel.send(s.join('\n'));
}

function tournyType(msg) {
	let type = msg.content.substring(12);
	for (var i = 0; i < settings.presets.length; i++) {
		if(settings.presets[i].name.toLowerCase() == type.toLowerCase()){
			playersPerTeam = settings.presets[i].players;
			minMMR = settings.presets[i].min;
			maxMMR = settings.presets[i].max;
			if(settings.presets[i].hasOwnProperty("icons")) {
				Icons = JSON.parse(fs.readFileSync(settings.presets[i].icons)).images;
			}
			msg.channel.send('Preset loaded.');
			return;
		}
	}
	msg.channel.send('Could not find preset.');
}

function setPlayers(msg) {
	playersPerTeam = parseInt(msg.content.split(' ')[1]);
	iconPath = 'Resources/DefaultImages/';
	msg.channel.send('Players per team set to ' + playersPerTeam);
}

function setMinMMR(msg) {
	minMMR = parseInt(msg.content.split(' ')[1]);
	iconPath = 'Resources/DefaultImages/';
	msg.channel.send('Min MMR set to ' + minMMR);
}

function setMaxMMR(msg) {
	maxMMR = parseInt(msg.content.split(' ')[1]);
	iconPath = 'Resources/DefaultImages/';
	msg.channel.send('Max MMR set to ' + maxMMR);
}

function currentSettings(msg) {
	msg.channel.send('Players: ' + playersPerTeam + ', MMR range: ' + minMMR + ' - ' + maxMMR);
}

function scoreTeams(plrs) {
	var tempTeams = [];
	var teamMMR = [];
	//make the teams and get avg MMR
	for (var i = 0; i < teamNum; i++) {
		var tempTeam = [];
		var avgMMR = 0;
		for (var j = 0; j < playersPerTeam; j++) {
			tempTeam.push(plrs[i + (j * teamNum)]);
			avgMMR += plrs[i + (j * teamNum)][1];
		}
		tempTeams.push(tempTeam);
		teamMMR.push(avgMMR / playersPerTeam);
	}
	//score the current teams based on MMR
	var MMRScore = 0;
	var n = 0;
	for (var i = 0; i < teamNum; i++) {
		for (var j = i; j < teamNum; j++) {
			if (i != j) {
				MMRScore += Math.abs(teamMMR[i] - teamMMR[j]);
				n++;
			}
		}
	}
	//given a better score sets new lineup
	if (teamsScore > MMRScore || teamsScore < 0) {
		teams = [];
		//subs
		for (var i = 1; i <= subsNum; i++) {
			tempTeams[i % teamNum].push(plrs[plrs.length - i]);
		}
		for (var i = 0; i < tempTeams.length; i++) {
			teams.push(tempTeams[i]);
		}
		teamsScore = MMRScore;
	}
}

function randomShuffle(plrs) {
	var j, x, i;
	for (var i = plrs.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = plrs[i];
		plrs[i] = plrs[j];
		plrs[j] = x;
	}
	scoreTeams(plrs);
}

function makeTeams(msg) {
	teamsCreated = true;
	var j, x, i;
	for (var i = Icons.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = Icons[i];
		Icons[i] = Icons[j];
		Icons[j] = x;
	}
	teams = [];
	teamNames = [];
	teamImg = [];
	teamNum = Math.floor(players.length / playersPerTeam);
	subsNum = players.length - (teamNum * playersPerTeam);
	teamsScore = -1;
	for (var i = 0; i < 1000 * teamNum * teamNum; i++) {
		randomShuffle(players);
	}
	for (var i = 0; i < teamNum; i++) {
		teamNames.push('Team' + (i + 1));
		teamImg.push(Icons[i % Icons.length]);
	}
	msg.channel.send(teamNum + ' Teams have been created');
}

function makeChannels(msg) {
	for (var i = 0; i < teams.length; i++) {
		if (bot.channels.cache.array()[teamNames[i]] == undefined) {
			//msg.guild.channels.create(teamNames[i], {type:"voice"});
		}
	}
}

function makeMatches(msg) {
	let type = msg.content.split(' ')[1];
	if (type == 'single') {
		singleElimination(teamNames, 0);
	} else if (type == 'double') {
		doubleElimination(teamNames, [], 0, 0);
	} else if(type == 'round') {
		roundRobin(teamNames, 0);
	} else {
		msg.channel.send('Not a tournament type');
		return;
	}
	matchesCreated = true;
}

function singleElimination(teams, games) {
	if(teams.length == 2){
		matches.push([teams[0], teams[1]]);
	} else {
		for(var i = 0; i < teams.length; i += 2) {
			matches.push([teams[i], teams[i+1]]);
		}
		var newTeams = [];
		if(teams.length % 2 == 1){
			newTeams.push(teams[teams.length - 1]);
		}
		for(var i = games; i < matches.length; i++) {
			newTeams.push('Winner of Game' + (games + i));
		}
		singleElimination(newTeams, matches.length);
	}
}

function doubleElimination(winners, losers, upperGames, lowerGames) {
	if(winners.length == 1){
		matches.push([winners[0], losers[0]]);
	} else {
		newLowerGames = lowerGames;
		for(var i = 0; i < losers.length; i += 2) {
			matches.push([losers[i], losers[i+1]]);
			newLowerGames++;
		}
		var newLosers = [];
		if(teams.length % 2 == 1){
			newLosers.push(losers[losers.length - 1]);
		}
		for(var i = lowerGames; i < newLowerGames; i++) {
			newLosers.push('Winner Lower Game' + (lowerGames + i));
		}

		newUpperGames = upperGames;
		for(var i = 0; i < winners.length; i += 2) {
			matches.push([winners[i], winners[i+1]]);
			newUpperGames++;
		}
		var newWinners = [];
		if(teams.length % 2 == 1){
			newWinners.push(winners[winners.length - 1]);
		}
		for(var i = upperGames; i < newUpperGames; i++) {
			newWinners.push('Winner Upper Game' + (upperGames + i));
			newLosers.splice((i*2+1),0,'Loser of Upper Game'(upperGames + i));
		}
		doubleElimination(newWinners, newLosers, newUpperGames, newLowerGames);
	}
}

function roundRobin(teams, rounds) {
	if(teams.length % 2 != 0){
		teams.push(null);
	}
	var half = teams.length/2;
	for(var i = 0; i < half; i++) {
		matches.push([teams[i], teams[i + half]]);
	}
	var temp1 = teams.shift();
	var temp2 = teams.pop();
	teams.unshift(temp1, temp2);
	if(rounds < teams.length - 1){
		roundRobin(teams, rounds + 1);
	}
}

function printMatches(msg) {
	if (!matchesCreated) {
		msg.channel.send('Matches have not been made');
		return;
	}
	let s = '';
	let toSend = [];
	toSend.push('```xl');
	for (var i = 0; i < matches.length; i++) {
		s = '';
		s += 'Game' + (i + 1) + ' - ' + matches[i][0] + ' vs ' + matches[i][1] + '\n';
		toSend.push(s);
	}
	toSend.push('```');
	msg.channel.send(toSend.join('\n'));
}

function printTeams(msg) {
	if (!teamsCreated) {
		msg.channel.send('Teams have not been made');
		return;
	}
	for (var i = 0; i < teamNum; i++) {
		msg.channel.send(makeTeamEmbed(i));
	}
}

function printTeamData(msg) {
	let s = '';
	let toSend = [];
	toSend.push('```xl');
	for (var i = 0; i < teamNum; i++) {
		s = '';
		s += teamNames[i] + ' - ';
		var avgMMR = 0;
		for (var j = 0; j < teams[i].length; j++) {
			s += teams[i][j][0];
			if (j < teams[i].length - 1) {
				s += ', ';
			}
			avgMMR += teams[i][j][1];
		}
		toSend.push(s);
		toSend.push(Math.floor((avgMMR / playersPerTeam)));
	}
	toSend.push('```');
	msg.channel.send(toSend.join('\n'));
}

function printPlayers(msg) {
	if (players.length == 0) {
		msg.channel.send('No players have entered');
		return;
	}
	players.sort(function (a, b) { return a[0].localeCompare(b[0]) });
	let s = [];
	s.push('```xl');
	s.push(players.length + ' Players');
	for (var i = 0; i < players.length; i++) {
		s.push(players[i][0] + ' - ' + players[i][1]);
	}
	s.push('```');
	msg.channel.send(s.join('\n'));
}

function join(msg) {
	let rank = parseInt(msg.content.split(' ')[1]);
	if (parseInt(rank) > maxMMR || parseInt(rank) < minMMR) {
		msg.channel.send('Not a Valid MMR');
		return;
	}
	let name = msg.author.username;
	let player = [name, rank, msg.member];
	for (var i = 0; i < players.length; i++) {
		if (players[i][0] == player[0]) {
			msg.channel.send('You are already signed up');
			return;
		}
	}
	players.push(player);
	msg.channel.send(name + joinMsgs[Math.floor(Math.random() * joinMsgs.length)]);
}

function leave(msg) {
	let name = msg.author.username;
	for (var i = 0; i < players.length; i++) {
		if (players[i][0] == name) {
			msg.channel.send(name + leaveMsgs[Math.floor(Math.random() * leaveMsgs.length)]);
			players.splice(i, 1);
			return;
		}
	}
	msg.channel.send('You are not in the tournament');
}

function kick(msg) {
	let name = msg.content.split(' ')[1];
	for (var i = 0; i < players.length; i++) {
		if (players[i][0] == name) {
			msg.channel.send(name + leaveMsgs[Math.floor(Math.random() * leaveMsgs.length)]);
			players.splice(i, 1);
			return;
		}
	}
	msg.channel.send(name + ' is not in the tournament');
}

function nameTeam(msg) {
	let s = '';
	let newName = msg.content.split(' ')[1];
	for (var i = 0; i < teamNum; i++) {
		for (var j = 0; j < teams[i].length; j++) {
			if (teams[i][j][0] == msg.author.username) {
				s += teamNames[i] + ' renamed to ' + newName;
				teamNames[i] = newName;
				msg.channel.send(s);
				return;
			}
		}
	}
	msg.channel.send('Could not rename team');
}

function changeIcon(msg) {
	let newIcon = msg.content.split(' ')[1];
	for (var i = 0; i < teamNum; i++) {
		for (var j = 0; j < teams[i].length; j++) {
			if (teams[i][j][0] == msg.author.username) {
				teamImg[i] = newIcon;
				msg.channel.send('Icon changed');
				return;
			}
		}
	}
	msg.channel.send('Could not change team icon');
}

function makeTeamEmbed(t) {
	let s = '';
	for (var j = 0; j < teams[t].length; j++) {
		s += teams[t][j][0];
		if (j < teams[t].length - 1) {
			s += ', ';
		}
	}
	let embed = new MessageEmbed();
	embed.setColor(13632027)
		.setDescription(s)
		.setThumbnail(teamImg[t])
		.setAuthor(teamNames[t], teamImg[t]);
	return embed;
}

function clear() {
	let defaultChannelID = bot.channels.cache.array().find(chan => chan.name === defaultChannel);
	let chans = [];
	for (var i = 0; i < teams.length; i++) {
		let chan = bot.channels.cache.array().find(chan => chan.name === teamNames[i]);
		if (chan != null) {
			chans.push(chan);
		}
	}
	for (var i = 0; i < teams.length; i++) {
		for (var j = 0; j < teams[i].length; j++) {
			if (teams[i][j][3] != null) {
				for (var k = 0; k < chans.length; k++) {
					if (chans[k] == teams[i][j][3].voiceChannel) {
						teams[i][j][3].voice.setChannel(defaultChannelID);
					}
				}
			}
		}
	}
	players = [];
	teams = [];
	teamNames = [];
	teamImg = [];
	matches = [];
	teamsScore = -1;
	teamNum = 0;
	subsNum = 0;
	teamsCreated = false;
	matchesCreated = false;
	for (var i = 0; i < chans.length; i++) {
		chans[i].delete();
	}
}

function movePlayers() {
	for (var i = 0; i < teams.length; i++) {
		let chan = bot.channels.chach.array().find(chan => chan.name === teamNames[i]);
		for (var j = 0; j < teams[i].length; j++) {
			if (teams[i][j][2] != null) {
				teams[i][j][2].voice.setChannel(chan);
				console.log('Moved!');
			}
		}
	}
}

function testTeams(msg) {
	clear();
	msg2 = msg;
	msg2.content = "!tournytype rocket league 3s";
	tournyType(msg2);
	var num = playersPerTeam * 2;
	var name = '';
	var rank = -1;
	for (var i = 0; i < num; i++) {
		name = 'Player' + i;
		rank = Math.floor(Math.random() * maxMMR);
		players.push([name, rank, null]);
	}
	msg.channel.send('Test teams created!');
	makeTeams(msg);
	makeChannels(msg);
	printTeams(msg);
}