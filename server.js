/**
 * Created by Ranndom on 12/15/2014.
 */

// Requirements
var dgram = require('dgram');
var fs = require('fs');
var parse = require('./parse');

// Create the UDP socket
var socket = dgram.createSocket('udp4');

// Finally bind the socket.
socket.bind(1025, '0.0.0.0');

//
var modules = [];

// Load modules
fs.readdir("modules", function(err, files)
{
    files.forEach(function(file)
    {
        if(file.indexOf(".js") == file.length - 3)
        {
            console.log("[MODULES] Loaded module " + file);
            var module = require('./modules/' + file);

            // Add module to array.
            modules.push({name: file, module: module});

            // Execute init function, if it exists.
            if(typeof(module.init) == 'function')
            {
                module.init();
            }
            else
            {
                console.log("[MODULES] Module %s does not contain a init() function, bug the author to fix it!", file);
            }
        }
    });
});

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

    //console.log("[SOCKET] Server received " + msg + " from " + rinfo.address + ":" + rinfo.port);

    modules.forEach(function(module)
    {
        if(typeof(module.module.parse) == 'function')
        {
            module.module.parse(data.type, data);
        }
        else
        {
            console.log("[MODULES] Module %s does not contain a parse() function, bug the author to fix it!", module.name);
        }
    });
});

// Socket listening
socket.on('listening', function()
{
    var address = socket.address();
    console.log("[SOCKET] Bound to port " + address.address + ":" + address.port);
});