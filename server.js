/**
 * Created by Ranndom on 12/15/2014.
 */

// Requirements
var dgram = require('dgram');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var parse = require('./parse');
var logger = require('./util/logger');
var selfJSON = require('./package.json');

// Create the UDP socket
var socket = dgram.createSocket('udp4');
var events = new EventEmitter();

var numModules = 0;

// Load modules
fs.readdir("modules", function(err, files)
{
    files.forEach(function(file)
    {
        fs.stat("modules/" + file, function(err, stats)
        {
            if(err) throw err;
            if(stats.isDirectory())
            {
                fs.exists("modules/" + file + "/module.json", function(moduleJSONExists)
                {
                    if(moduleJSONExists)
                    {
                        var moduleJSON = require("./modules/" + file + "/module.json");

                        var versionPieces = moduleJSON.targetVersion.split('.');
                        var selfVersionPieces = selfJSON.version.split('.');

                        if(parseInt(versionPieces[0]) != parseInt(selfVersionPieces[0]))
                        {
                            // Uh-oh! Incompatible module version!
                            logger.info("Failed loading module %s -- module targets version %s, current version %s", moduleJSON.name, moduleJSON.targetVersion, selfJSON.version);
                        }
                        else
                        {
                            logger.info("Loaded module %s v%s", moduleJSON.name, moduleJSON.version);
                            require("./modules/" + file + "/" + moduleJSON.main)(events, logger);

                            numModules++;
                        }
                    }
                });
            }
        });
    });

    if(numModules == 0)
    {
        logger.warn("No modules were loaded! Check modules directory?");
    }
});

// Finally bind the socket.
socket.bind(1025, '0.0.0.0');

// Socket error
socket.on('error', function(err)
{
    logger.error("Server error: %s", err);
});

// Socket message
socket.on('message', function(msg, rinfo)
{
    msg = msg.toString().substring(4);
    var data = parse.parseLine(msg);

    logger.debug("%s", msg);

    events.emit('parse', data.type, data);
});

// Socket listening
socket.on('listening', function()
{
    var address = socket.address();
    logger.info("Bound to port %s:%d", address.address, address.port);
});