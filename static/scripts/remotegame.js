class RemoteGame extends Game {
    constructor(address) {
        super();
        this.ws = new WebSocket(address);
    }
}