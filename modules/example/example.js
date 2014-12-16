/**
 * Created by Ranndom on 12/15/2014.
 *
 * Example module for TF2-Logger.
 */

module.exports = function(events)
{

    console.log("Example module successfully loaded.");

    events.on('parse', function(type, data)
    {
        if(data.length != 0)
            console.dir(data);
    });

};