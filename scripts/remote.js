class SmashmemeRemote {
    constructor(sendFunction) {
        this.send = sendFunction;
        this.selfId = null;
        this.game = null;
        this.debug = false;
    }
    onReceive(data) {
        if (this.debug) console.log("Server: ", data);
        if (data.error) console.error("Server: ", data.error);
        switch (data.type) {
            case "welcome":
                this.selfId = data.id;
                break;
            case "join":
                this.game = new RemoteGame(data.game, this.selfId, data => this.send({ type:"game", sub:data }));
                this.game.debug = this.debug;
                break;
            case "leave":
                this.game = null;
                break;
            case "game":
                this.game.onReceive(data.sub);
                break;
        }
    }
    join() {
        this.send({ type: "join" });
    }
    leave() {
        this.send({ type: "leave" });
    }
}