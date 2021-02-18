const { MessageEmbed } = require('discord.js');

var botcmds;
var bot;
var prefix;

exports.commands = {
    'ping': (msg) => {
        ping(msg);
    }
}

exports.getHelp = () => {
    return [
        { name: prefix + "ping [time] [message]", value: "Pings all users that respond to the message with a reaction at the specified time. (24hr format: HH:MM and EST)" }
    ];
}

exports.startup = () => {
    botcmds = bot.channels.cache.find(val => val.name === "bot-cmds");
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

function ping (msg) {
    var time = msg.content.split(" ")[1];
    time = time.trim();
    if(time.length != 5 || parseInt(time.substring(0,2)) > 23 || time.charAt(2) != ':' || parseInt(time.substring(3,5)) > 59) {
        msg.send("Time format must be HH:MM and between 00:00 and 23:59");
    }
    var pingTime = new Date();
    pingTime.setHours(time.substring(0,2));
    pingTime.setMinutes(time.substring(3,5));
    pingTime.setSeconds(0);
    var currTime = new Date();
    var timer = pingTime.getTime() - currTime.getTime();
    if(timer < 0){
        timer += 86400000;
        pingTime.setTime(pingTime.getTime() + 86400000);
    }

    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor(msg.member.user.username, msg.member.user.displayAvatarURL()).setTimestamp()
        .setDescription("Ping set for " + pingTime);
    botcmds.send(embed);

    setTimeout(pingNow, timer, msg);
}

function pingNow(msg) {
    var messaged = {};
    msg.reactions.cache.forEach(reaction => {
        reaction.users.cache.forEach(user => {
            if(messaged[user.username] == undefined){
                messaged[user.username] = true;
                user.send(msg.content.substring(12));
            }
        })
    });
}