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

// Input 0
var HOST_IP;

//Input 1
var TRUCK_IP;

//Input 2
var GoPiGo_IP;

//Input 3
var Grove_Sensor_IP;

//Input 4
var Human_Sensor_IP;

//Input 5 
var Human_Sensor_IP2;

var debug = true;


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

var myArgs = process.argv.slice(2);

if( !myArgs[0] ) myArgs[0] = -1;

var node_functionality = myArgs[0];


// Create a screen object.

function debugLog( msg ) 
{
	log.insertLine(1, msg);
	screen.render();
	return;
}

function generalPOST ( genHost, genPath, post_data, err, res )
{
	// check if arg param err does not exist
	if (typeof(err) != "function")
	{
		err = function(e) 
		{
			if(debug) debugLog("Lost connection to " + genHost + "removing from ring");

			tokenRing.removeRingMember(genHost);

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

function PostDiscover(ip_address)
{
	var post_data = { ip : tokenRing.getMyIP(), role: node_functionality };    
        
	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: ip_address,
		port: '3000',
		path: '/do_discover',
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
			var resultObject = JSON.parse(responseString);
			debugLog(resultObject);
			tokenRing.addRingMember(resultObject.ip);

		var i = parseInt(resultObject.role);

		debugLog( "Role responce: " + resultObject.role );
		debugLog( JSON.stringify( resultObject ) );

		switch (i){
			case 0:
				HOST_IP = resultObject.ip;
				break;
			case 1:
				TRUCK_IP = resultObject.ip;
				break;
			case 2:
				GoPiGo_IP = resultObject.ip;
				break;
			case 3:
				Grove_Sensor_IP = resultObject.ip;
				break;
			case 4:
				Human_Sensor_IP = resultObject.ip;
				break;
			case 5:
				Human_Sensor2_IP = resultObject.ip;
				break;
			default:
				if(debug) debugLog( "which not Special type" + resultObject.role );	
		}

		});
	});

	post_request.on('error', function(e) {
		// no one is home, do nothing
		//if(debug) debugLog('no one at this address: ' + e.message);
	});

	post_request.write(dataString);
	post_request.end();
}
var keepAliveTimeout = 1000;


app.post('/do_discover', function(req, res) {
	var the_body = req.body;  //see connect package above
	if(debug) debugLog ( "discovery received: " + JSON.stringify( the_body) );

	tokenRing.addRingMember(the_body.ip);

	var i = parseInt(the_body.role);

	debugLog( "recieved role: " + i );

	switch (i){
		case 0:
			HOST_IP = the_body.ip;
			break;
		case 1:
			TRUCK_IP = the_body.ip;
			break;
		case 2:
			GoPiGo_IP = the_body.ip;
			break;
		case 3:
			Grove_Sensor_IP = the_body.ip;
			break;
		case 4:
			Human_Sensor_IP = the_body.ip;
			break;
		case 5:
			Human_Sensor2_IP = the_body.ip;
			break;
		default:
			if(debug) debugLog( "which not Special type" + the_body.role );	
	}

	var post_data = { ip : tokenRing.getMyIP(), role: node_functionality };    

	res.json( post_data );
});

var keepAliveTimeout = 1000;

function discover() 
{
	box.style.bg = 'red';
    log.focus();
    screen.render();

    if(debug) debugLog("Starting Discovery");
	//limit the scanning range
	var start_ip = 100;
	var end_ip   = 120;
   
	//we are assuming a subnet mask of 255.255.255.0

	//break it up to extract what we need 
	var ip_add = tokenRing.getMyIP().split(".");

	//put it back together without the last part
	var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
	if(debug) debugLog("Base ip address : " +  base_add);

	for(var i = start_ip; i < end_ip; i++)
	{      
		var ip = base_add + i.toString();

		if(!tokenRing.isMember(ip))
		{
			PostDiscover(ip);
		}
	}

	setTimeout( keepAlive, keepAliveTimeout);
}
/***********End Discovery***********************/


        
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
	var sresponse = {"ip" :  tokenRing.getMyIP(), "isFull" : isFull};
	generalPOST(HOST_IP, '/do_sensor_response', sresponse);
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
app.post('/do_discover', function(req, res) {
	var the_body = req.body;  //see connect package above
	if(debug) debugLog ( "discovery received: " + JSON.stringify( the_body) );

	tokenRing.addRingMember(the_body.ip);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});


var keepAliveTimeout = 1000;

function discover() 
{
	box.style.bg = 'red';
    log.focus();
    screen.render();

    if(debug) debugLog("Starting Discovery");
	//limit the scanning range
	var start_ip = 100;
	var end_ip   = 120;
   
	//we are assuming a subnet mask of 255.255.255.0

	//break it up to extract what we need 
	var ip_add = tokenRing.getMyIP().split(".");

	//put it back together without the last part
	var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
	if(debug) debugLog("Base ip address : " +  base_add);

	for(var i = start_ip; i < end_ip; i++)
	{      
		var ip = base_add + i.toString();

		if(!tokenRing.isMember(ip))
		{
			PostDiscover(ip);
		}
	}

	setTimeout( keepAlive, keepAliveTimeout);
}
/***********End Discovery***********************/

var count = 0;

/* Function to check if other devices are there. */
function keepAlive()
{
	//debugLog("Calling keepalive " );
	var listIPs = tokenRing.getRing();
	count++;
	for( var i = 0; i < listIPs.length; i++) 
	{
		var post_data = { myIP : i };
		if (listIPs[i] != tokenRing.getMyIP())
		{
			generalPOST ( listIPs[i], '/do_keepalive', post_data );
		}
	}
	
	setTimeout( keepAlive, keepAliveTimeout );
}

/*
 * General function to replace separate functions for all different types of    s
 * posts, e.g. winner, election
 */


app.post('/do_keepalive', function(req, res) {
	res.json(req.body);
	var the_body = req.body;  //see connect package above
});


// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
});
