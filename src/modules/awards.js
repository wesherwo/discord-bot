const Discord = require('discord.js');
const fs = require("fs");
const vm = require('./srcAwards/voiceMessages.js');

var botcmds;

const ppl = {};
//name, msgs
const promises = [];
var num = 0;
const allMessages = [];
const allBotMessages = [];
const settings = JSON.parse(fs.readFileSync("Resources/ModuleResources/awards.json"));
const ignoreChannels = settings["ignoreChannels"];
const ignorePpl = settings["ignorePpl"];

var bot;
var prefix;
var msgRef;
var found = false;
var mostpopularmsg = [];
var longwind = [];
var loudMouth = [];
var mrpopular = [];
var longestTime;
var longestLonlyTime;
var longestPartyTime;

exports.commands = {
    'awards': (msg) => {
        giveAwards(msg);
    }
}

exports.getHelp = () => {
    return [{ name: prefix + "awards", value: "Give awards!" }];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.startup = () => {
    botcmds = bot.channels.find(val => val.name === "bot-cmds");
    if (botcmds == null) {
        var guild = bot.guilds.array()[0];
        guild.createChannel("bot-cmds", { type: "text" });
    }
    bot.on("voiceStateUpdate", (oldMember, newMember) => {
        voiceUpdate(oldMember, newMember);
    });
}

function voiceUpdate(oldmember, newmember) {
    if (oldmember.voiceChannel == newmember.voiceChannel) {
        return;
    }
    let embed = new Discord.RichEmbed();
    embed.setColor(13632027).setAuthor(oldmember.displayName, oldmember.user.displayAvatarURL).setTimestamp();
    if (oldmember.voiceChannel == null && newmember.voiceChannel != null) {
        embed.setDescription("<@" + oldmember.id + "> joined voice channel `#" + newmember.voiceChannel.name + "`");
    } else if (newmember.voiceChannel == null && oldmember.voiceChannel != null) {
        embed.setDescription("<@" + oldmember.id + "> left voice channel `#" + oldmember.voiceChannel.name + "`");
    } else {
        embed.setDescription("<@" + oldmember.id + "> switched voice channel `#" + oldmember.voiceChannel.name + "` -> `#" + newmember.voiceChannel.name + "`");
    }
    botcmds.send(embed);
}

function giveAwards(msg) {
    msgRef = msg;
    getMsgs(bot);
}

function getMsgs() {
    var channelList = bot.channels.array();
    for (var i = 0; i < channelList.length; i++) {
        if (channelList[i].type == "text") {
            promises.push(false);
            channelList[i].fetchMessages({ limit: 100 }).then(messages => computeMsgs(messages.array(), num++));
        }
    }
}

function ignoreCh(channel) {
    for (var i = 0; i < ignoreChannels.length; i++) {
        if (ignoreChannels[i] == channel.id) {
            return true;
        }
    }
    return false;
}

function ignorePerson(person) {
    for (var i = 0; i < ignorePpl.length; i++) {
        if (ignorePpl[i] == person.id) {
            return true;
        }
    }
    return false;
}

function computeMsgs(messages, mynum) {
    for (var i = 0; i < messages.length; i++) {
        if (messages[i].createdAt >= getLastMonth() && !ignorePerson(messages[i].author) && !ignoreCh(messages[i].channel)) {
            allMessages.push(messages[i]);
        } else if (messages[i].createdAt >= getLastMonth() && messages[i].author.id == bot.user.id) {
            allBotMessages.push(messages[i]);
        }
    }
    if (messages.length > 0 && messages[messages.length - 1].createdAt >= getLastMonth()) {
        promises.push(false);
        messages[messages.length - 1].channel.fetchMessages({ limit: 100, before: messages[messages.length - 1].id })
            .then(messages => computeMsgs(messages.array(), num++));
    }
    promises[mynum] = true;
    if (allThreadsComplete()) {
        giveMsgAwards();
    }
}

function allThreadsComplete() {
    for (var i = 0; i < promises.length; i++) {
        if (!promises[i]) {
            return false;
        }
    }
    return true;
}

function getLastMonth() {
    var date = new Date();
    if (date.getMonth() - 1 == -1) {
        return date.setMonth(11).setFullYear(date.getFullYear() - 1);
    }
    return date.setMonth(date.getMonth() - 1);
}

function getReactionCount(reactions) {
    var count = 0;
    for (var i = 0; i < reactions.length; i++) {
        count += reactions[i].count;
    }
    return count;
}

function nums(message) {
    if (ppl[message.author.id] != null) {
        ppl[message.author.id]["messages"]++;
        ppl[message.author.id]["reactions"] += getReactionCount(message.reactions.array());
        return;
    }
    ppl[message.author.id] = { "messages": 1, "reactions": getReactionCount(message.reactions.array()) };
}

function getUserName(userId) {
    var members = bot.channels.array()[0].guild.members.array();
    for (var i = 0; i < members.length; i++) {
        if (members[i].id == userId) {
            if (members[i].nickname == null) {
                return members[i].user.username;
            } else {
                return members[i].nickname;
            }
        }
    }
    return null;
}

function getUser(userId) {
    var members = bot.channels.array()[0].guild.members.array();
    for (var i = 0; i < members.length; i++) {
        if (members[i].id == userId) {
            return members[i].user;
        }
    }
    return null;
}

function printTime(time) {
    var hours = parseInt(time / (1000 * 60 * 60));
    time -= hours * 1000 * 60 * 60;
    var minutes = parseInt(time / (1000 * 60));
    time -= minutes * 1000 * 60;
    var seconds = parseInt(time / 1000);
    return hours + "hr" + minutes + "min" + seconds + "sec";
}

function giveMsgAwards() {
    for (var j = 0; j < allMessages.length; j++) {
        nums(allMessages[j]);
    }

    loudMouth = Object.entries(ppl).sort(function (a, b) { return b.messages - a.messages });
    mrpopular = Object.entries(ppl).sort(function (a, b) { return b.reactions - a.reactions });
    mostpopularmsg = allMessages.sort(function (a, b) { return getReactionCount(b.reactions.array()) - getReactionCount(a.reactions.array()) });
    longwind = allMessages.sort(function (a, b) { return b.content.length - a.content.length });
    vm.makeVoiceCalcs(allBotMessages, bot);
    longestTime = vm.getLongestTime();
    longestLonlyTime = vm.getLongestLonlyTime();
    longestPartyTime = vm.getLongestPartyKing();
    printAwards();
}

function printAwards() {
    printLoudMouth(loudMouth[0]);
    printPopMsg(mostpopularmsg[0]);
    printMrPop(mrpopular[0]);
    printLongWind(longwind[0]);
    printLongTime(longestTime[0]);
    msgRef.channel.send("-----Runner Ups-----");
    printLoudMouth(loudMouth[1]);
    printPopMsg(mostpopularmsg[1]);
    printMrPop(mrpopular[1]);
    printLongWind(longwind[1]);
    printLongTime(longestTime[1]);
}

function printLoudMouth(loud) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Loudmouth: " + getUserName(loud[0]) + " with " + loud.messages + " messages.")
        .setAuthor(getUserName(loud[0]), getUser(loud[0]).avatarURL);
    msgRef.channel.send(embed);
}

