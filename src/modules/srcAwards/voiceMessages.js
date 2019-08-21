const pplTime = [];
const pplLonlyTime = [];
const partyKing = [];
var allBotMessages = [];
var botRef;
var longestTime = [];
var longestLonlyTime = [];
var longestPartyKing = [];

exports.makeVoiceCalcs = (msgs, bot) => {
    allBotMessages = msgs;
    botRef = bot;
    mostTime();
    mostLonlyTime();
    party();
    getMostTime();
}

exports.getLongestTime = () => {
    return longestTime;
}

exports.getLongestLonlyTime = () => {
    return longestLonlyTime;
}

exports.getLongestPartyKing = () => {
    return longestPartyKing;
}

function getMostTime() {
    pplTime.sort(function (a, b) { return b[1] - a[1] });
    console.log(pplTime);
    longestTime[0] = pplTime[0];
    longestTime[1] = pplTime[1];
    pplLonlyTime.sort(function (a, b) { return b[1] - a[1] });
    longestLonlyTime[0] = pplLonlyTime[0];
    longestLonlyTime[1] = pplLonlyTime[1];
    partyKing.sort(function (a, b) { return b[1] - a[1] });
    longestPartyKing[0] = partyKing[0];
    longestPartyKing[1] = partyKing[1];
}

function getUserIndex(arr, userId) {
    for (var i = 0; i < arr.length; i++) {
        if (userId == arr[i][0]) {
            return i;
        }
    }
    return -1;
}

function getVoiceChannel(channels, channId) {
    for (var i = 0; i < channels.length; i++) {
        if (channId == channels[i][0]) {
            return i;
        }
    }
    return -1;
}

function getChannId(channName) {
    var channels = botRef.channels.array();
    for (var i = 0; i < channels.length; i++) {
        if (channels[i].name == channName) {
            return channels[i].id;
        }
    }
    return null;
}

function party() {
    for (var i = 0; i < pplTime.length; i++) {
        for (var j = 0; j < pplLonlyTime.length; j++) {
            if (pplTime[i][0] == pplLonlyTime[j][0]) {
                partyKing.push([pplTime[i][0], pplTime[i][1] - pplLonlyTime[j][1]]);
            }
        }
    }
}

function mostTime() {
    var channels = [];
    for (var i = allBotMessages.length - 1; i >= 0; i--) {
        if (allBotMessages[i].embeds[0] != undefined && allBotMessages[i].embeds[0].description != undefined) {
            var desc = allBotMessages[i].embeds[0].description;
            var channId = desc.slice(desc.lastIndexOf("#") + 1, desc.length - 3);
            var userId = desc.slice(desc.indexOf("@") + 1, desc.indexOf(">"));
            var time = new Date(allBotMessages[i].embeds[0].timestamp);
            if (desc.indexOf("joined voice channel") != -1) {
                joinChannel(channels, channId, userId, time);
            } else if (desc.indexOf("left voice channel") != -1) {
                leaveChannel(channels, channId, userId, time);
            } else if (desc.indexOf("switched voice channel") != -1) {
                switchChannel(channels, channId, userId, desc);
            }
        }
    }
}

function joinChannel(channels, channId, userId, time) {
    var chanIndex = getVoiceChannel(channels, channId);
    if (chanIndex == -1) {
        channels.push([channId, [[userId, time]]]);
    } else {
        channels[chanIndex][1].push([userId, time]);
    }
}

function leaveChannel(channels, channId, userId, time) {
    var chanIndex = getVoiceChannel(channels, channId);
    if (chanIndex == -1) {
        return;
    }
    var userIndex = getUserIndex(channels[chanIndex][1], userId);
    if (userIndex == -1) {
        return;
    }
    startTime = new Date(channels[chanIndex][1].splice(userIndex, 1)[0][1]);
    var k = getUserIndex(pplTime, userId);
    if (k == -1) {
        pplTime.push([userId, time - startTime]);
    } else {
        pplTime[k][1] += time - startTime;
    }
}

