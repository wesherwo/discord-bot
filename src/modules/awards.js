const Discord = require('discord.js');
const fs = require("fs");
const vm = require('./srcAwards/voiceMessages.js');

const ppl = [];
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
    return [{name:prefix + "awards",value:"Give awards!"}];
}

exports.setRefs = (refs) => {
	bot = refs.bot;
    prefix = refs.prefix;
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
        } else if (messages[i].createdAt >= getLastMonth() && messages[i].author.id == 336221926060195850) {
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
    found = false;
    for (var i = 0; i < ppl.length; i++) {
        if (ppl[i][0] == message.author.id) {
            ppl[i][1]++;
            ppl[i][2] += getReactionCount(message.reactions.array());
            found = true;
            break;
        }
    }
    if (!found) {
        ppl.push([message.author.id, 1, getReactionCount(message.reactions.array())]);
    }
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
    ppl.sort(function (a, b) { return b[1] - a[1] });
    loudMouth[0] = ppl[0];
    loudMouth[1] = ppl[1];
    ppl.sort(function (a, b) { return b[2] - a[2] });
    mrpopular[0] = ppl[0];
    mrpopular[1] = ppl[1];
    allMessages.sort(function (a, b) { return getReactionCount(b.reactions.array()) - getReactionCount(a.reactions.array()) });
    mostpopularmsg[0] = allMessages[0];
    mostpopularmsg[1] = allMessages[1];
    allMessages.sort(function (a, b) { return b.content.length - a.content.length });
    longwind[0] = allMessages[0];
    longwind[1] = allMessages[1];
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
        .setDescription("Loudmouth: " + getUserName(loud[0]) + " with " + loud[1] + " messages.")
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
        .setDescription("Mr Popular: " + getUserName(pop[0]) + " with " + pop[2] + " reactions total.")
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