/**
 * Created by Ranndom on 12/16/2014.
 */

var winston = require('winston');

var winston = new (winston.Logger)(
{
    transports:
    [
            new (winston.transports.Console)({level: 'debug'})
    ]
});

winston.info("Winston successfully initialised");

module.exports = winston;