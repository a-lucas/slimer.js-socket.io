var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('*', function(req, res, next) {
    console.log(req.url);
    next();
});

app.get('/', function(req, res){
    res.send('hi there!');
});

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('query', function(val) {
        console.log(val);
        socket.emit('answer', 'My name is not ' + val + '.');
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});