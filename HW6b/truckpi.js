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

var HUMAN_IP;
var TRUCKPI_IP;

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
    width: '50%',
    height: '60%',
    top: '20%',
    left: '50%',
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
var doneButton = blessed.box({
    parent: screen,
    top: '30%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
		type: 'line',
		fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Action Complete{/center}',
    tags: true,
    hoverEffects: {
		bg: 'green'
    },
	hidden: true 
});
doneButton.on('click', function(data) {
	doneFunctionality()
});
screen.key(['d', 'D'], function(ch, key) {
	doneFunctionality();
});

var moveButton = blessed.box({
    parent: screen,
    top: '30%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
		type: 'line',
		fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Move{/center}',
    tags: true,
    hoverEffects: {
		bg: 'green'
    },
	hidden: false
});
moveButton.on('click', function(data) {
	moveFunctionality()
});
screen.key(['m', 'M'], function(ch, key) {
	moveFunctionality();
});

var turninplaceButton = blessed.box({
    parent: screen,
    top: '50%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
		type: 'line',
		fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}TurnInPlace{/center}',
    tags: true,
    hoverEffects: {
		bg: 'green'
    },
	hidden: false
});
turninplaceButton.on('click', function(data) {
	turninplaceFunctionality()
});
screen.key(['p', 'P'], function(ch, key) {
	turninplaceFunctionality();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

moveButton.focus();
turninplaceButton.focus();
doneButton.focus();
screen.render();
/********* END BUTTON ***********/

function moveFunctionality()
{
	var post_data = { myIP : tokenRing.getMyIP() , command : "move" }; 
	generalPOST(TRUCKPI_IP, '/action_move', post_data); 
}

function turninplaceFunctionality()
{
	var post_data = { myIP : tokenRing.getMyIP(), command : "turn in place" }; 
	generalPOST(TRUCKPI_IP, '/action_turninplace', post_data); 
}

function doneFunctionality()
{
	
}

function debugLog( msg ) 
{
	log.insertLine(1, msg);
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

function PostDiscover(ip_address)
{
	var post_data = { ip : tokenRing.getMyIP() };    
        
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
		});
	});

	post_request.on('error', function(e) {
		// no one is home, do nothing
		//if(debug) debugLog('no one at this address: ' + e.message);
	});

	post_request.write(dataString);
	post_request.end();
}

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
}
/***********End Discovery***********************/

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

box.setContent('This node (' + tokenRing.getMyIP() + ') will attempt to send its token to other nodes on network. ');
screen.render();

// Focus our element.
box.focus();

function reqResource()
{
	STATE = REQUEST_STATE;

	reqResourceButton.setContent('');	
	reqResourceButton.style.bg = 'black';
	reqResourceButton.style.fg = '#000000';
	reqResourceButton.hidden = true;
	box.setContent('{center}REQUEST - REQUEST- REQUEST{/center}');
	box.style.bg = 'yellow';
	screen.render();

	highestTS++;
	myTS = highestTS;
	//var everyoneElse = tokenRing.getEveryoneElse(); // returns index
	//debugLog ("Requesting Resource, " + everyoneElse);

	var theRing = tokenRing.getRing(); 
	for (var i = 0; i < theRing.length; i++)
	{
		var post_data = { myTS : myTS, myIP : tokenRing.getMyIP() }; 
		if (theRing[i] != tokenRing.getMyIP())
		{
			PendingReplies.push(theRing[i]);
			generalPOST(theRing[i], '/process_resource_request', post_data);
		}
	}
}

function getNextRequestDeferred()
{
	if (ReqDeferred.length < 1)
		return -1;
	else
		return ReqDeferred.splice(0,1);
}

function processReq(ID, timestamp)
{
	switch(STATE) {
		case GAP_STATE:
			inGapState(ID,timestamp);
			break;
		case REQUEST_STATE:
			inRequestState(ID, timestamp);
			break;
		case WORK_STATE:
			inWorkState(ID,timestamp);
			break;
		default:
			if(debug) debugLog("Not valid state");
	}
}

function inGapState(ID,timestamp)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
    	if(debug) debugLog("request in gap state new timestamp");
	}

	var post_data = { myIP : tokenRing.getMyIP() }; 
	generalPOST(ID, '/resource_approved', post_data); 
}

function inRequestState(ID,timestamp)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
		ReqDeferred.push(ID);
		if(debug) debugLog("request in request state new timestamp");
	}
	else if (timestamp == highestTS)
	{
		if(debug) debugLog("Tiebreaker");
		if (ID > tokenRing.getMyIP())
		{
			ReqDeferred.push(ID);
		}
		else
		{
			var post_data = { myIP : tokenRing.getMyIP() }; 
			generalPOST(ID, '/resource_approved', post_data); 
		}
	}	
	else
	{
		var post_data = { myIP : tokenRing.getMyIP() }; 
		generalPOST(ID, '/resource_approved', post_data);	
	}
}

