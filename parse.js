/**
 * Created by Ranndom on 12/16/2014.
 */

var exports = module.exports;

exports.parseLine = function(line)
{
    // Data object
    var data = {};

    if(line.match(/".+?" killed ".+?" with ".+?" \(attacker_position ".+?"\) \(victim_position ".+?"\)/) != null)
    {
        // Player killed another player.
        data = parseKill(line);
    }
    if(line.match(/".+?" killed ".+?" with ".+?" \(.+?".+?"\) \(.+?".+?"\) \(.+?".+?"\)/) != null)
    {
        // Player killed another player -- with special.
        data = parseSpecialKill(line);
    }
    if(line.match(/".+" committed suicide with "/) != null)
    {
        // Player suicided.
        data = parseSuicide(line);
    }
    if(line.match(/".+?<\d+><.+?><\w+?>" picked up item "\w+"/) != null)
    {
        // Player picked up item.
        data = parsePickup(line);
    }

    return data;
}

/*
 Parsing functions.
 */

var parseKill = function(line)
{
    var data = {};
    data.type = 'kill';

    var matches = line.match(/"(.+?)<\d+?><(.+?)><(\w+)>" killed "(.+?)<\d+?><(.+?)><(\w+)>" with "(.+?)" \(attacker_position "(-*\d+) (-*\d+) (-*\d+)"\) \(victim_position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.attacker = {name: matches[1], steamid: matches[2], team: matches[3], position: {x: matches[8], y: matches[10], z: matches[9]}};
    data.victim = {name: matches[4], steamid: matches[5], team: matches[6], position: {x: matches[11], y: matches[13], z: matches[12]}};
    data.weapon = matches[7];

    return data;
}

var parseSpecialKill = function(line)
{
    var data = {};
    data.type = 'special_kill';

    var matches = line.match(/"(.+?)<\d+><(.+?)><(Blue|Red)>" killed "(.+?)<\d+><(.+?)><(Blue|Red)>" with "(\w+)" \(customkill "(\w+)"\) \(attacker_position "(-*\d+) (-*\d+) (-*\d+)"\) \(victim_position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.attacker = {name: matches[1], steamid: matches[2], team: matches[3], position: {x: matches[9], y: matches[11], z: matches[10]}};
    data.victim = {name: matches[4], steamid: matches[5], team: matches[6], position: {x: matches[12], y: matches[14], z: matches[13]}};
    data.weapon = matches[7];
    data.killtype = matches[8];

    return data;
}

var parseSuicide = function(line)
{
    var data = {};
    data.type = 'suicide';

    var matches = line.match(/RL \d+\/\d+\/\d+ - \d+:\d+:\d+: "(.+?)<\d+><(.+?)><(.+)>" committed suicide with ".+?" \(attacker_position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.attacker = {name: matches[1], steamid: matches[2], team: matches[3], position: {x: matches[4], y: matches[6], z: matches[5]}};

    return data;
}

var parsePickup = function(line)
{
    var data = {};
    data.type = 'item_pickup';

    var matches = line.match(/"(.+?)<\d+><(.+?)><(Blue|Red)>" picked up item "(\w+)"/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.item = matches[4];

    var medkitMatches = line.match(/"(.+?)<\d+><(.+?)><(Blue|Red)>" picked up item "(\w+)" \(healing "(\d+)"/);
    if(medkitMatches != null)
    {
        data.healed = medkitMatches[5];
    }

    return data;
}