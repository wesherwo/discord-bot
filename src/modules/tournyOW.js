const fs = require('fs');
const { MessageEmbed } = require('discord.js');
var bot;
var prefix;
const settings = JSON.parse(fs.readFileSync("Resources/ModuleResources/tournyOW.json"));

const defaultChannel = settings["defaultChannel"];

var players = [];
var teams = [];
var teamNames = [];
var teamImg = [];
var imgDefault = [];
var matches = [];
var teamsScore = 0;
var teamNum = 0;
var subsNum = 0;

var roleWeight = 1;
var scoreWeight = 1;
var totalWeight = 0;

var teamsCreated = false;
var matchesCreated = false;

var defaultIcon = "https://cdn.discordapp.com/embed/avatars/0.png";

var assault = settings["assault"];
var escort = settings["escort"];
var hybrid = settings["hybrid"];
var control = settings["control"];
var maps = [assault, escort, hybrid, control];

var joinMsgs = settings["joinMsgs"];
var leaveMsgs = settings["leaveMsgs"];

//Change later
var OWLIcons = JSON.parse(fs.readFileSync("Resources/Images/DefaultImages.json")).images;

exports.commands = {
	"owjoin": (msg) => {
		join(msg);
	},
	"owleave": (msg) => {
		leave(msg);
	},
	"owkick": (msg) => {
		kick(msg);
	},
	"owplayers": (msg) => {
		printPlayers(msg);
	},
	"owmaketeams": (msg) => {
		makeTeams(msg);
		makeChannels(msg);
	},
	"owteams": (msg) => {
		printTeams(msg);
	},
	"owteamstats": (msg) => {
		printTeamData(msg);
	},
	"owmakematches": (msg) => {
		makeMatches();
	},
	"owmatches": (msg) => {
		printMatches(msg);
	},
	"owonematch": (msg) => {
		oneMatch(msg);
	},
	"owteamname": (msg) => {
		nameTeam(msg);
	},
	"owteamicon": (msg) => {
		changeIcon(msg);
	},
	"owtie": (msg) => {
		tie(msg);
	},
	"owtest": (msg) => {
		testTeams(msg);
	},
	"owclear": (msg) => {
		clear();
	},
	"owmoveplayers": (msg) => {
		movePlayers(msg);
	},
	"owhelp": (msg) => {
		let embed = new MessageEmbed();
    	embed.setColor(3447003).setTitle("List of commands").addFields(
			[{name:prefix + "games",value:"Game stats for the server."},
			{name:prefix + "resetgames",value:" Reset the game stats for the server."},
			{name:prefix + "Join [SR] [Role]",value:" Join tournament(Roles = dps, tank, heal, flex)"},
			{name:prefix + "Leave",value:" Leave tournament"},
			{name:prefix + "TeamName",value:" Name your team"},
			{name:prefix + "TeamIcon [link](.png or .jpg)",value:" Set the icon for your team"},
			{name:prefix + "OneMatch",value:" Gets three random maps"},
			{name:prefix + "Players",value:" Players in tournament"},
			{name:prefix + "Teams",value:" Shows teams for the tournament"},
			{name:prefix + "TeamStats",value:" Shows stats for teams"},
			{name:prefix + "Matches",value:" Shows matches for the tournament"},
			{name:prefix + "Tie",value:" Get a tiebreaker KOTH map"},
			{name:prefix + "MakeTeams",value:" Put players into teams"},
			{name:prefix + "MakeMatches",value:" Make matches and channels for the tournament"},
			{name:prefix + "MovePlayers",value:" Moves players to their team channels"},
			{name:prefix + "Clear",value:" Clear player list and remove generated channels"},
			{name:prefix + "Kick [name]",value:" kick from the tournament"}]);
		msg.channel.send({embeds: [embed]});
	}
}

exports.setRefs = (refs) => {
	bot = refs.bot;
	prefix = refs.prefix + "ow";
}

exports.getHelp = () => {
	return [{name:prefix + "help",value:"Overwatch tournament commands"}];
}

