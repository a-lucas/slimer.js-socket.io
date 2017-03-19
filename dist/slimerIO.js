(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var webpage = require('webpage');
    var SlimerIO = (function () {
        function SlimerIO(url) {
            this.initialized = false;
            this.pendingClients = [];
            this.slimerSockets = {};
            this.initializePage(url);
        }
        SlimerIO.prototype.createSocket = function (name, url, token, callback) {
            if (this.initialized) {
                this.slimerSockets[name] = new SlimerSocket(name, url, token, this.page);
                callback(this.slimerSockets[name]);
            }
            else {
                this.pendingClients.push({
                    name: name,
                    url: url,
                    token: token,
                    callback: callback
                });
            }
        };
        SlimerIO.prototype.initializePage = function (url) {
            var _this = this;
            this.page = webpage.create();
            this.page.onLoadFinished = function (status) {
                _this.initialized = true;
                var newClient;
                if (_this.pendingClients.length !== 0) {
                    while (newClient = _this.pendingClients.shift()) {
                        _this.createSocket(newClient.name, newClient.url, newClient.token, newClient.callback);
                    }
                }
                _this.page.onCallback = function (data) {
                    _this.fireOnEvent(data);
                };
            };
            var content = "<html><body>\n    <script type=\"text/javascript\" src=\"" + url + "/socket.io/socket.io.js\"></script>\n    </body></html>";
            this.page.setContent(content, 'http://www.whatever.com');
        };
        SlimerIO.prototype.fireOnEvent = function (data) {
            this.slimerSockets[data.name].fireOnEvent(data.event, data.data);
        };
        return SlimerIO;
    }());
    exports.SlimerIO = SlimerIO;
    var SlimerSocket = (function () {
        function SlimerSocket(name, url, token, page) {
            this.name = name;
            this.page = page;
            this.onListeners = {};
            this.page.evaluate(function (name, url, token) {
                if (typeof window['socket'] === 'undefined') {
                    window['socket'] = {};
                }
                var socket = window['io'](url + '?token=' + token);
                socket.on('connect', function () { });
                window['socket'][name] = socket;
            }, name, url, token);
        }
        SlimerSocket.prototype.addOnListener = function (event, listener) {
            if (!this.onListeners[event]) {
                this.onListeners[event] = [];
            }
            this.onListeners[event].push(listener);
        };
        ;
        SlimerSocket.prototype.fireOnEvent = function (event, data) {
            if (!this.onListeners[event]) {
                return;
            }
            this.onListeners[event].forEach(function (listener) {
                listener(data);
            });
        };
        SlimerSocket.prototype.on = function (event, callback) {
            this.addOnListener(event, callback);
            this.page.evaluate(function (name, event) {
                window['socket'][name].on(event, function (data) {
                    window['callPhantom']({
                        name: name,
                        event: event,
                        data: data
                    });
                });
            }, this.name, event);
        };
        ;
        SlimerSocket.prototype.emit = function (event, message) {
            var success = this.page.evaluate(function (name, event, message) {
                window['socket'][name].emit(event, message);
                return true;
            }, this.name, event, message);
            if (success !== true) {
                throw new Error('Failure while emitting the message.');
            }
        };
        ;
        SlimerSocket.prototype.close = function () {
            var success = this.page.evaluate(function (name) {
                window['socket'][name].close();
                return true;
            }, this.name);
            if (success !== true) {
                throw new Error('Failure while closing the socket.');
            }
        };
        ;
        return SlimerSocket;
    }());
    exports.SlimerSocket = SlimerSocket;
});
