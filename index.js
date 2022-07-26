const express = require("express");
const ws = require("ws");
const SmashmemeServer = require("./server");

// Create HTTP server
const app = express();
const port = process.env.PORT || 13028;

var publicDirectories = ["models", "maps", "smashers", "scripts"];
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
            res.sendFile(__dirname + "/errors/404.html");
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
smashmemeServer.debug = false;

// Listen for connections on WS server
wsServer.on('connection', socket => {
    socket.id = ++kId;
    wsClients[socket.id] = socket;
    smashmemeServer.onConnection(socket.id);
    socket.on('message', (data, isBinary) => {
        var message = isBinary ? data : data.toString();
        try {
            message = JSON.parse(message);
        } catch (e) {
            return;
        }
        smashmemeServer.onReceive(socket.id, message);
    });
    socket.on('close', () => {
        smashmemeServer.onDisconnection(socket.id);
    });
});

// Start HTTP Server
const server = app.listen(port, () => {
    console.info(`Server is running on port ${port}.`);
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});