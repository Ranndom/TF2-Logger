/**
 * Created by Ranndom on 12/15/2014.
 */

// Requirements
var dgram = require('dgram');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var parse = require('./parse');

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
                        console.log("[MODULES] Loaded module %s v%s", moduleJSON.name, moduleJSON.version);
                        require("./modules/" + file + "/" + moduleJSON.main)(events);
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
    console.log("[SOCKET] Server error: " + err);
});

// Socket message
socket.on('message', function(msg, rinfo)
{
    msg = msg.toString().substring(4);
    var data = parse.parseLine(msg);

    console.log("[PARSER] %s", msg);

    events.emit('parse', data.type, data);
});

// Socket listening
socket.on('listening', function()
{
    var address = socket.address();
    console.log("[SOCKET] Bound to port " + address.address + ":" + address.port);
});