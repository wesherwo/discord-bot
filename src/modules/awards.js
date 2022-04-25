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

function giveAwards(msg) {
    msgRef = msg;
    getMsgs(bot);
}

function getMsgs() {
    bot.channels.cache.each(chan => {
        if (chan.type == "text") {
            promises.push(false);
            chan.fetchMessages({ limit: 100 }).then(messages => computeMsgs(messages.cache, num++));
        }
    });
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
    messages.each(msg => {
        if (msg.createdAt >= getLastMonth() && !ignorePerson(msg.author) && !ignoreCh(msg.channel)) {
            allMessages.push(msg);
        } else if (msg.createdAt >= getLastMonth() && msg.author.id == bot.user.id) {
            allBotMessages.push(msg);
        }
    });
    if (messages.size > 0 && messages.cache.at(messages.length - 1).createdAt >= getLastMonth()) {
        promises.push(false);
        messages.cache.at(messages.length - 1).channel.fetchMessages({ limit: 100, before: messages.cache.at(messages.length - 1).id })
            .then(messages => computeMsgs(messages.cache, num++));
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
    reactions.each(reaction => {count += reaction.count;});
    return count;
}

function nums(message) {
    if (ppl[message.author.id] != null) {
        ppl[message.author.id]["messages"]++;
        ppl[message.author.id]["reactions"] += getReactionCount(message.reactions.cache);
        return;
    }
    ppl[message.author.id] = { "messages": 1, "reactions": getReactionCount(message.reactions.cache) };
}

function getUserName(userId) {
    var mem = null;
    bot.channels.cache.at(0).guild.members.cache.each(member => {
        if (member.id == userId) {
            if (member.nickname == null) {
                mem = member.user.username;
            } else {
                mem = member.nickname;
            }
        }
    });
    return mem;
}

function getUser(userId) {
    var mem = null;
    var members = bot.channels.cache.at(0).guild.members.cache.each(member => {
        if (member.id == userId) {
            mem = member.user;
        }
    });
    return mem;
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
    mostpopularmsg = allMessages.sort(function (a, b) { return getReactionCount(b.reactions.cache) - getReactionCount(a.reactions.cache) });
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
        .setAuthor({name: getUserName(loud[0]), iconURL: getUser(loud[0]).avatarURL});
    msgRef.channel.send({embeds: [embed]});
}

function printPopMsg(msg) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Most popular message: " + getUserName(msg.author.id)
            + " with " + getReactionCount(msg.reactions.cache) + " reactions on one message.")
        .setAuthor({name: getUserName(msg.author.id), iconURL: msg.author.avatarURL});
    msgRef.channel.send({embeds: [embed]});
}

function printMrPop(pop) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Mr Popular: " + getUserName(pop[0]) + " with " + getReactionCount(pop.reactions.cache) + " reactions total.")
        .setAuthor({name: getUserName(pop[0]), iconURL: getUser(pop[0]).avatarURL});
    msgRef.channel.send({embeds: [embed]});
}

function printLongWind(long) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("Long Winded: " + getUserName(long.author.id) + " with " + long.content.length + " characters.")
        .setAuthor({name: getUserName(long.author.id), iconURL: long.author.avatarURL});
    msgRef.channel.send({embeds: [embed]});
}

function printLongTime(long) {
    let embed = new Discord.RichEmbed()
    embed.setColor(13632027)
        .setDescription("longestTime: " + getUserName(long[0]) + " with " + printTime(long[1]))
        .setAuthor({name: getUserName(long[0]), iconURL: getUser(long[0]).avatarURL});
    msgRef.channel.send({embeds: [embed]});
}
// console.log("longestLoneWolfTime: " + getUserName(longestLonlyTime[0][0]) + " with " + printTime(longestLonlyTime[0][1]));
// console.log("longestPartyKing: " + getUserName(longestPartyTime[0][0]) + " with " + printTime(longestPartyTime[0][1])); 