function switchChannel(channels, channId, userId, desc) {
    channId = getChannId(channId);
    var oldChann = getChannId(desc.slice(desc.indexOf("#") + 1, desc.indexOf("`", desc.indexOf("#"))));
    var chanIndex = getVoiceChannel(channels, channId);
    var oldChanIndex = getVoiceChannel(channels, oldChann);
    if (oldChanIndex == -1) {
        return;
    }
    var j = getUserIndex(channels[oldChanIndex][1], userId);
    if (j == -1) {
        return;
    }
    var temp = channels[oldChanIndex][1].splice(j, 1)[0];
    if (chanIndex == -1) {
        channels.push([channId, [temp]]);
    } else {
        channels[chanIndex][1].push(temp);
    }
}

function mostLonlyTime() {
    var channels = [];
    for (var i = allBotMessages.length - 1; i >= 0; i--) {
        if (allBotMessages[i].embeds[0] != undefined && allBotMessages[i].embeds[0].description != undefined) {
            var desc = allBotMessages[i].embeds[0].description;
            var channId = desc.slice(desc.lastIndexOf("#") + 1, desc.length - 3);
            var userId = desc.slice(desc.indexOf("!") + 1, desc.indexOf(">"));
            var time = new Date(allBotMessages[i].embeds[0].timestamp);
            if (desc.indexOf("joined voice channel") != -1) {
                joinLonlyChannel(channels, channId, userId, time);
            } else if (desc.indexOf("left voice channel") != -1) {
                leaveLonlyChannel(channels, channId, userId, time);
            } else if (desc.indexOf("switched voice channel") != -1) {
                switchLonlyChannel(channels, channId, userId, time, desc);
            }
        }
    }
}

function joinLonlyChannel(channels, channId, userId, time) {
    var chanIndex = getVoiceChannel(channels, channId);
    if (chanIndex == -1) {
        channels.push([channId, [[userId, time]]]);
    } else {
        if (channels[chanIndex][1].length == 1) {
            var lonlyUserId = channels[chanIndex][1][0][0];
            var startTime = channels[chanIndex][1][0][1];
            var lonlyUserIndex = getUserIndex(pplLonlyTime, lonlyUserId);
            if (lonlyUserIndex == -1) {
                pplLonlyTime.push([lonlyUserId, time - startTime]);
            } else {
                pplLonlyTime[lonlyUserIndex][1] += time - startTime;
            }
        }
        channels[chanIndex][1].push([userId, time]);
    }
}

function leaveLonlyChannel(channels, channId, userId, time) {
    var chanIndex = getVoiceChannel(channels, channId);
    if (chanIndex == -1) {
        return;
    }
    var userIndex = getUserIndex(channels[chanIndex][1], userId);
    if (userIndex == -1) {
        return;
    }
    startTime = new Date(channels[chanIndex][1].splice(userIndex, 1)[0][1]);
    var k = getUserIndex(pplLonlyTime, userId);
    if (channels[chanIndex][1].length == 1) {
        channels[chanIndex][1][0][1] = time;
    }
    if (channels[chanIndex][1].length == 0) {
        if (k == -1) {
            pplLonlyTime.push([userId, time - startTime]);
        } else {
            pplLonlyTime[k][1] += time - startTime;
        }
    }
}

function switchLonlyChannel(channels, channId, userId, time, desc) {
    channId = getChannId(channId);
    var oldChann = getChannId(desc.slice(desc.indexOf("#") + 1, desc.indexOf("`", desc.indexOf("#"))));
    var chanIndex = getVoiceChannel(channels, channId);
    var oldChanIndex = getVoiceChannel(channels, oldChann);
    if(oldChanIndex == -1){
        return;
    }
    var j = getUserIndex(channels[oldChanIndex][1], userId);
    if (j == -1) {
        return;
    }
    var temp = channels[oldChanIndex][1].splice(j, 1)[0];
    if (chanIndex == -1) {
        channels.push([channId, [temp]]);
    } else {
        if (channels[chanIndex][1].length == 1) {
            var lonlyUserId = channels[chanIndex][1][0][0];
            var startTime = channels[chanIndex][1][0][1];
            var lonlyUserIndex = getUserIndex(pplLonlyTime, lonlyUserId);
            if (lonlyUserIndex == -1) {
                pplLonlyTime.push([lonlyUserId, time - startTime]);
            } else {
                pplLonlyTime[lonlyUserIndex][1] += time - startTime;
            }
        }
        channels[chanIndex][1].push(temp);
    }
    if (channels[oldChanIndex][1].length == 1) {
        channels[oldChanIndex][1][0][1] = time;
    }
}