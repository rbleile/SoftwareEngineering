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


/********* Globals ***********/
var actionComplete = false;
var Bag_IP = 0;
var bag_found = false;
var entrance = 1;
var entrance_set = false;
var TRUCK_IPs = [];
var bayClear = false;
var count = 0;
/********* END Globals ***********/


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
    bg: 'green',
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
screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});
screen.render();



function setEntranceDoor( door )
{
	entrance = door;
	entrance_set = true;
}
/********* END BUTTON ***********/

/********* Get Bag IP **********/

function getBagIP()
{
	var bag = [];
	bag = tokenRing.getRoleList(1);
	if (bag.length != 1)
	{
		if( bag.length > 1 )
		{
			if (debug) debugLog("Problem!! More than one bag exists.");
		}
	}
	else
	{
		Bag_IP = bag[0];
		debugLog("Bag_IP is " + Bag_IP);
		bag_found = true;
	}
}

/********* END Bag IP **********/

/********* Get TRUCK IPs **********/


function getTRUCKIPs()
{
	TRUCK_IPs = tokenRing.getRoleList(2);
	
	if( debug) debugLog("TRUCK_IPs are " + JSON.stringify( TRUCK_IPs) );

}

/********* END TRUCK IPs **********/

/*********    MovePI    **********/

function unsetEntranceButton()
{
	entranceButton1.hidden = true;	
	entranceButton2.hidden = true;	
	screen.render();
}
function getEntrancePoint()
{
	doneButton.hidden = true;
	
	entranceButton1.hidden = false;	
	entranceButton2.hidden = false;	

	screen.render();
}

function getWorkFromBag()
{
	var post_data = { "ip" : tokenRing.getMyIP() };
	tokenRing.generalPOST( Bag_IP, '/do_get_task', post_data  );	
}



function subroutine( bay )
{
	subRoutine_1();
/*
	switch( bay+3*entrance )
	{
		case 0:
			if( entrance == 0 )
			{
				subRoutine_1();
			}
			else
			{
			}
			break;
		case 1:
			if( entrance == 0 )
			{
			}
			else
			{
			}
			break;
		case 2:
			if( entrance == 0 )
			{
			}
			else
			{
			}
			break;
		case default:
			if( debug ) debugLog( "Defualt case bay should not be hit" );
			break;
	}
*/
}
function subRoutine_1()
{

	debugLog( "subRoutine 1" );

	var post_data1 = { inpdirection: 1, inpdistance: 10, inpspeed: 7 };

	tokenRing.generalPOST( tokenRing.getMyIP(), '/action_move', post_data1 );

	debugLog( "subRoutine 1 posted" );

	var callBack1 = setInterval(function(){
		debugLog( "getting action: " + actionComplete );
		if( actionComplete )
		{
			actionComplete = false;
			clearInterval( callBack1 );

			var post_data2 = { inpdegrees: 90 }; 

			tokenRing.generalPOST( tokenRing.getMyIP(), 'action_turninplace', post_data2 );

			var callBack2 = setInterval( function()
			{
				if( actionComplete )
				{
					actionComplete = false;
					clearInterval( callBack2 );	

					var callback3 = setInterval(function(){
						//queryBagBay();	

						bayClear = true;

						if( bayClear)
						{	
							clearInterval( callBack3 );
							bayClear = false;	

							var post_data1 = { inpdirection: 0, inpdistance: 10, inpspeed: 7 };

							tokenRing.generalPOST( tokenRing.getMyIP(), '/action_move', post_data1 );

							var callBack4 = setInterval( function()
							{
								if( actionComplete )
								{
									actionComplete = false;
									clearInterval( callBack4 );

									releaseShotgun();

								}
							}, 100 );
						}
					}, 100)
				}
			}, 100 );
		}
	}, 100);

}


function MovePI()
{
	getEntrancePoint();

	var responseCheck1 = setInterval(function() {
		if ( entrance_set ) {
			unsetEntranceButton();
			debugLog( "Entrance set" );
			entrance_set = false;
			clearInterval( responseCheck1 );
			debugLog( "Entrance: " + entrance );

			getWorkFromBag();
	}}, 100);
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
	doneButton.setContent( "{center}D = Action Completed{/center}");
	doneButton.style.bg = "green";
	doneButton.style.fg = "white";
	doneButton.hidden = false;
	screen.render();
}

app.post( '/do_return_task', function( req, res ){

	var body = req.body;

	if( body.isValid )
	{
		var task_id = body.id;
		var bay_num = body.bayNumber; 

		subroutine( bay_num );

	}
	else
	{
		debugLog( "Waiting for work" );
		setTimeout( getWorkFromBag, 1000 );
	}

});

app.post('/action_move', function(req, res) {
	debugLog( "moving" );
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: Move( " + the_body.inpdirection + " " + the_body.inpdistance + "inches at a speed of " + the_body.inpspeed + ")" );
    res.json(req.body);
	 displayButton();

	actionComplete = true;	

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

function initializeTruck()
{

	debugLog( "Initalizing Truck PI" );


	if( debug) debugLog( "Getting Bag IP" );

	var responceCheck1 = setInterval( function() {
		if(bag_found)
		{
			clearInterval( responceCheck1 );
			getTRUCKIPs();	

			if(debug) debugLog( "Calling Shotgun" );
			callShotGun();
		} 
		else
		{
			getBagIP();
		}
	}, 500);
}

screen.render();

app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port ");
	debugLog("Five Seconds for discovery");
	setTimeout( initializeTruck, 5000 );
});
