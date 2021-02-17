var bot;
var prefix;

exports.commands = {
    'flipacoin': (msg) => {
        coinFlip(msg);
    }
}

exports.getHelp = () => {
    return [
        { name: prefix + "flipacoin", value: "Retruns heads or tails." }];
}

exports.setRefs = (refs) => {
    bot = refs.bot;
    prefix = refs.prefix;
}

function coinFlip (msg) {
    if(Math.random() > 0.5){
        msg.channel.send("Heads!");
        return;
    }
    msg.channel.send("Tails!");
}