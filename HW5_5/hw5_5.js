var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');
var whiteList = require('./TokenRingManager');

var sha1 = require('./SHA1Encryption');

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
var screen = blessed.screen();

var log = blessed.scrollabletext({
    parent: screen,
    mouse: true,
    keys: false,
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
var reqResourceButton = blessed.box({
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
    content: '{center}Z = Request Resource{/center}',
    tags: true,
    hoverEffects: {
		bg: 'green'
    },
	hidden: true
});

reqResourceButton.on('click', function(data) {
	if (STATE == GAP_STATE)
		reqResource();
	else if (STATE == WORK_STATE)
		if(debug) debugLog( "Pending CS Return" );
		//releaseShotgun();
});

screen.key(['z', 'Z'], function(ch, key) {
	if (STATE == GAP_STATE)
		reqResource();
	else if (STATE == WORK_STATE)
		if(debug) debugLog( "Pending CS Return" );
		//releaseShotgun();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

//reqResourceButton.focus();

/*****
 * Begin password code:
 */
var password = ''; //<--- Loop and wait for this to be non-zero.
var password_hash = '';

var passwordBox = blessed.textbox({
	top: '40%',
	left: '30%',
	width: '40%',
	height: '30%',
	//content: '',
	tags: false,
	censor: true,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},
	style: {
		fg: 'white',
		bg: 'blue',
		border: {
			fg: 'white'
		}
	},
});

passwordBox.setLabel({
	text: 'Enter a PASSWORD:',
	side: 'left'
});

passwordBox.on('submit', function() {
	password = passwordBox.value;
	password_hash = sha1.hash(password);

	debugLog("Password entered: " + password);
	debugLog("Password encrypt: " + password_hash);

	passwordBox.hide();
	screen.remove(passwordBox);
	screen.render();
});

screen.append(passwordBox);
passwordBox.focus();
/*
 * ...end of password code.
 **********/

screen.render();
/********* END BUTTON ***********/

function debugLog( msg ) 
{
	log.insertLine(1, ""+highestTS+" (high) : "+myTS+" (mine) : "+msg);
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

var keepAliveTimeout = 1000;

function discover() 
{
	box.style.bg = 'red';
    //log.focus();
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
//box.focus();

var GAP_STATE = 0;
var REQUEST_STATE = 1;
var WORK_STATE = 2;

var STATE = GAP_STATE;

var highestTS = 0;
var myTS = 0;
var ReqDeferred = [];
var PendingReplies = [];

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

	var theRing = whiteList.getRing(); 
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

app.post('/release_CS', function( req, res) {
	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
	
	releaseShotgun();
});

var critical_counter = 0;

app.post('/request_CS', function(req, res) {
	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
	if( debug ) debugLog( "Token Received: " + the_body.token + " - verify against - " + CS_TOKEN );
	
	var accept = checkToken( the_body.token );
	
	if( debug ) debugLog( "Validation: " + accept + " " + validToken );
	
	releaseIP = the_body.reqIP;
	
	if( accept && validToken )
	{ 
		generateToken();
		validToken = false;
		critical_counter++;
		if(debug) debugLog(" Critical Counter: " + critical_counter); 	
		setTimeout( ReleaseCriticalSection, 1000 );
	}
	else
	{
		if(debug) debugLog(" Critical Counter: " + critical_counter);
		setTimeout( ReleaseCriticalSection, 10 );
	}
});

app.post('/resource_approved', function(req, res) {
	var the_body = req.body;  
	if(debug) debugLog("recieved resource approved from : "+ the_body.myIP + " before decrement NRR " + PendingReplies);
	
	processApproval(the_body.myIP);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post( '/whitelist_req', function( req, res ){

	var the_body = req.body;
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});

	if(debug) debugLog("White list request: " + the_body.ip );

	while( password == "" ){}
	
	/* Add to white list and broadcast white updated white list to all members*/
	if( the_body.mac_addr == 1 && the_body.pass == password )
	{
		whiteList.addRingMember(the_body.ip);

		var listIPs = whiteList.getRing();
	
		var post_data = { members: listIPs }
 
		for( var i = 0; i < listIPs.length; i++) 
		{
			if (listIPs[i] != tokenRing.getMyIP())
			{
				if( debug ) debugLog( "Sending list to ip: " + listIPs[i] );
				generalPOST( listIPs[i], "/init_workers", post_data );
			}
		}	
	}
	else
	{
		var post_data = { members: [the_body.ip] };

		generalPOST( the_body.ip, "/init_workers", post_data );
	}

});

app.post( '/init_PA', function( req, res){

	var the_body = req.body;  
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});

	if(debug) debugLog("recieved PA IP: " + the_body.pica_ip );

	PICA_IP = the_body.pica_ip;

	var post_data = { ip: tokenRing.getMyIP(), mac_addr: 1, pass: node_functionality };

	while( password == "" ){}

	generalPOST( PICA_IP, '/whitelist_req', post_data );

});

app.post('/init_workers', function( req, res ){

	var the_body = req.body;  
	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});

	if(debug) debugLog("recieved white list: " + the_body.members );

	for( var i = 0; i < the_body.members.length; i++ )
	{
		whiteList.addRingMember( the_body.members[i] );
	}

	if( PICA_IP != tokenRing.getMyIP() ){
		reqResourceButton.hidden = false;
		reqResourceButton.setContent('{center}REQUEST RESOURCE!!{/center}');	
		reqResourceButton.style.bg = 'green';
		screen.render();
	}

});

function Broadcast_IP()
{
	var listIPs = tokenRing.getRing();
	
	var post_data = { "pica_ip" : PICA_IP };
	
	for( var i = 0; i < listIPs.length; i++) 
	{
		if (listIPs[i] != tokenRing.getMyIP())
		{
			if( debug ) debugLog( "Sending to ip: " + listIPs[i] );
			generalPOST( listIPs[i], "/init_PA", post_data );
		}
	}	
}

function initializePICA()
{
	var ring = tokenRing.getRing();
	var id = tokenRing.indexOf(tokenRing.getMyIP());

	if ( node_functionality == 0)
	{
		STATE = GAP_STATE;
		box.setContent('{center}PICA - PICS - PICA{/center}');
		box.style.bg = 'blue';
		reqResourceButton.hidden = true;
		reqResourceButton.setContent('{center}center}');	
		reqResourceButton.style.bg = 'blue';
		screen.render();
		PICA_IP = tokenRing.getMyIP();
		setTimeout( Broadcast_IP, 3000 );
	}
	else
	{
		STATE = GAP_STATE;
		box.setContent('{center} - Malicious Node - {/center}');
		box.style.bg = 'black';
		if( PICA_IP ){
			reqResourceButton.hidden = false;
		}
		else{
			reqResourceButton.hidden = true;
		}
		reqResourceButton.setContent('{center}REQUEST RESOURCE!!{/center}');	
		reqResourceButton.style.bg = 'green';

		screen.render();
	}
}

function releaseShotgun()
{
	initializePICA();
	if(debug) debugLog("release shotgun. Current RD : " + ReqDeferred);
	var numRequests = ReqDeferred.length;
	for (var i = 0; i < numRequests; i++)
	{
		var nextPendingRequest = getNextRequestDeferred();
		var post_data = { myIP : tokenRing.getMyIP() };
	    if(debug) debugLog("Sending approval to : " + nextPendingRequest); 	
		generalPOST(nextPendingRequest, '/resource_approved', post_data); 
	}
}

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
	setTimeout( initializePICA, 4000  );
});
