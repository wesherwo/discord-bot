const { MessageEmbed } = require('discord.js');

var botcmds;
var bot;
var prefix;

exports.commands = {
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.startup = () => {
    botcmds = bot.channels.cache.find(val => val.name === "bot-cmds");
    if (botcmds == null) {
        var guild = bot.guilds.cache.at(0);
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
    embed.setColor(13632027).setAuthor({name: oldmember.member.user.username, iconURL: oldmember.member.user.displayAvatarURL()}).setTimestamp();
    if (oldmember.channel == null && newmember.channel != null) {
        embed.setDescription("<@" + oldmember.member.id + "> joined voice channel `#" + newmember.member.voice.channel.name + "`");
    } else if (newmember.channel == null && oldmember.channel != null) {
        embed.setDescription("<@" + oldmember.member.id + "> left voice channel `#" + oldmember.channel.name + "`");
    } else {
        embed.setDescription("<@" + oldmember.member.id + "> switched voice channel `#" + oldmember.channel.name + "` -> `#" + newmember.channel.name + "`");
    }
    botcmds.send({embeds: [embed]});
}

function messageDelete(message) {
    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor({name: oldmember.member.user.username, iconURL: oldmember.member.user.displayAvatarURL()}).setTimestamp()
        .setDescription( "Message sent by <@" + message.member.id + "> deleted in `#" + message.channel.name + "`\n" + message.content);
        botcmds.send({embeds: [embed]});
    }

function messageUpdate(oldMessage, newMessage) {
    if (oldMessage.member == null || oldMessage.member.user == bot.user) {
        return;
    }
    let embed = new MessageEmbed();
    embed.setColor(13632027).setAuthor({name: oldmember.member.user.username, iconURL: oldmember.member.user.displayAvatarURL()}).setTimestamp()
        .setDescription("Message edited in `#" + oldMessage.channel.name + "`[Jump to Message](" + oldMessage.url + ")")
        .addField("Before", oldMessage.content)
        .addField("After", newMessage.content);
        botcmds.send({embeds: [embed]});
    }