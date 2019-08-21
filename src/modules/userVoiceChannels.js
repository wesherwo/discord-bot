const Discord = require('discord.js');

var bot;
var prefix;
var userChannelCategory;

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
    userChannelCategory = bot.channels.find(val => val.name === "Join to create channel");
    if (userChannelCategory == null) {
        var guild = bot.guilds.array()[0];
        guild.createChannel("USER CHANNELS", { type: "category" }).then(parent => {
            guild.createChannel("Join to create channel", { type: "voice" }).then(chan => {
                chan.setParent(parent);
            });
        });
        userChannelCategory = bot.channels.find(val => val.name === "Join to create channel");
    }
    bot.on("voiceStateUpdate", (oldMember, newMember) => {
        if (newMember.voiceChannel != null && newMember.voiceChannel.id == userChannelCategory.id) {
            makeChannelByJoin(newMember);
        }
    });
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
    bot.guilds.array()[0].createChannel(name, { type: "voice" }).then(chan => { moveUser(member, chan); });
}

function moveUser(member, chan) {
    channels[chan.id] = { "owner": member };
    chan.setParent(userChannelCategory.parent);
    if (member.voiceChannel != null) {
        member.setVoiceChannel(chan);
    }
    setTimeout(checkIfEmpty(chan), 2500);
    return;
}

function checkIfEmpty(chan) {
    return function () {
        if (chan.members.array().length == 0) {
            delete channels[chan.id];
            chan.delete();
            return;
        }
        setTimeout(checkIfEmpty(chan), 2500);
        return;
    }
}

function getOwnedChannel(member) {
    chans = userChannelCategory.parent.children.array();
    var foundChan = null;
    chans.forEach(chan => {
        if (channels[chan.id] != undefined && channels[chan.id].owner == member) {
            foundChan = chan;
        }
    });
    return foundChan;
}

function rename(msg) {
    var newName = msg.content.split(" ")[1];
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
        chan.replacePermissionOverwrites({
            overwrites: [
                {
                    id: msg.author.id,
                    allow: ['CONNECT']
                },
                {
                    id: bot.user.id,
                    allow: ['CONNECT']
                },
                {
                    id: bot.guilds.array()[0].defaultRole,
                    deny: ['CONNECT']
                }
            ],
            reason: 'Owner locked channel'
        });
    }
}

function unlock(msg) {
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        chan.replacePermissionOverwrites({
            overwrites: [
                {
                    id: bot.guilds.array()[0].defaultRole,
                    allow: ['CONNECT']
                }
            ],
            reason: 'Owner unlocked channel'
        });
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
        var members = chan.members.array();
        members.forEach(member => {
            if (member.displayName == name) {
                member.setVoiceChannel(null);
                return;
            }
        });
        msg.channel.send("User not found in your channel.");
    }
}

function allow(msg) {
    var name = msg.content.split(" ")[1];
    if (name == null) {
        msg.channel.send("Must give a user to kick.");
        return;
    }
    var chan = getOwnedChannel(msg.member);
    if (chan != null) {
        var members = bot.channels.array()[0].guild.members.array();
        members.forEach(member => {
            if (member.displayName == name) {
                chan.overwritePermissions(member.id,{CONNECT:true});
                return;
            }
        });
    }
}