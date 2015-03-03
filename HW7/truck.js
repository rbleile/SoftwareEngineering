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

var debug = true;
tokenRing.debugMessages(false);

var myArgs = process.argv.slice(2);

if( !myArgs[0] ) myArgs[0] = -1;

var node_functionality = myArgs[0];

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
var Human_Sensor2_IP;

//Input 6
var Bag_IP

// Create a screen object.
var screen = blessed.screen();

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
    height: '60%',
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
    content: '{center}TRUCK - TRUCK - TRUCK{/center}',
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
var doneButton = blessed.box({
    parent: screen,
    top: '80%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}D = Action Completed{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: true 
});
doneButton.on('click', function(data) {
    doneFunctionality();
});
screen.key(['d', 'D'], function(ch, key) {
    doneFunctionality();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

doneButton.focus();
screen.render();
/********* END BUTTON ***********/

function doneFunctionality()
{
	doneButton.setContent('');
	doneButton.style.fg = "black";
	doneButton.style.bg = "black";
	doneButton.hidden = true;
	screen.render();

	var post_data = { myIP : tokenRing.getMyIP() };
	//if (debug) debugLog ("HOST_IP: " + HOST_IP);
	generalPOST(HOST_IP, '/action_completed', post_data);
}

function debugLog( msg ) 
{
	log.insertLine(0, msg);
	screen.render();
	return;
}

app.set('port', process.env.PORT || 3000);

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests
app.post('/do_discover', function(req, res) {
	var the_body = req.body;  //see connect package above
	if(debug) debugLog ( "Discovery received: " + JSON.stringify( the_body) );

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

		//debugLog( "Role responce: " + resultObject.role );
		if (debug) debugLog("Received: " + JSON.stringify( resultObject ));

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


/* Function to check if other devices are there. */
function keepAlive()
{
	//debugLog("Calling keepalive " );
	var listIPs = tokenRing.getRing();
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

			//processApproval(genHost);

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


function displayButton()
{
	doneButton.setContent( "{center}D = Action Completed{/center}");
	doneButton.style.bg = "green";
	doneButton.style.fg = "white";
	doneButton.hidden = false;
	screen.render();
}
app.post('/action_move', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: " + the_body.command + " " + the_body.inpdirection + " " + the_body.inpdistance + "inches at a speed of " + the_body.inpspeed );
    res.json(req.body);
	 displayButton();
});

app.post('/action_turninplace', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: " + the_body.command + " " + the_body.inpdegrees + " degrees");
    res.json(req.body);
    displayButton();
});

app.post('/action_turnsensor', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: " + the_body.command + " " + the_body.inpdegrees + " degrees");
    res.json(req.body);
    displayButton();
});

var count = 0;
app.post('/action_readsensor', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: " + the_body.command);
	//log2.insertLine(0, "Object is " + JSON.stringify(the_body.inpdistance) + " inches away" );
    res.json(req.body);
	count++;
	var post_data = { objdistance : count };
	generalPOST(HOST_IP, '/do_resultsreadsensor', post_data);
    displayButton();
});

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
});
