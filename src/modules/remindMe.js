const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = "SaveData/reminders.json";

var botcmds;
var bot;
var prefix;
var reminders;

exports.commands = {
    'ping': (msg) => {
        newPing(msg);
    }
}

exports.getHelp = () => {
    return [
        { name: prefix + "ping [date(MM/DD)] [time(HH:MM)] [message]", value: "Pings all users that respond to the message with a reaction at the specified date and time." }
    ];
}

exports.startup = () => {
    pingStart();
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

function pingStart() {
    botcmds = bot.channels.cache.find(val => val.name === "bot-cmds");
    reminders = JSON.parse(fs.readFileSync(path));
    Object.entries(reminders).forEach(([msgID,chanID]) => {
        bot.channels.fetch(chanID).then(chan => chan.messages.fetch(msgID).then(msg => ping(msg)));
    });
}

function newPing(msg) {
    reminders[msg.id] = msg.channel.id;
    var jsonData = JSON.stringify(reminders);
    fs.writeFileSync(path, jsonData, function (err) { if (err) { console.log(err); } });
    ping(msg);
}

function ping (msg) {
    var date = msg.content.split(" ")[1];
    date = date.trim();
    if(date.length != 5 || parseInt(date.substring(0,2)) > 12 || date.charAt(2) != '/' || parseInt(date.substring(3,5)) > 31) {
        msg.channel.send("Date format must be MM/DD");
        deletePing(msg);
        return;
    }
    var time = msg.content.split(" ")[2];
    time = time.trim();
    if(time.length != 5 || parseInt(time.substring(0,2)) > 23 || time.charAt(2) != ':' || parseInt(time.substring(3,5)) > 59) {
        msg.channel.send("Time format must be HH:MM and between 00:00 and 23:59");
        deletePing(msg);
        return;
    }
    var pingTime = new Date();
    pingTime.setMonth(date.substring(0,2) - 1);
    pingTime.setDate(date.substring(3,5));
    pingTime.setHours(time.substring(0,2));
    pingTime.setMinutes(time.substring(3,5));
    pingTime.setSeconds(0);
    var currTime = new Date();
    var timer = pingTime.getTime() - currTime.getTime();
    if(timer < 0){
        msg.channel.send("Must be a time in the future.");
        deletePing(msg);
        return;
    }

    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor({name: msg.author.username, iconURL: msg.author.displayAvatarURL()}).setTimestamp()
        .setDescription("Ping set for " + pingTime);
    botcmds.send({embeds: [embed]});

    if(timer > 2073600000){
        setTimeout(ping, 2073600000, msg);
    } else {
        setTimeout(pingNow, timer, msg);
    }
}

function pingNow(msg) {
    var messaged = {};
    msg.reactions.cache.each(reaction => {
        reaction.users.cache.each(user => {
            if(messaged[user.username] == undefined){
                messaged[user.username] = true;
                user.send(msg.content.substring(18));
            }
        })
    });
    deletePing(msg);
}

function deletePing(msg) {
    delete reminders[msg.id];
    var jsonData = JSON.stringify(reminders);
    fs.writeFileSync(path, jsonData, function (err) { if (err) { console.log(err); } });
}