function inWorkState(ID,timestamp)
{
	ReqDeferred.push(ID);

	if (timestamp > highestTS)
	{
		highestTS = timestamp;
	}
	else if (timestamp == highestTS)
	{
		if(debug) debugLog("BAD inWorkState: timestamp == highestTS");
	}
	else
	{
		if(debug) debugLog("BAD inWorkState: timestamp < highestTS");
	}
}

app.post('/process_resource_request', function(req, res) {
	var the_body = req.body;  

	if(debug) debugLog ( "process_resource_request " + JSON.stringify( the_body) );

	processReq(the_body.myIP, the_body.myTS);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

function processApproval(IP)
{
	if (STATE == REQUEST_STATE && PendingReplies.indexOf(IP) != -1)
	{
		PendingReplies.splice(PendingReplies.indexOf(IP),1);
		if(debug) debugLog("remaining replies: " + PendingReplies);
		if (PendingReplies.length == 0)
		{
			STATE = WORK_STATE;
			reqResourceButton.setContent('{center}RELEASE RESOURCE!!{/center}');	
			reqResourceButton.style.bg = 'red';
			reqResourceButton.style.fg = '#ffffff';
			reqResourceButton.hidden = false;
			box.setContent('{center}SHOTGUN - SHOTGUN - SHOTGUN{/center}');
			box.style.bg = 'red';
			screen.render();
			if(debug) debugLog ( "resource_approved...working");
			var post_data = { reqIP : tokenRing.getMyIP(), worker : node_functionality};
			generalPOST( PICA_IP, '/request_token', post_data);
		}
	}
	else 
	{ 
		if(debug) debugLog ( "I never requested, shouldn't be approving. Node down.");
	}
}

var CS_TOKEN = 0;
var validToken = false;

function generateToken()
{
	CS_TOKEN++;
}

app.post('/request_token', function(req, res) {
	var the_body = req.body;
	if(debug) debugLog("getting token from CA: "+ the_body.reqIP);
	
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});

	/*Verification process here*/
	
	if( validToken == false && the_body.worker == 1 ){
		var post_data = { token : CS_TOKEN };
		validToken = true;
	}
	else
	{
		var post_data = { token : -1 };
	}
	/*Encrypt Message*/
	generalPOST(the_body.reqIP, '/token_received_from_CA', post_data);
});

app.post('/token_received_from_CA', function(req, res) {
	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
	
	/*Dycrypt and Encrypt token with own private key*/

	var post_data = { reqIP : tokenRing.getMyIP() , token : the_body.token };
	generalPOST(PICA_IP, '/request_CS', post_data);
});

function checkToken( token )
{
	if( token == CS_TOKEN )
	{
		return 1;
	}
	else
	{
		return 0;
	}
}

var releaseIP;

function ReleaseCriticalSection()
{
	var post_data = { myIP: tokenRing.getMyIP() };

	generalPOST( releaseIP, '/release_CS', post_data );
}

app.post('/action_move', function(req, res) {
	var the_body = req.body;
	if(debug) debugLog("Sending action " + the_body.command + " to " + TRUCKPI_IP );

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post('/action_turninplace', function(req, res) {
	var the_body = req.body;
	if(debug) debugLog("Sending action " + the_body.command + " to " + TRUCKPI_IP);

	doneButton.setContent('Action Done');	
	doneButton.style.bg = 'red';
	doneButton.style.fg = 'white';
	doneButton.hidden = false;
	
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post('/action_readsensor', function(req, res) {
	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post('/action_turnsensor', function(req, res) {
	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
	if(debug) debugLog("recieved resource approved from : "+ the_body.myIP); 
});

app.post( '/init_PA', function( req, res){

	var the_body = req.body;  
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});

	if(debug) debugLog("recieved HUMAN IP: " + the_body.human_ip );

	HUMAN_IP = the_body.human_ip;
	TRUCKPI_IP = the_body.truckpi_ip;
});

function Broadcast_IP()
{
	var listIPs = tokenRing.getRing();
	
	var post_data = { "human_ip" : HUMAN_IP , "truckpi_ip" : TRUCKPI_IP };
	
	for( var i = 0; i < listIPs.length; i++) 
	{
		if (listIPs[i] != tokenRing.getMyIP())
		{
			if( debug ) debugLog( "Sending to ip: " + listIPs[i] );
			generalPOST( listIPs[i], "/init_PA", post_data );
		}
	}	
}

function initialize()
{
	var ring = tokenRing.getRing();
	var id = tokenRing.indexOf(tokenRing.getMyIP());

	if ( node_functionality == 0 )
	{
		HUMAN_IP = tokenRing.getMyIP();
		setTimeout( Broadcast_IP, 3000 );
	}
	else if( node_functionality == 1 )
	{
		box.setContent('{center}TRUCKPI - TRUCKPI - TRUCKPI{/center}');
		box.style.bg = 'green';
		screen.render();
		TRUCKPI_IP = tokenRing.getMyIP();
		setTimeout( Broadcast_IP, 3000 );
	}
}

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
	setTimeout( initialize, 4000  );
	//generalPOST(nextPendingRequest, '/resource_approved', post_data); 
});
