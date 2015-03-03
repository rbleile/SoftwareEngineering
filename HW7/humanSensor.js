var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var screen = blessed.screen();

tokenRing.setRole(3);
var bay_Number = 1; 
var log = blessed.scrollabletext({
    parent: screen,
    mouse: true,
    keys: true,
    vi: true,
    border: {
	type: 'line',
	fg: '#00ff00'
    },
    scrollbar: {
	fg: 'blue',
	ch: '|'
    },
    width: '100%',
    height: '40%',
    top: '20%',
    left: 'left',
    align: 'left',
    tags: true
});


tokenRing.debugMessages(false);



// Create a screen object.

function debugLog( msg ) 
{
	log.insertLine(1, msg);
	screen.render();
	return;
}

        
var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '20%',
    content: '',
    tags: true,
    border: {
	type: 'line',
	fg: 'white'
    },
    style: {
	fg: 'white',
	bg: 'black',
	border: {
	    fg: '#f0f0f0'
	}
    }
});

/********* BUTTON CODE *********/
var isEmptyButton = blessed.box({
    parent: screen,
    top: '80%',
    height: '30%',
    width: '50%',
    left: '0%',
    border: {
	type: 'line',
	fg: '#ff0000'
    },
    fg: '#ffffff',
    bg: '#ff0000',
    content: '{center}Bay is Empty{/center}',
    tags: true,
    hoverEffects: {
	bg: 'green'
    },
	hidden: false
});



var isFullButton = blessed.box({
    parent: screen,
    top: '80%',
    height: '30%',
    width: '50%',
    left: '50%',
    border: {
	type: 'line',
	fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Bay is Full{/center}',
    tags: true,
    hoverEffects: {
	bg: 'red'
    },
	hidden: false
});

function sendCommandResposne(isFull)
{
	debugLog("HUMAN has responded. Initiating response to master control BAG.");
	//isFullButton.setContent("");
	//isEmptyButton.setContent("");
	//isFullButton.hidden = true;
	//isEmptyButton.hidden = true;
	screen.render();
	var sresponse = {"ip" :  tokenRing.getMyIP(), "isFull" : isFull , bayNumber : bay_Number};
	tokenRing.generalPOST(HOST_IP, '/do_sensor_update', sresponse);
}

isEmptyButton.on('click', function(data) {
	
	sendCommandResposne(false);
});

isFullButton.on('click', function(data) {
	sendCommandResposne(true);
});

screen.key(['z', 'Z'], function(ch, key) {
	sendCommandResposne(false);
});

screen.key(['x', 'X'], function(ch, key) {
	sendCommandResposne(true);
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

isFullButton.focus();
app.post('/do_sensor', function(req, res) {
	var the_body = req.body;  //see connect package above
	debugLog("HUMAN : Pi demands to know if bay is FULL or EMPTY.");
	isFullButton.hidden = false;
	isEmptyButton.hidden = false;
	screen.render();
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

screen.render();



app.set('port', process.env.PORT || 3000);

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests




// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	debugLog("I am bay "+bay_Number);
});