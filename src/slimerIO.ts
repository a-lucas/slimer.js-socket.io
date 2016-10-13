const webpage = require('webpage');

interface ISlimerSockets {
    [name: string]: SlimerSocket
}

interface pendingClient {
    name: string,
    url: string,
    token: string,
    callback: Function
}

interface ISocketEvent {
    name: string,
    event: string,
    data: any
}

export  class SlimerIO {
    private page;
    private initialized:boolean = false;
    private pendingClients: pendingClient[] = [];

    private slimerSockets: ISlimerSockets = {};

    constructor(url:string) {
        this.initializePage(url);
    }

    public createSocket(name:string, url:string, token:string, callback:Function) {
        if (this.initialized) {
            this.slimerSockets[name] = new SlimerSocket(name, url, token, this.page);
            callback(this.slimerSockets[name]);
        } else {
            this.pendingClients.push({
                name: name,
                url: url,
                token: token,
                callback: callback
            });
        }
    }

    private initializePage(url: string) {
        this.page = webpage.create();

        this.page.onLoadFinished = (status) => {
            this.initialized = true;
            let newClient;

            if (this.pendingClients.length !== 0) {
                while (newClient = this.pendingClients.shift()) {
                    this.createSocket(newClient.name, newClient.url, newClient.token, newClient.callback);
                }
            }

            this.page.onCallback = (data: ISocketEvent) => {
                this.fireOnEvent(data);
            };
        };

        const content = `<html><body>
    <script type="text/javascript" src="${url}/socket.io/socket.io.js"></script>
    </body></html>`;

        this.page.setContent(content, 'http://www.whatever.com');
    }

    private fireOnEvent(data: ISocketEvent) {
        this.slimerSockets[data.name].fireOnEvent(data.event, data.data);
    }

}

export class SlimerSocket {

    private onListeners = {};

    constructor(private name, url, token, private page) {

        this.page.evaluate((name :string, url:string, token:string) => {
            if (typeof window['socket'] === 'undefined') {
                window['socket'] = {};
            }
            const socket:SocketIOClient.Socket = window['io'](url + '?token=' + token);
            socket.on('connect', () => {});
            window['socket'][name] = socket;
        },name,  url, token);

    }

    private addOnListener ( event:string, listener:Function) {
        if (!this.onListeners[event]) {
            this.onListeners[event] = [];
        }
        this.onListeners[event].push(listener);
    };

    public fireOnEvent  (event:string, data:any) {
        if (!this.onListeners[event]) {
            return;
        }
        this.onListeners[event].forEach((listener) => {
            listener(data);
        });
    }

    on(event:string, callback:Function) {
        this.addOnListener(event, callback);

        this.page.evaluate((name:string, event:string) => {
            window['socket'][name].on(event, (data) => {
                window['callPhantom']({
                    name: name,
                    event: event,
                    data: data
                });
            });
        }, this.name, event);
    };

    emit(event:string, message:any) {
        var success = this.page.evaluate((name, event, message) => {
            window['socket'][name].emit(event, message);
            return true;
        }, this.name, event, message);

        if (success !== true) {
            throw new Error('Failure while emitting the message.');
        }
    };

    close() {
        var success = this.page.evaluate((name) => {
            window['socket'][name].close();
            return true;
        }, this.name);
        if (success !== true) {
            throw new Error('Failure while closing the socket.');
        }
    };
}