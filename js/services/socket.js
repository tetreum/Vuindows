var W3CWebSocket = require('websocket').w3cwebsocket;

class Sockets {

    constructor () {
        this.requests = {};
    }

    connect () {
        return new Promise((resolve, reject) => {
            this.client = new W3CWebSocket('ws://' + location.host + '/', localStorage.getItem("token"));

            this.client.onopen = () => {
                console.log('WebSocket Client Connected');
                resolve();
            };
    
            this.client.onmessage = (e) => {
                if (typeof e.data === 'string') {
                    this.parseResponse(e.data);
                }
            };

            this.client.onclose = (e) => {
                document.dispatchEvent(new CustomEvent("server-status", {
                    detail: { status: 2 }
                }));
            };
        });
    }

    parseResponse (response) {
        try {
            const json = JSON.parse(response);
            console.log("Received:", json);

            if (typeof json._uuid === "undefined" || typeof this.requests[json._uuid] === "undefined") {
                console.error("Received: '" + response + "'");
                return;
            }
            if (json.error > 0) {
                this.requests[json._uuid].reject(json);
            } else {
                this.requests[json._uuid].resolve(json.response);
            }
            delete(this.requests[json._uuid]);
        } catch (e) {
            console.error("Received: '" + response + "'");
        }
    }

    request (action, params = {}) {
        return new Promise((resolve, reject) => {
            const uuid = this.generateUUID();
            this.requests[uuid] = {
                resolve,
                reject,
            };

            params._action = action;
            params._uuid = uuid;

            this.client.send(JSON.stringify(params));
        });
    }

    // https://stackoverflow.com/questions/105034/how-to-create-guid-uuid
    generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
}

module.exports = new Sockets();