function scoreTeams(plrs) {
	var tempTeams = [];
	var teamSRs = [];
	//make the teams and get avg SR
	for (var i = 0; i < teamNum; i++) {
		var tempTeam = [];
		var avgSR = 0;
		for (var j = 0; j < 6; j++) {
			tempTeam.push(plrs[i + (j * teamNum)]);
			avgSR += plrs[i + (j * teamNum)][1];
		}
		tempTeams.push(tempTeam);
		teamSRs.push(avgSR / 6);
	}
	//score the current teams based on SR
	var SRscore = 0;
	var n = 0;
	for (var i = 0; i < teamNum; i++) {
		for (var j = i; j < teamNum; j++) {
			if (i != j) {
				SRscore += Math.abs(teamSRs[i] - teamSRs[j]);
				n++;
			}
		}
	}
	SRscore /= n;
	//score the current teams based on roles
	var roleScore = 0;
	for (var i = 0; i < teamNum; i++) {
		var dps = 2;
		var tank = 2;
		var heal = 2;
		var flex = 0;
		for (var j = 0; j < 6; j++) {
			if (tempTeams[i][2] == 'dps') {
				dps--;
			} else if (tempTeams[i][2] == 'tank') {
				tank--;
			} else if (tempTeams[i][2] == 'heal') {
				heal--;
			} else {
				flex++;
			}
		}
		roleScore += Math.abs(dps) + Math.abs(tank) + Math.abs(heal) - flex;
	}
	roleScore /= teamNum;
	//if new matchups are better set as new team lineups
	var totalScore = 0;
	if (roleScore == 0 && SRscore == 0) {
		totalScore = 1;
	} else {
		if (roleScore == 0) {
			totalScore += (roleWeight / totalWeight);
		} else {
			totalScore += (roleWeight / totalWeight) / roleScore;
		}
		if (SRscore == 0) {
			totalScore += (scoreWeight / totalWeight);
		} else {
			totalScore += (scoreWeight / totalWeight) / SRscore;
		}
	}

	//given a better score sets new lineup
	if (teamsScore < totalScore) {
		teams = [];
		//subs
		for (var i = 1; i <= subsNum; i++) {
			tempTeams[i % teamNum].push(plrs[plrs.length - i]);
		}
		for (var i = 0; i < tempTeams.length; i++) {
			teams.push(tempTeams[i]);
		}
		teamsScore = totalScore;
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
	players.sort(function (a, b) {
		var roleA, roleB;
		if (a[2] == 'dps') {
			roleA = 1;
		}
		if (a[2] == 'tank') {
			roleA = 2;
		}
		if (a[2] == 'heal') {
			roleA = 3;
		}
		if (a[2] == 'flex') {
			roleA = 4;
		}
		if (b[2] == 'dps') {
			roleB = 1;
		}
		if (b[2] == 'tank') {
			roleB = 2;
		}
		if (b[2] == 'heal') {
			roleB = 3;
		}
		if (b[2] == 'flex') {
			roleB = 4;
		}
		return roleA - roleB;
	});
	scoreTeams(plrs);
}

function makeTeams(msg) {
	teamsCreated = true;
	var j, x, i;
	for (var i = OWLIcons.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = OWLIcons[i];
		OWLIcons[i] = OWLIcons[j];
		OWLIcons[j] = x;
	}
	teams = [];
	teamNames = [];
	teamImg = [];
	teamNum = Math.floor(players.length / 6);
	subsNum = players.length - (teamNum * 6);
	totalWeight = roleWeight + scoreWeight;
	teamsScore = 0;
	for (var i = 0; i < 1000 * teamNum * teamNum; i++) {
		randomShuffle(players);
	}
	for (var i = 0; i < teamNum; i++) {
		teamNames.push('Team' + (i + 1));
		teamImg.push(OWLIcons[i % teamNum]);
		imgDefault.push(true);
	}
	msg.channel.send(teamNum + ' Teams have been created');
}

function makeChannels(msg) {
	for (var i = 0; i < teams.length; i++) {
		if (bot.channels.cache.at([teamNames[i]]) == undefined) {
			msg.guild.channels.create(teamNames[i], {type:"voice"});
		}
	}
}

function getMatch(a, b) {
	var mapPool = [];
	var r = -1;
	var newr = -1;
	for (var i = 0; i < 2; i++) {
		while (r == newr) {
			newr = Math.floor(Math.random() * 3);
		}
		r = newr;
		mapPool.push(maps[r][Math.floor(Math.random() * maps[r].length)]);
	}
	mapPool.push(maps[3][Math.floor(Math.random() * maps[3].length)]);
	var j, x, i;
	for (var i = mapPool.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = mapPool[i];
		mapPool[i] = mapPool[j];
		mapPool[j] = x;
	}
	return [[teamNames[a], teamNames[b]], mapPool];
}

function makeMatches() {
	matchesCreated = true;
	var mapPool = [];
	if (teamNum == 2) {
		for (var i = 0; i < 4; i++) {
			mapPool.push(maps[i][Math.floor(Math.random() * maps[i].length)]);
		}
		mapPool.push(maps[3][Math.floor(Math.random() * maps[3].length)]);
		var j, x, i;
		for (var i = mapPool.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = mapPool[i];
			mapPool[i] = mapPool[j];
			mapPool[j] = x;
		}
		matches.push([[teamNames[0], teamNames[1]], mapPool]);
	} else if (teamNum == 3) {
		for (var i = 0; i < teamNum; i++) {
			for (var j = i; j < teamNum; j++) {
				if (i != j) {
					matches.push(getMatch(i, j));
				}
			}
		}
	} else if (teamNum == 4) {
		matches.push(getMatch(0, 1));
		matches.push(getMatch(2, 3));
		matches.push([['Winner of Game1', 'Winner of Game2'], getMatch(0, 0)[1]]);
	} else if (teamNum == 5) {
		matches.push(getMatch(0, 1));
		matches.push(getMatch(2, 3));
		matches.push([['Winner of Game1', teamNames[4]], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game2', 'Winner of Game3'], getMatch(0, 0)[1]]);
	} else if (teamNum == 6) {
		matches.push(getMatch(0, 1));
		matches.push(getMatch(2, 3));
		matches.push([['Winner of Game1', teamNames[4]], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game2', teamNames[5]], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game3', 'Winner of Game4'], getMatch(0, 0)[1]]);
	} else if (teamNum == 7) {
		matches.push(getMatch(0, 1));
		matches.push(getMatch(2, 3));
		matches.push(getMatch(4, 5));
		matches.push([['Winner of Game1', teamNames[6]], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game2', 'Winner of Game3'], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game4', 'Winner of Game5'], getMatch(0, 0)[1]]);
	} else if (teamNum == 8) {
		matches.push(getMatch(0, 1));
		matches.push(getMatch(2, 3));
		matches.push(getMatch(4, 5));
		matches.push(getMatch(6, 7));
		matches.push([['Winner of Game1', 'Winner of Game2'], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game3', 'Winner of Game4'], getMatch(0, 0)[1]]);
		matches.push([['Winner of Game5', 'Winner of Game6'], getMatch(0, 0)[1]]);
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
		s += 'Game' + (i + 1) + ' - ' + matches[i][0][0] + ' vs ' + matches[i][0][1] + '\n';
		for (var j = 0; j < matches[i][1].length; j++) {
			s += matches[i][1][j];
			if (j < matches[i][1].length - 1) {
				s += ', ';
			}
		}
		s += '\n';
		toSend.push(s);
	}
	toSend.push('```');
	msg.channel.send(toSend.join('\n'));
}

function oneMatch(msg) {
	var mapPool = [];
	var r = -1;
	var newr = -1;
	for (var i = 0; i < 2; i++) {
		while (r == newr) {
			newr = Math.floor(Math.random() * 3);
		}
		r = newr;
		mapPool.push(maps[r][Math.floor(Math.random() * maps[r].length)]);
	}
	mapPool.push(maps[3][Math.floor(Math.random() * maps[3].length)]);
	var j, x, i;
	for (var i = mapPool.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = mapPool[i];
		mapPool[i] = mapPool[j];
		mapPool[j] = x;
	}
	let s = '';
	let toSend = [];
	toSend.push('```xl');
	for (var j = 0; j < mapPool.length; j++) {
		s += mapPool[j];
		if (j < mapPool.length - 1) {
			s += ', ';
		}
	}
	toSend.push(s);
	toSend.push('```');
	msg.channel.send(toSend.join('\n'));
}

function printTeams(msg) {
	if (!teamsCreated) {
		msg.channel.send('Teams have not been made');
		return;
	}
	for (var i = 0; i < teamNum; i++) {
		msg.channel.send({embeds: [makeTeamEmbed(i)]});
	}
}

function printTeamData(msg) {
	let s = '';
	let toSend = [];
	toSend.push('```xl');
	for (var i = 0; i < teamNum; i++) {
		s = '';
		s += teamNames[i] + ' - ';
		var avgSR = 0;
		for (var j = 0; j < teams[i].length; j++) {
			s += teams[i][j][2];
			if (j < teams[i].length - 1) {
				s += ', ';
			}
			avgSR += teams[i][j][1];
		}
		toSend.push(s);
		toSend.push(Math.floor((avgSR / 6)));
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
		s.push(players[i][0] + ' - ' + players[i][1] + ' - ' + players[i][2]);
	}
	s.push('```');
	msg.channel.send(s.join('\n'));
}

function join(msg) {
	let rank = parseInt(msg.content.split(' ')[1]);
	let role = msg.content.split(' ')[2].toLowerCase();
	if (parseInt(rank) > 5000 || parseInt(rank) < 0) {
		msg.channel.send('Not a Valid SR');
		return;
	}
	if (role != "dps" && role != "tank" && role != "heal" && role != "flex") {
		msg.channel.send('Not a Valid Role(use dps, tank, heal, or flex)');
		return;
	}
	let name = msg.author.username;
	let player = [name, rank, role, msg.member];
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
	let s = '';
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
	let s = '';
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
				imgDefault[i] = false;
				msg.channel.send('Icon changed');
				return;
			}
		}
	}
	msg.channel.send('Could not change team icon');
}

