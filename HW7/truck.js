var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');

tokenRing.setRole( 2 );

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;
tokenRing.debugMessages(false);

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
    content: '{center} HUMAN  - CONTROLLED - TRUCK - PI {/center}',
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
        fg: 'white'
    },
    fg: 'white',
    bg: 'red',
    content: '{center}D = Action Completed{/center}',
    tags: true,
    hoverEffects: {
        bg: 'red'
    },
    hidden: true 
});
doneButton.on('click', function(data) {
	setActionComplete();
});
screen.key(['d', 'D'], function(ch, key) {
	setActionComplete();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

var entranceButton1 = blessed.box({
    parent: screen,
    top: '80%',
    height: '20%',
    width: '30%',
    left: '0%',
    border: {
        type: 'line',
        fg: 'yellow'
    },
    fg: 'black',
    bg: 'yellow',
    content: '{center} Enter Door 1 {/center}',
    tags: true,
    hoverEffects: {
        bg: 'red'
    },
    hidden: true 
});
entranceButton1.on('click', function(data) {
	setEntranceDoor( 1 );
});
screen.key(['1'], function(ch, key) {
	setEntranceDoor( 1 );
});

var entranceButton2 = blessed.box({
    parent: screen,
    top: '80%',
    height: '20%',
    width: '30%',
    left: '50%',
    border: {
        type: 'line',
        fg: 'yellow'
    },
    fg: 'black',
    bg: 'yellow',
    content: '{center} Enter Door 2 {/center}',
    tags: true,
    hoverEffects: {
        bg: 'red'
    },
    hidden: true 
});
entranceButton2.on('click', function(data) {
	setEntranceDoor( 2 );
});
screen.key(['2'], function(ch, key) {
	setEntranceDoor( 2 );
});

var entrance = 1;
var entrance_set = false;

function setEntranceDoor( door )
{
	entrance = door;
	entrance_set = true;
}

screen.render();
/********* END BUTTON ***********/


/********* Get Bag IP **********/

var Bag_IP;
var bag_found = false;

function getBagIP()
{
	debugLog( "Getting Bag IP" );
	var bag = [];
	bag = tokenRing.getRoleList(1);
	if (bag.length != 1)
	{
		if( bag.length > 1 ){
			if (debug) debugLog("Problem!! More than one bag exists.");
		}
		else
		{
			setTimeout( getBagIP, 1000 );
		}
	}
	else
	{
		Bag_IP = bag[0];
		log.insertLine("Bag_IP is " + Bag_IP);
		bag_found = true;
	}
}

/********* END Bag IP **********/

/********* Get TRUCK IPs **********/

var TRUCK_IPs = [];

function getTRUCKIPs()
{
	TRUCK_IPs = tokenRing.getRoleList(2);
	
	debugLog("TRUCK_IPs are " + JSON.stringify( TRUCK_IPs) );

}

/********* END TRUCK IPs **********/

/*********    MovePI    **********/

function getEntrancePoint()
{
	doneButton.hidden = true;
	screen.render();
	
	entranceButton1.hidden = false;	
	entranceButton2.hidden = false;	

	screen.render();

	var responseCheck1 = setInterval(function() {
		if ( entrance_set ) {
			debugLog( "Entrance set" );
			clearInterval( responseCheck1 );
			setTimeout( displayButton, 10 );
	}});
}

function MovePI()
{
	getEntrancePoint();

	entrance_set = false;

	debugLog( "Entrance: " + entrance );

	
	releaseShotgun();

/*
	var bay = getWorkFromBag();

	switch( bay )
	{
		case 0:
			if( entrance == 0 )
			{
				doSubroutine(0);
			}
			else
			{
				doSubroutine(1);
			}
			break;
		case 1:
			if( entrance == 0 )
			{
				doSubroutine(2);
			}
			else
			{
				doSubroutine(3);
			}
			break;
		case 2:
			if( entrance == 0 )
			{
				doSubroutine(4);
			}
			else
			{
				doSubroutine(5);
			}
			break;
		case default:
			if( debug ) debugLog( "Timeing out move" );
			setTimeout( Move, 1000 );
			break;
	}
*/
}
/********* END MovePI **********/

/********* SHUTGUN **********/

function callShotGun()
{
	reqResource();
}

//Enumerate possible states
var GAP_STATE = 0;
var REQUEST_STATE = 1;
var WORK_STATE = 2;

//Define which state currently in
var STATE = GAP_STATE;

//Time stamp tracking
var highestTS = 0;
var myTS = 0;

//Shotgun lists
var ReqDeferred = [];
var PendingReplies = [];

function reqResource()
{
	STATE = REQUEST_STATE;

	highestTS++;
	myTS = highestTS;

	var theRing = TRUCK_IPs; 

	if( theRing.length == 1 && theRing[0] == tokenRing.getMyIP())
	{
		setWORKState();
	}
	else
	{
		for (var i = 0; i < theRing.length; i++)
		{
			var post_data = { myTS : myTS, myIP : tokenRing.getMyIP() }; 
			if (theRing[i] != tokenRing.getMyIP())
			{
				tokenRing.generalPOST(theRing[i], '/process_resource_request', post_data); 
				PendingReplies.push(theRing[i]);
			}  
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

function setWORKState()
{
	STATE = WORK_STATE;
	if(debug) debugLog ( "resource_approved...working");
	MovePI();
}

function inGapState(ID,timestamp)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
    	if(debug) debugLog("request in gap state new timestamp");
	}

	var post_data = { myIP : tokenRing.getMyIP() }; 
	tokenRing.generalPOST(ID, '/resource_approved', post_data); 
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
			tokenRing.generalPOST(ID, '/resource_approved', post_data); 
		}
	}	
	else
	{
		var post_data = { myIP : tokenRing.getMyIP() }; 
		tokenRing.generalPOST(ID, '/resource_approved', post_data);	
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
			setWORKState();
		}
	}
	else 
	{ 
		if(debug) debugLog ( "I never requested, shouldn't be approving. Node down.");
	}
}

