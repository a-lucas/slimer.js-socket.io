# slimer.js-socket.io

Adds [SocketIO](http://socket.io/) support inside a [Slimmer.js](https://slimerjs.org/) webpage.

It also works with [Phantom.js](http://phantomjs.org/)


## What for?

If you want to get a safe & performant way to do inter process phamtom.js/slimer.js communication.
 
 Lets say you [spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) a slimer.js webpage from node. Because the [process.send()](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) isn't available inside your webpage, your only way to establish communication with the parent process is with stderr/stdout//stdin, which is a pain.
 
  Socket.io allows you to establish a websocket persistent connection from your webpage to any destination. Not necessarly the parent process.
   
## API

**SlimerIO( socketDomain:string )**

The SlimerIO constructor takes the domain name (Don't forget the prepending http(s)) where it can loads the `socket.io.js` client library from.

Typically, when creating a socket.io server, socket.io will expose `/socket.io/socket.io.js`.

**SlimerIO.createSocket( name: string, serverURL: string, token: string, callback ( SocketClient ) )**
 
 Creates a new socket.io connection to `serverURL`
  
- name:  a unique name to internally identify which connexion is used. Here mainly because I was too lazy to write a uniqID generator.
- serverURL: The address of the socket.io server to connect to
- token: Adds a bit of security, this will be passed as a token parameter. Ex: `io( serverURL + '?token=' + token )`. leave empty if you don't use `allowRequest`
- callback: A function taking a connected `SocketClient` as parameter 


**SocketClient.on(eventName: string, callback: Function)**

Same as [socket.io client on()](http://socket.io/docs/#using-with-node-http-server)

**SocketClient.emit(eventName: string, data: any)**

Same as [socket.io client emit()](http://socket.io/docs/#using-with-node-http-server)

**SocketClient.close()**

Closes the connection.

## How to use: 

```javascript

//This is the domain where you can find the socket.io client file: /socket.io/socket.io.js
const socketDomain = 'http://127.0.0.1:12345';

const slimerIO = new SlimerIO(SocketDomain);

const socketServerUrl1 = 'http://127.0.0.1:8888';
slimerIO.createSocket('SomeName', socketServerUrl1, token, function ( socket) {
        socket.emit('query', 'hello');

        socket.on('answer', (msg) => {
            console.log('Received msg' + msg);
            socket.close();           
        });
    });
    
const socketServerUrl2 = 'http://127.0.0.1:9999';    
slimerIO.createSocket('SomeOtherName', socketServerUrl2, token, function ( socket) {
        socket.emit('query', 'hello');

        socket.on('answer', (msg) => {
            console.log('Received msg' + msg);
            socket.close();           
        });
    });

```

You can open several clients , each of them will have scoped listeners.

The `name` parameter must be unique, it is needed because i was too lazy to write a uniqID generator. Contributions welcome!

## How it works?

It opens a new parrallel webpage, which loads the `SocketDomain/socket.io/socket.io.js` client library.
It then link socket.io's `emit`, `on` and `close` function to this webpage's `evaluate()` 


## A working example is in the example folder

```bash
cd example
npm i
node server.js
```

then in another tab:

```bash
./node_modules/.bin/slimerjs slimer.js

```

## Want to extend it?

PR are welcome

`npm install`
`npm run typings`
`npm run build`