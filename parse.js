/**
 * Created by Ranndom on 12/16/2014.
 */

var exports = module.exports;
var logger = require('./util/logger');

exports.parseLine = function(line)
{
    // Data object
    var data = {};

    if(line.match(/".+?" killed ".+?" with ".+?" \(attacker_position ".+?"\) \(victim_position ".+?"\)/) != null)
    {
        // Player killed another player.
        data = parseKill(line);
    }
    else if(line.match(/".+?" killed ".+?" with ".+?" \(.+?".+?"\) \(.+?".+?"\) \(.+?".+?"\)/) != null)
    {
        // Player killed another player -- with special.
        data = parseSpecialKill(line);
    }
    else if(line.match(/".+?" triggered "damage" against ".+?" \(damage "\d+"\) \(weapon "\w+"\)/))
    {
        // Player damaged another player.
        data = parseDamage(line);
    }
    else if(line.match(/".+?" triggered "damage" against ".+?" \(damage "\d+"\) \(realdamage "\d+"\) \(weapon "\w+"\)/))
    {
        // Player damaged another player -- with real damage.
        data = parseRealDamage(line);
    }
    else if(line.match(/".+" committed suicide with "/) != null)
    {
        // Player suicided.
        data = parseSuicide(line);
    }
    else if(line.match(/".+?<\d+><.+?><\w+?>" picked up item "\w+"/) != null)
    {
        // Player picked up item.
        data = parsePickup(line);
    }
    else if(line.match(/Log file started \(.+?\) \(.+?\) \(.+?\)/))
    {
        // Log started.
        data = parseLogStart(line);
    }
    else if(line.match(/Loading map ".+?"/))
    {
        // Loading map.
        data = parseMapLoad(line);
    }
    else if(line.match(/Started map ".+?" \(CRC ".+?"\)/))
    {
        // Started map.
        data = parseMapStarted(line);
    }
    else if(line.match(/server_cvar: ".+?" ".+?"/))
    {
        // Server cvar changed.
        data = parseCvarChange(line);
    }
    else if(line.match(/rcon from ".+?": command ".+"/))
    {
        // Server rcon command.
        data = parseRconCommand(line);
    }
    else
    {
        logger.warn("Missing handler for line %s, bug Ranndom about it!", line);
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

var parseLogStart = function(line)
{
    var data = {};
    data.type = 'log_start';

    var matches = line.match(/Log file started \(.+?"(.+?)"\) \(.+?"(.+?)"\) \(.+?"(.+?)"\)/);
    data.name = matches[1];
    data.gamePath = matches[2];
    data.gameVersion = matches[3];

    return data;
}

var parseMapLoad = function(line)
{
    var data = {};
    data.type = 'map_load';

    var matches = line.match(/Loading map "(.+?)"/);
    data.map = matches[1];

    return data;
}

var parseMapStarted = function(line)
{
    var data = {};
    data.type = 'map_started';

    var matches = line.match(/Started map "(.+?)" \(CRC "(.+?)"\)/);
    data.map = matches[1];
    data.crc = matches[2];

    return data;
}

var parseCvarChange = function(line)
{
    var data = {};
    data.type = 'cvar_change';

    var matches = line.match(/server_cvar: "(.+?)" "(.+?)"/);
    data.cvar = matches[1];
    data.value = matches[2];

    return data;
}

var parseRconCommand = function(line)
{
    var data = {};
    data.type = 'rcon_command';

    var matches = line.match(/rcon from "(.+?):(\d+)": command "(.+)"/);
    data.ip = matches[1];
    data.port = matches[2];
    data.command = matches[3];

    return data;
}

var parseDamage = function(line)
{
    var data = {};
    data.type = 'damage';

    var matches = line.match(/"(.+?)<\d+><(.+?)><(Blue|Red)>" triggered "damage" against "(.+?)<\d+><(.+?)><(Blue|Red)>" \(damage "(\d+)"\) \(weapon "(\w+)"\)/);
    data.attacker = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.victim = {name: matches[4], steamid: matches[5], team: matches[6]};
    data.damage = matches[7];
    data.weapon = matches[8];

    var critMatches = line.match(/\(crit "(\w.+?)"\)/);
    if(critMatches != null)
    {
        data.crit = critMatches[1];
    }

    var headshotMatches = line.match(/\(headshot "(\d+?)"\)/);
    if(headshotMatches != null)
    {
        data.headshot = headshotMatches[1];
    }

    return data;
}

var parseRealDamage = function(line)
{
    var data = {};
    data.type = 'real_damage';

    var matches = line.match(/"(.+?)<\d+><(.+?)><(Blue|Red)>" triggered "damage" against "(.+?)<\d+><(.+?)><(Blue|Red)>" \(damage "(\d+)"\) \(realdamage "(\d+)"\) \(weapon "(\w+)"\)/);
    data.attacher = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.victim = {name: matches[4], steamid: matches[5], team: matches[6]};
    data.damage = matches[7];
    data.realDamage = matches[8];
    data.weapon = matches[9];

    var critMatches = line.match(/\(crit "(\w.+?)"\)/);
    if(critMatches != null)
    {
        data.crit = critMatches[1];
    }

    var headshotMatches = line.match(/\(headshot "(\d+?)"\)/);
    if(headshotMatches != null)
    {
        data.headshot = headshotMatches[1];
    }

    return data;
}