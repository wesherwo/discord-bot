const Discord = require('discord.js');

var bot;
var prefix;
var userChannelCategorey;

exports.commands = {
    'makechannel': (msg) => {
        makeChannelByMsg(msg);
    }
}

exports.getHelp = () => {
    return [{ name: prefix + "makechannel [name]", value: "Creates a temporary voice channel and moves you into it (must be in a channel to use)" }];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.startup = () => {
    userChannelCategorey = bot.channels.find(val => val.name === "Join to create channel");
    bot.on("voiceStateUpdate", (oldMember, newMember) => {
        if (newMember.voiceChannel != null && newMember.voiceChannel.id == userChannelCategorey.id) {
            makeChannelByJoin(newMember);
        }
    });
}

function makeChannelByJoin(member) {
    var name = member.nickname;
    if (name == null) {
        name = member.user.username;
    }
    name += "'s VC";
    makeChannel(member, name);
}

function makeChannelByMsg(msg) {
    var name = msg.content.split(" ")[1];
    if (name == null) {
        name = member.user.username;
        name += "'s VC";
    }
    makeChannel(msg.member, name);
}

function makeChannel(member, name) {
    bot.guilds.array()[0].createChannel(name, { type: "voice" }).then(chan => { moveUser(member, chan); });
}

function moveUser(member, chan) {
    chan.setParent(userChannelCategorey.parent);
    if (member.voiceChannel != null) {
        member.setVoiceChannel(chan);
    }
    setTimeout(checkIfEmpty(chan), 2500);
    return;
}

function checkIfEmpty(chan) {
    return function () {
        if (chan.members.array().length == 0) {
            chan.delete();
            return;
        }
        setTimeout(checkIfEmpty(chan), 2500);
        return;
    }
}