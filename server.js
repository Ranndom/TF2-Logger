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
                            var error = false;

                            try
                            {
                                require("./modules/" + file + "/" + moduleJSON.main)(events, logger);
                            }
                            catch(err)
                            {
                                error = true;
                                if(err.code == 'MODULE_NOT_FOUND')
                                {
                                    logger.error("Failed to load module %s v%s, couldn't find file %s", moduleJSON.name, moduleJSON.version, moduleJSON.main);
                                }
                            }

                            if(!error)
                                logger.info("Loaded module %s v%s", moduleJSON.name, moduleJSON.version);
                        }
                    }
                });
            }
        });
    });
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

    if(data.error)
        events.emit('parse-err', data.error);
    else
        events.emit('parse', data.type, data);
});

// Socket listening
socket.on('listening', function()
{
    var address = socket.address();
    logger.info("Bound to port %s:%d", address.address, address.port);
});