function tie(msg) {
	msg.channel.send(maps[3][Math.floor(Math.random() * maps[3].length)]);
}

function makeTeamEmbed(t) {
	let s = '';
	for (var j = 0; j < teams[t].length; j++) {
		s += teams[t][j][0];
		if (j < teams[t].length - 1) {
			s += ', ';
		}
	}
	let embed = new Discord.RichEmbed()
	embed.setColor(13632027)
		.setDescription(s)
		.attachFile(attachment)
		.setThumbnail(teamImg[t])
		.setAuthor({name: teamNames[t], iconURL: teamImg[t]});
	return embed;
}

function clear() {
	let defaultChannelID = bot.channels.cache.find(chan => chan.name === defaultChannel);
	let chans = [];
	for (var i = 0; i < teams.length; i++) {
		let chan = bot.channels.cache.find(chan => chan.name === teamNames[i]);
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
	teamsScore = 0;
	teamNum = 0;
	subsNum = 0;
	teamsCreated = false;
	matchesCreated = false;
	for (var i = 0; i < chans.length; i++) {
		chans[i].delete();
	}
}

function movePlayers(msg) {
	for (var i = 0; i < teams.length; i++) {
		let chan = bot.channels.chach.find(chan => chan.name === teamNames[i]);
		for (var j = 0; j < teams[i].length; j++) {
			if (teams[i][j][3] != null) {
				teams[i][j][3].voice.setChannel(chan);
				console.log('Moved!');
			}
		}
	}
}

function testTeams(msg) {
	let roles = ['dps', 'tank', 'heal', 'flex'];
	var num = 12;
	var name = '';
	var rank = -1;
	var role = '';
	for (var i = 0; i < num; i++) {
		name = 'Player' + i;
		rank = Math.floor(Math.random() * 5000);
		role = roles[Math.floor(Math.random() * 4)];
		players.push([name, rank, role, null]);
	}
	msg.channel.send('Test teams created!');
}