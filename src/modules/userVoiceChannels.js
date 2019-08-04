const Discord = require('discord.js');

var bot;
var prefix;

exports.commands = {
    'makechannel': (msg) => {
        makeChannel(msg);
    }
}

exports.getHelp = () => {
    return [{ name: prefix + "makechannel [name]", value: "Creates a temporary voice channel and moves you into it (must be in a channel to use)" }];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

function makeChannel(msg) {
    var name = msg.content.substr(msg.content.indexOf(' ')+1);
    msg.guild.createChannel(name, {type:"voice"});
    setTimeout(moveUser(msg, name), 1000);
}

function moveUser(msg, name) {
    return function () {
        var chan = chan = bot.channels.find(val => val.name === name);
        if(msg.member.voiceChannel != null){
            msg.member.setVoiceChannel(chan);
        }
        setTimeout(checkIfEmpty(chan), 2500);
        return;
    }
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