const Discord = require('discord.js');
const Permissions = Discord.Permissions;

var bot;
var prefix;
var userChannelCategory;
var stopped = false;

var channels = {};

exports.commands = {
    'makechan': (msg) => {
        makeChannelByMsg(msg);
    },
    'renamechan': (msg) => {
        rename(msg);
    },
    'lockchan': (msg) => {
        lock(msg);
    },
    'unlockchan': (msg) => {
        unlock(msg);
    },
    'chankick': (msg) => {
        kick(msg);
    },
    'allowuser': (msg) => {
        allow(msg);
    }
}

exports.getHelp = () => {
    return [
        { name: prefix + "makechan [name]", value: "Creates a temporary voice channel and moves you into it (must be in a channel to use)." },
        { name: prefix + "renamechan [name]", value: "renames the channel you created." },
        { name: prefix + "lockchan", value: "locks the channel you created." },
        { name: prefix + "unlockchan", value: "unlocks the channel you created." },
        { name: prefix + "chankick [user]", value: "kicks a user from your channel." },
        { name: prefix + "allowuser [user]", value: "allows a user into your channel." }];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

exports.startup = () => {
    userChannelCategory = bot.channels.cache.find(val => val.name === "Join to create channel");
    if (userChannelCategory == null) {
        var guild = bot.guilds.cache.at(0);
        guild.channels.create("USER CHANNELS", { type: "GUILD_CATEGORY" }).then(parent => {
            guild.channels.create("Join to create channel", { type: "GUILD_VOICE" }).then(chan => {
                chan.setParent(parent);
            });
        });
        userChannelCategory = bot.channels.cache.find(val => val.name === "Join to create channel");
    }
    bot.on("voiceStateUpdate", (oldMember, newMember) => {
        if(stopped){
            return;
        }
        if (newMember.member.voice.channel != null && newMember.member.voice.channel.id == userChannelCategory.id) {
            makeChannelByJoin(newMember.member);
        }
    });
}

exports.stop = () => {
    stopped = true;
}

function makeChannelByJoin(member) {
    var name = member.displayName;
    name += "'s VC";
    makeChannel(member, name);
}

function makeChannelByMsg(msg) {
    var name = msg.content.split(" ")[1];
    if (name == null) {
        name = msg.member.displayName;
        name += "'s VC";
    }
    makeChannel(msg.member, name);
}

function makeChannel(member, name) {
    bot.guilds.cache.at(0).channels.create(name, { type: 'GUILD_VOICE' }).then(chan => { moveUser(member, chan); });
}

function moveUser(member, chan) {
    channels[chan.id] = { "owner": member };
    chan.setParent(userChannelCategory.parent, {lockPermissions:false});
    if (member.voice.channel != null) {
        member.voice.setChannel(chan);
    }
    setTimeout(checkIfEmpty(chan), 2500);
    return;
}

function checkIfEmpty(chan) {
    return function () {
        if (chan.members.size == 0) {
            delete channels[chan.id];
            chan.delete();
            return;
        }
        setTimeout(checkIfEmpty(chan), 2500);
        return;
    }
}

function getOwnedChannel(member) {
    chans = userChannelCategory.parent.children;
    var foundChan = null;
    chans.each(chan => {
        if (channels[chan.id] != undefined && channels[chan.id].owner == member) {
            foundChan = chan;
        }
    });
    return foundChan;
}

function rename(msg) {
    var newName = msg.content.substring(msg.content.indexOf(" "));
    if (newName == null) {
        msg.channel.send("Must give a name for the channel.");
        return;
    }
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        chan.setName(newName, "Owner changed name.");
    }
}

function lock(msg) {
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        chan.permissionOverwrites.set([
                {
                    id: msg.author.id,
                    allow: [Permissions.FLAGS.CONNECT]
                },
                {
                    id: bot.user.id,
                    allow: [Permissions.FLAGS.CONNECT]
                },
                {
                    id: bot.guilds.cache.at(0).roles.everyone.id,
                    deny: [Permissions.FLAGS.CONNECT]
                }
            ],
            'Owner locked channel'
        );
    }
}

function unlock(msg) {
    var chan = getOwnedChannel(msg.member);''
    if (chan != null) {
        chan.permissionOverwrites.set([
                {
                    id: bot.guilds.cache.at(0).roles.everyone.id,
                    allow: [Permissions.FLAGS.CONNECT]
                }
            ],
            'Owner unlocked channel'
        );
    }
}

function kick(msg) {
    var name = msg.content.split(" ")[1];
    if (name == null) {
        msg.channel.send("Must give a user to kick.");
        return;
    }
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        var members = chan.members;
        var bool = false;
        members.each(member => {
            if (member.displayName == name) {
                member.voice.setChannel(null);
                bool = true;
                return;
            }
        });
        if (!bool) { msg.channel.send("User not found in your channel."); }
    }
}

function allow(msg) {
    var name = msg.content.split(" ")[1];
    if (name == null) {
        msg.channel.send("Must give a user to allow.");
        return;
    }
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        var members = bot.guilds.cache.at(0).members.cache;
        members.each(member => {
            if (member.displayName == name) {
                chan.permissionOverwrites.edit(member.id, {CONNECT: true});
                return;
            }
        });
    }
}