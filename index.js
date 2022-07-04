const express = require("express");
const ws = require("ws");
const SmashmemeServer = require("./server");

// Create HTTP server
const app = express();
const port = 13028;

var publicDirectories = ["models", "maps", "behaviours", "scripts"];
for (let publicDirectory of publicDirectories) {
    app.get(`/${publicDirectory}/*`, (req, res, next) => {
        res.sendFile(__dirname + "/" + publicDirectory + "/" + req.params[0], {}, function (err) {
            if (err)
                next();
        });
    });
}

app.get(`/*`, (req, res, next) => {
    res.sendFile(__dirname + "/static/" + req.params[0], {}, function (err) {
        if (err) {
            res.status(404);
            res.send("Not found");
        }
    });
});

// Create WS server
const wsServer = new ws.Server({ noServer: true });
const wsClients = {};
var kId = 0;
function wsSend(id, data) {
    if (wsClients[id])
        wsClients[id].send(JSON.stringify(data));
}

// Create Smashmeme server
const smashmemeServer = new SmashmemeServer(wsSend);
smashmemeServer.debug = true;

// Listen for connections on WS server
wsServer.on('connection', socket => {
    socket.id = ++kId;
    wsClients[socket.id] = socket;
    smashmemeServer.onConnection(socket.id);
    socket.on('message', (data, isBinary) => {
        var message = isBinary ? data : data.toString();
        smashmemeServer.onReceive(socket.id, JSON.parse(message));
    });
    socket.on('close', socket => {
        smashmemeServer.onDisconnection(socket.id);
    });
});

// Start HTTP Server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});