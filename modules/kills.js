/**
 * Created by Ranndom on 12/15/2014.
 */

var exports = module.exports;

exports.init = function()
{
    console.log("Kills module successfully loaded.");
}

exports.parse = function(type, data)
{
    if(type == 'kill')
    {
        console.log("%s got a kill on %s using %s", data.attacker.name, data.victim.name, data.weapon);
    }
}