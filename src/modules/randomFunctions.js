var bot;
var prefix;

exports.commands = {
    'flipacoin': (msg) => {
        coinFlip(msg);
    },
    'roll': (msg) => {
        diceRoll(msg);
    }
}

exports.getHelp = () => {
    return [
        { name: prefix + "flipacoin", value: "Retruns heads or tails." },
        { name: prefix + "roll [number D number + number]", value: "Rolls some dice." }];
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

function diceRoll(msg) {
    var roll = 0;
    var arr = msg.content.slice(5).split('+');
    var rolls = "";
    var currRoll = 0;
    try {
        arr.forEach(element => {
            var split = element.toLowerCase().indexOf('d');
            if(split >= 0) {
                var dice = parseInt(element.substring(0,split).trim());
                var sides = parseInt(element.substring(split + 1).trim());
                for(var i = 0; i < dice; i++) {
                    currRoll = Math.floor(Math.random() * sides) + 1
                    roll += currRoll;
                    if(currRoll == 1 || currRoll == sides) {
                        rolls = rolls.concat("__**" + currRoll + "**__, ");
                    } else {
                        rolls = rolls.concat(currRoll + ", ");
                    }
                }
            } else {
                roll += parseInt(element.trim());
            }
        });
    } catch (error) {
        msg.channel.send("Format must be xDy+z.");
        return;
    }
    msg.channel.send("You rolled a " + roll + "\n\n" + rolls.substring(0, rolls.length-2));
}