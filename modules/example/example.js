/**
 * Created by Ranndom on 12/15/2014.
 *
 * Example module for TF2-Logger.
 */

module.exports = function(events, logger)
{

    // Module loaded successfully.
    logger.info("Example module successfully loaded.");

    // Called whenever a line is parsed.
    events.on('parse', function(type, data)
    {
        if(data.length != 0)
            console.dir(data);
    });

};