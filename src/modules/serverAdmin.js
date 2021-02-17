const { MessageEmbed } = require('discord.js');

var botcmds;
var bot;
var prefix;

exports.commands = {
}

exports.getHelp = () => {
    return [{}];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.startup = () => {
    botcmds = bot.channels.cache.find(val => val.name === "bot-cmds");
    if (botcmds == null) {
        var guild = bot.guilds.cache.array()[0];
        guild.channels.create("bot-cmds", { type: "text" });
    }
    bot.on("voiceStateUpdate", (oldMember, newMember) => {
        voiceUpdate(oldMember, newMember);
    });
    bot.on("messageDelete", (message) => {
        messageDelete(message);
    });
    bot.on("messageUpdate", (oldMessage, newMessage) => {
        messageUpdate(oldMessage, newMessage);
    });
}

function voiceUpdate(oldmember, newmember) {
    if (oldmember.channel == newmember.channel) {
        return;
    }
    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor(oldmember.member.user.username, oldmember.member.user.displayAvatarURL()).setTimestamp();
    if (oldmember.member.voice.channel == null && newmember.member.voice.channel != null) {
        embed.setDescription("<@" + oldmember.member.id + "> joined voice channel `#" + newmember.member.voice.channel.name + "`");
    } else if (newmember.member.voice.channel == null && oldmember.member.voice.channel != null) {
        embed.setDescription("<@" + oldmember.member.id + "> left voice channel `#" + oldmember.member.voice.channel.name + "`");
    } else {
        embed.setDescription("<@" + oldmember.member.id + "> switched voice channel `#" + oldmember.member.voice.channel.name + "` -> `#" + newmember.member.voice.channel.name + "`");
    }
    botcmds.send(embed);
}

function messageDelete(message) {
    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor(message.member.user.username, message.member.user.displayAvatarURL()).setTimestamp()
        .setDescription( "Message sent by <@" + message.member.id + "> deleted in `#" + message.channel.name + "`\n" + message.content);
    botcmds.send(embed);
}

function messageUpdate(oldMessage, newMessage) {
    if (oldMessage.member.user == bot.user) {
        return;
    }
    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor(oldMessage.member.user.username, oldMessage.member.user.displayAvatarURL()).setTimestamp()
        .setDescription("Message edited in `#" + oldMessage.channel.name + "`[Jump to Message](" + oldMessage.url + ")")
        .addField("Before", oldMessage.content)
        .addField("After", newMessage.content);
    botcmds.send(embed);
}