/**
 * Created by Ranndom on 12/16/2014.
 */

var exports = module.exports;
var logger = require('./util/logger');

exports.parseLine = function(line)
{
    // List of regular expressions to check against.
    var regexs = [ {regex: /".+?" killed ".+?" with ".+?" \(attacker_position ".+?"\) \(victim_position ".+?"\)/, function: parseKill},
        {regex: /".+?" killed ".+?" with ".+?" \(.+?".+?"\) \(.+?".+?"\) \(.+?".+?"\)/, function: parseSpecialKill},
        {regex: /".+?" triggered "damage" against ".+?" \(damage "\d+"\) \(realdamage "\d+"\) \(weapon "\w+"\)/, function: parseRealDamage},
        {regex: /".+?" triggered "damage" against ".+?" \(damage "\d+"\) \(weapon "\w+"\)/, function: parseDamage},
        {regex: /".+" triggered "shot_fired" \(weapon ".+"\)/, function: parseShotFired},
        {regex: /".+" disconnected \(reason ".+"\)/, function: parseDisconnect},
        {regex: /".+" committed suicide with "/, function: parseSuicide},
        {regex: /".+?<\d+><.+?><\w+?>" picked up item "\w+"/, function: parsePickup},
        {regex: /".+?" triggered "player_builtobject" \(.+?\) \(.+?\)/, function: parseBuildObject},
        {regex: /".+" triggered "killedobject" \(object .+\) \(weapon .+\) \(objectowner .+\) \(attacker_position .+\)/, function: parseDestroyObject},
        {regex: /".+?" triggered "object_detonated" \(.+?\) \(.+?\)/, function: parseDetonateObject},
        {regex: /".+?" triggered "healed" against ".+?" \(.+?\)/, function: parseHealPlayer},
        {regex: /".+" connected, address ".+?"/, function: parsePlayerConnect},
        {regex: /".+" STEAM USERID validated/, function: parsePlayerValidated},
        {regex: /".+" changed role to ".+"}/, function: parseChangeClass},
        {regex: /".+" spawned as ".+"/, function: parsePlayerRespawn},
        {regex: /World triggered ".+?"/, function: parseWorldTrigger},
        {regex: /Log file started \(.+?\) \(.+?\) \(.+?\)/, function: parseLogStart},
        {regex: /Loading map ".+?"/, function: parseMapLoad},
        {regex: /Started map ".+?" \(CRC ".+?"\)/, function: parseMapStarted},
        {regex: /server_cvar: ".+?" ".+?"/, function: parseCvarChange},
        {regex: /rcon from ".+?": command ".+"/, function: parseRconCommand},
        {regex: /Log file closed./, function: function(line) {var data = {type: 'log_end'}; return data;}} ];

    // Data object
    var data = {};

    regexs.forEach(function(object)
    {
        if(line.match(object.regex))
        {
            data = object.function(line);
        }
    });

    if(data.length == 0)
        logger.warn("Missing handler for line %s, bug Ranndom about it!", line);

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

var parseBuildObject = function(line)
{
    var data = {};
    data.type = 'build_object';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" triggered "player_builtobject" \(object "(\w+)"\) \(position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.object = matches[4];
    data.position = {x: matches[5], y: matches[7], z: matches[6]};

    return data;
}

var parseDestroyObject = function(line)
{
    var data = {};
    data.type = 'destroy_object';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" triggered "killedobject" \(object "(.+)"\) \(weapon "(.+)"\) \(objectowner "(.+)<\d+><(.+)><(Red|Blue)>"\) \(attacker_position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.attacker = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.object = matches[4];
    data.victim = {name: matches[6], steamid: matches[7], team: matches[8]};
    data.position = {x: matches[9], y: matches[11], z: matches[10]};
    data.weapon = matches[5];

    return data;
}

var parseDetonateObject = function(line)
{
    var data = {};
    data.type = 'detonate_object';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" triggered "object_detonated" \(object "(.+)"\) \(position "(-*\d+) (-*\d+) (-*\d+)"\)/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.object = matches[4];
    data.position = {x: matches[5], y: matches[7], z: matches[6]};

    return data;
}

var parseHealPlayer = function(line)
{
    var data = {};
    data.type = 'heal_player';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" triggered "healed" against "(.+)<\d+><(.+)><(Red|Blue)>" \(healing "(\d+)"\)/);
    data.healer = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.healed = {name: matches[4], steamid: matches[5], team: matches[6]};
    data.amount = matches[7];

    return data;
}

var parseShotFired = function(line)
{
    var data = {};
    data.type = 'shot_fired';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" triggered "shot_fired" \(weapon "(.+)"\)/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.weapon = matches[4];

    return data;
}

var parseDisconnect = function(line)
{
    var data = {};
    data.type = 'disconnect';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" disconnected \(reason "(.+)"\)/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3]};
    data.reason = matches[4];

    return data;
}

var parseChangeClass = function(line)
{
    var data = {};
    data.type = 'change_class';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" changed role to "(\w+)"/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3], class: matches[4]};

    return data;
}

var parsePlayerRespawn = function(line)
{
    var data = {};
    data.type = 'player_respawn';

    var matches = line.match(/"(.+)<\d+><(.+)><(Red|Blue)>" spawned as "(\w+)"/);
    data.player = {name: matches[1], steamid: matches[2], team: matches[3], class: matches[4]};

    return data;
}

var parseWorldTrigger = function(line)
{
    var data = {};
    data.type = 'world_trigger';

    var matches = line.match(/World triggered "(.+?)"/);
    data.trigger = matches[1];

    var winnerMatches = line.match(/\(winner "(Red|Blue)"\)/);
    if(winnerMatches)
    {
        data.winner = winnerMatches[1];
    }

    var roundMatches = line.match(/\(round "(.+?)"\)/);
    if(roundMatches)
    {
        data.round = roundMatches[1];
    }

    var secondsMatches = line.match(/\(seconds "(\d+\.\d+)\)"/);
    if(secondsMatches)
    {
        data.seconds = secondsMatches[1];
    }

    return data;
}

var parsePlayerConnect = function(line)
{
    var data = {};
    data.type = 'player_connect';

    var matches = line.match(/"(.+)<\d+><(.+)><.*>" connected, address "(.+):(\d+)"/);
    data.player = {name: matches[1], steamid: matches[2], address: matches[3], port: matches[4]};

    return data;
}

var parsePlayerValidated = function(line)
{
    var data = {};
    data.type = 'player_validated';

    var matches = line.match(/"(.+)<\d+><(.+)><.*>"/);
    data.player = {name: matches[1], steamid: matches[2]};

    return data;
}