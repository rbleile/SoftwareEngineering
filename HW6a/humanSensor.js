var http = require('http');
var express = require('express');
var connect = require("connect");
var bodyParser = require('body-parser');
var app = express();
var blessed = require('blessed');
var screen = blessed.screen();
var tokenRing = require('./TokenRingManager');
//var PythonShell = require('python-shell');
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;
tokenRing.debugMessages(false);

var myArgs = process.argv.slice(2);

if( !myArgs[0] ) myArgs[0] = -1;

var node_functionality = myArgs[0];

var PICA_IP;

// Create a screen object.


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
	hidden: true
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
	hidden: true
});

function sendCommandResposne(isFull)
{
	debugLog("HUMAN has responded. Initiating response to master control.");
	isFullButton.setContent("");
	isEmptyButton.setContent("");
	isFullButton.hidden = true;
	isEmptyButton.hidden = true;
	screen.render();
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
screen.render();
/********* END BUTTON ***********/

function debugLog( msg ) 
{
	log.insertLine(1,msg);
	screen.render();
	return;
}

 app.set('port', process.env.PORT || 3000);

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests
app.post('/do_discover', function(req, res) {
	var the_body = req.body;  //see connect package above
	if(debug) debugLog ( "discovery received: " + JSON.stringify( the_body) );

	tokenRing.addRingMember(the_body.ip);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post('/do_sensor', function(req, res) {
	var the_body = req.body;  //see connect package above
	debugLog("HUMAN : Pi demands to know if bay is FULL or EMPTY.");
	isFullButton.hidden = false;
	isEmptyButton.hidden = false;
	screen.render();
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});


/*
 * General function to replace separate functions for all different types of
 * posts, e.g. winner, election
 */
function generalPOST ( genHost, genPath, post_data, err, res )
{
	// check if arg param err does not exist
	if (typeof(err) != "function")
	{
		err = function(e) 
		{
			if(debug) debugLog("Lost connection to " + genHost + "removing from ring");

			tokenRing.removeRingMember(genHost);

			processApproval(genHost);

			if(debug) debugLog("generalPOST err called "+ e);
		};
	}

	// check if arg param res does not exist
	if (typeof(res) != "function")
	{
		res = function(r) {} ;
	}

	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: genHost,
		port: '3000',
		path: genPath,
		method: 'POST',
		headers: headers
	};

	var post_request = http.request(post_options, function(res){
		res.setEncoding('utf-8');
		
		var responseString = '';

		res.on('data', function(data){
			responseString += data;
		});

		res.on('end', function(){
			//var resultObject = JSON.parse(responseString);
		});
	});
	
	post_request.on('error', err );
	post_request.write(dataString);
	post_request.end();
}

app.post('/do_keepalive', function(req, res) {
	res.json(req.body);
	var the_body = req.body;  //see connect package above
});

box.setContent('this node (' + tokenRing.getMyIP() + ') will attempt to send its token to other nodes on network. ');
screen.render();

// Focus our element.
box.focus();


app.post('/process_resource_request', function(req, res) {
	var the_body = req.body;  

	//if(debug) debugLog ( "process_resource_request " + JSON.stringify( the_body) );



	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

var options = {
  mode: 'text',
  pythonPath: '/usr/bin/python',
  pythonOptions: ['-u'],
  scriptPath: '/home/pi/GrovePi/Software/Python',
  //args: ['value1', 'value2', 'value3']
};
var isFull =false;
app.get('/do_get_dist', function (req, res){
	var the_body = req.query;
//	var isFull = false;
	PythonShell.run('one_ultra.py', options, function (err, results) {
	if (err) throw err;
	  // results is an array consisting of messages collected during execution 
	  console.log('results: %j', results);
	  if(results[0] < 50) isFull = true;
          console.log("is full : " + isFull + " "+results[0]);	
	});
	res.json({"isFull" : isFull});
});


// Render the screen.
//screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	//discover();
	debugLog( "Discovery Complete" );
	//debugLog.setContent("");
	//setTimeout( initializePICA, 4000  );
});
var http = require('http');