app.post('/resource_approved', function(req, res) {
	var the_body = req.body;  
	if(debug) debugLog("recieved resource approved from : "+ the_body.myIP + " before decrement NRR " + PendingReplies);
	
	processApproval(the_body.myIP);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

function gapState()
{
	STATE = GAP_STATE;
	screen.render();
}

function releaseShotgun()
{
	gapState();
	if(debug) debugLog("release shotgun. Current RD : " + ReqDeferred);
	var numRequests = ReqDeferred.length;
	for (var i = 0; i < numRequests; i++)
	{
		var nextPendingRequest = getNextRequestDeferred();
		var post_data = { myIP : tokenRing.getMyIP() };
	    if(debug) debugLog("Sending approval to : " + nextPendingRequest); 	
		tokenRing.generalPOST(nextPendingRequest, '/resource_approved', post_data); 
	}

	callShotGun();
}

/********* END SHOTGUN **********/


var actionComplete = false;

function setActionComplete()
{
	doneButton.style.fg = "white";
	doneButton.style.bg = "red";
	doneButton.hidden = false;
	screen.render();

	actionComplete = true;
}

function debugLog( msg ) 
{
	log.insertLine(0, msg);
	screen.render();
	return;
}


function displayButton()
{
	entranceButton1.hidden = true;
	entranceButton2.hidden = true;
	doneButton.setContent( "{center}D = Action Completed{/center}");
	doneButton.style.bg = "green";
	doneButton.style.fg = "white";
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

function initializeTruck()
{

	debugLog( "Initalizing Truck PI"  );

	getBagIP();

	var responceCheck1 = setInterval( function() {
		if(bag_found)
		{
			clearInterval( responceCheck1 );
		} 
	});

	getTRUCKIPs();	

	if(debug) debugLog( "Calling Shotgun" );
	callShotGun();
}

app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	setTimeout( initializeTruck, 5000 );
	debugLog("Five Seconds for discovery");
});