function printPopMsg(msg) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Most popular message: " + getUserName(msg.author.id)
            + " with " + getReactionCount(msg.reactions.array()) + " reactions on one message.")
        .setAuthor(getUserName(msg.author.id), msg.author.avatarURL);
    msgRef.channel.send(embed);
}

function printMrPop(pop) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Mr Popular: " + getUserName(pop[0]) + " with " + getReactionCount(pop.reactions.array()) + " reactions total.")
        .setAuthor(getUserName(pop[0]), getUser(pop[0]).avatarURL);
    msgRef.channel.send(embed);
}

function printLongWind(long) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Long Winded: " + getUserName(long.author.id) + " with " + long.content.length + " characters.")
        .setAuthor(getUserName(long.author.id), long.author.avatarURL);
    msgRef.channel.send(embed);
}

function printLongTime(long) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("longestTime: " + getUserName(long[0]) + " with " + printTime(long[1]))
        .setAuthor(getUserName(long[0]), getUser(long[0]).avatarURL);
    msgRef.channel.send(embed);
}
// console.log("longestLoneWolfTime: " + getUserName(longestLonlyTime[0][0]) + " with " + printTime(longestLonlyTime[0][1]));
// console.log("longestPartyKing: " + getUserName(longestPartyTime[0][0]) + " with " + printTime(longestPartyTime[0][1])); 