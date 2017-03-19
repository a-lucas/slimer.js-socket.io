var SlimerIO = require('./../dist/slimerIO.js');
var webpage = require('webpage');
var socketDomain = 'http://localhost:3000';

const slimerIO = new SlimerIO.SlimerIO(socketDomain);

const socketServerUrl1 = socketDomain;
slimerIO.createSocket('SomeName', socketServerUrl1, 'abc', function ( socket) {

    socket.emit('query', 'hello');

    socket.on('answer', function(msg) {
        console.log('Received msg' + msg);
        socket.close();
    });
});

webpage.create()
    .open('http://localhost:3000') // loads a page
    .then(function(){ // executed after loading




        // store a screenshot of the page
        webpage.viewportSize =
            { width:650, height:320 };
        webpage.render('page.png',
            {onlyViewport:true});
        // then open a second page
        slimer.exit();
    });