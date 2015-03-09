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
var bays = [];
var task_id = -1;
var bay_num = -1;
var bayClear = false;
var count = 0;

var minCritSections = 2;
var numCriticalLocations = 6;
//Arbitrary number of critical sections
var numCritSections = minCritSections + numCriticalLocations;

// My Current Location
var Location = -1;

// Last CS Location when moving through location list
var Last_CS = -1;

//List of critical locations to call
var Path_List = [];
var Rev_Path = [];

// Bool List of critical sections to determine if I have it
var Critical_Sections = [];
for(var i = 0; i < numCritSections; i++) {
    Critical_Sections.push( false );
}

//Interval Boolean if move routine finished
var DoneMoving = false;

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
    top: '80%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: false,
    fg: 'white',
    bg: 'green',
    content: '{center}D = Action Completed{/center}',
    hidden: true, 
    tags: true
});
doneButton.on('click', function(data) {
	setActionComplete();
});
screen.key(['d', 'D'], function(ch, key) {
	setActionComplete();
});


var entranceButton1 = blessed.box({
    top: '80%',
    height: '20%',
    width: '30%',
    left: '0%',
    border: false,
    fg: 'black',
    bg: 'yellow',
    content: '{center} Enter Door 1 {/center}',
    tags: true,
    hidden: true 
});
entranceButton1.on('click', function(data) {
	setEntranceDoor( 1 );
});
screen.key(['1'], function(ch, key) {
	setEntranceDoor( 1 );
});

var entranceButton2 = blessed.box({
    top: '80%',
    height: '20%',
    width: '30%',
    left: '50%',
    border: false,
    fg: 'black',
    bg: 'yellow',
    content: '{center} Enter Door 2 {/center}',
    tags: true,
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


screen.append( entranceButton1 );
screen.append( entranceButton2 );
screen.append( doneButton );

screen.render();

function setEntranceDoor( door )
{
	entrance = door;
	entrance_set = true;
	
	location = entrance;

	entranceButton1.setContent("{center} Enter Door 1 {/center}");
	entranceButton2.setContent("{center} Enter Door 2 {/center}");
	entranceButton1.hidden = true;
	entranceButton2.hidden = true;

	screen.render();

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

function getEntrancePoint()
{
	doneButton.setContent("{center}D = Action Completed{/center}");
	doneButton.hidden = true;

	entranceButton1.setContent("{center} Enter Door 1 {/center}");
	entranceButton2.setContent("{center} Enter Door 2 {/center}");
	entranceButton1.hidden = false;
	entranceButton2.hidden = false;

	screen.render();
}

/* Truck Worker Process
 	
	Truck Task Routine
		- Get Critical Task Lock
		- Get Task from Bag
		- Release Critical Task Lock
		- Get Critical Path Lock
		- Request Critical Sections on Path to Work
		- Release Critical Path Lock
		- Begin recursive subroutine
		- Get Critical Path Lock
		- Request Critical Sections on Path to Home Location
		- Release Critical Path Lock
		- Begin recursive subroutine
		- Submit result to bag
	
	Recursive subroutine
		- When critical location list is empty return
		- For path list
			- get next critical location
			- move to next critical location
			- release last critical location
			- recurse
*/

//Enumerate possible paths to take
function choosePath( bay )
{
	switch( bay-1 )
	{
		case 0:
			if( entrance == 1 )
			{
				Path_List.push( 5 );
				Path_List.push( 4 );
				Path_List.push( 3 );
				Path_List.push( 0 );

				Rev_Path.push( 3 );
				Rev_Path.push( 4 );
				Rev_Path.push( 5 );
				Rev_Path.push( 7 );
			}
			else
			{
				Path_List.push( 3 );
				Path_List.push( 0 );

				Rev_Path.push( 3 );
				Rev_Path.push( 6 );
			}
			break;
		case 1:
			if( entrance == 1 )
			{
				Path_List.push( 5 );
				Path_List.push( 4 );
				Path_List.push( 1 );

				Rev_Path.push( 4 );
				Rev_Path.push( 5 );
				Rev_Path.push( 7 );
			}
			else
			{
				Path_List.push( 3 );
				Path_List.push( 4 );
				Path_List.push( 1 );

				Rev_Path.push( 4 );
				Rev_Path.push( 3 );
				Rev_Path.push( 6 );
			}
			break;
		case 2:
			if( entrance == 1 )
			{
				Path_List.push( 5 );
				Path_List.push( 2 );

				Rev_Path.push( 5 );
				Rev_Path.push( 7 );
			}
			else
			{
				Path_List.push( 3 );
				Path_List.push( 4 );
				Path_List.push( 5 );
				Path_List.push( 2 );

				Rev_Path.push( 5 );
				Rev_Path.push( 4 );
				Rev_Path.push( 3 );
				Rev_Path.push( 6 );
			}
			break;
		default:
			if( debug ) debugLog( "Default case bay should not be hit" );
			break;
	}
	
	return;
}

function BeginTaskRoutine()
{
	callShotGun( 0 );
	var callBack1 = setInterval(function(){
		if( Critical_Sections[0] )
		{
			Critical_Sections[0] = false;
			clearInterval( callBack1 );
			getWorkFromBag();
		}
	}, 500);
}

function getWorkFromBag()
{
	var post_data = { "ip" : tokenRing.getMyIP() };
	tokenRing.generalPOST( Bag_IP, '/do_get_task', post_data  );
}

app.post( '/do_return_task', function( req, res ){

	var body = req.body;

    res.json(req.body);

	debugLog( "isValid: " + body.isValid );

	if( body.isValid )
	{
		releaseShotgun(0);
		task_id = body.id;
		bay_num = body.bayNumber;
		
		var task = { id: task_id, bayNum : bay_num };
		
		GetPath1( task );
	}
	else
	{
		debugLog( "Waiting for work" );
		setTimeout( getWorkFromBag, 1000 );
	}
});

function GetPath1( task )
{
	callShotGun( 1 );
	var callBack1 = setInterval(function(){
		if( Critical_Sections[1] )
		{
			Critical_Sections[1] = false;
			clearInterval( callBack1 );
			choosePath( task.bayNum );
			for( var i = 0; i < Path_List.length; i++ )
			{
				callShotGun( Path_List[i]+minCritSections );
			}
			releaseShotGun( 1 );
			MoveForward( task );
		}
	}, 500);
}

function MoveForward( task )
{
	Rec_Subroutine( Path_List );

	var callBack1 = setInterval(function(){
		if( DoneMoving )
		{
			DoneMoving = false;
			clearInterval( callBack1 );
			GetPath2( task );
		}
	}, 500);
}

function GetPath2( task )
{
	callShotGun( 1 );
	var callBack1 = setInterval(function(){
		if( Critical_Sections[1] )
		{
			Critical_Sections[1] = false;
			clearInterval( callBack1 );
			for( var i = 0; i < Rev_Path.length-1; i++ )
			{
				callShotGun( Rev_List[i]+minCritSections );
			}
			releaseShotGun( 1 );
			MoveBack( task );
		}
	}, 500);
}

function MoveBack( task )
{
	Rec_Subroutine( Rev_List );
	
	var callBack1 = setInterval(function(){
		if( DoneMoving )
		{
			DoneMoving = false;
			clearInterval( callBack1 );

			tokenRing.generalPOST( Bag_IP, '/do_insert_result', task );
			
			BeginTaskRoutine();
		}
	}, 500);
}

function Rec_Subroutine( LIST )
{
	if( LIST.length == 0 )
	{
		DoneMoving = true;
		return;
	}

	var CS_P = LIST.splice(0,1);
	var callBack1 = setInterval(function(){
		if( Critical_Sections[CS_P+2] )
		{
			if( CS_P < numCriticalLocations)
			{
				Critical_Sections[CS_P+2] = false;
			}
			clearInterval( callBack1 );
			
			var last_Location = location;

			if( CS_P >= 3 )
			{
				bayClear = true;
			}
			
			var callBack3 = setInterval(function(){
				if( bayClear )
				{
					clearInterval( callBack3 );
					bayClear = false;
			
					var post_data = { inpdirection: location, inpdistance: 5, inpspeed: 7 };
					tokenRing.generalPOST( tokenRing.getMyIP(), '/action_move', post_data );

					var callBack2 = setInterval(function(){
						if( actionComplete )
						{
							location = CS_P; //Move Location To Next Step;
							var post_data = { ip : tokenRing.getMyIP(), "location" : location,  };
							tokenRing.generalPOST( tokenRing.getMyIP(), '/report_move', post_data );
							actionComplete = false;
							clearInterval( callBack2 );
							
							if( last_location >= 0 && last_location < numCriticalLocations )
							{
								Critical_Sections[CS_P] = false;
								releaseShotGun( last_location + minCritSections ); // Release Crit Section to current Location
							}

							Rec_Subroutine( LIST );
						}
					}, 500);
				}
				else
				{
					var post_data_bays = { ip: tokenRing.getMyIP() };
					tokenRing.generalPOST( Bag_IP, '/do_get_bays', post_data_bays );
				}				
			}, 500);
		}
	}, 500);
}


/********* SHUTGUN **********/

function callShotGun(whichCS)
{
	reqResource(whichCS);
	var post_data = { ip : tokenRing.getMyIP(), "lock" : whichCS };
	tokenRing.generalPOST( BAG_IP, '/report_lock_request', post_data );
}

//Enumerate possible states
var GAP_STATE = 0;
var REQUEST_STATE = 1;
var WORK_STATE = 2;

//Define which state currently in
var STATE = [];
for(var i = 0; i < numCritSections; i++) {
    STATE.push(GAP_STATE);
}

//Time stamp tracking
var highestTS = 0;
var myTS = 0;

//Shotgun lists
var ReqDeferred = [];
var PendingReplies = [];
//Need both arrays for each critical section
for (var i = 0; i < numCritSections; i++)
{
	ReqDeferred[i] = [];
	PendingReplies[i] = [];
}

function reqResource(whichCS)
{
	STATE[whichCS] = REQUEST_STATE;

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
			var post_data = { myTS : myTS, myIP : tokenRing.getMyIP(), myReqCS : whichCS }; 
			if (theRing[i] != tokenRing.getMyIP())
			{
				tokenRing.generalPOST(theRing[i], '/process_resource_request', post_data); 
				PendingReplies[whichCS].push(theRing[i]);
			}  
		}
	}
}

function getNextRequestDeferred(whichCS)
{
	if (ReqDeferred[whichCS].length < 1)
		return -1;
	else
		return ReqDeferred[whichCS].splice(0,1);
}

function processReq(ID, timestamp, whichCS)
{
	switch(STATE[whichCS]) {
		case GAP_STATE:
			inGapState(ID,timestamp,whichCS);
			break;
		case REQUEST_STATE:
			inRequestState(ID, timestamp,whichCS);
			break;
		case WORK_STATE:
			inWorkState(ID,timestamp,whichCS);
			break;
		default:
			if(debug) debugLog("Not valid state");
	}
}

function setWORKState(whichCS)
{
	STATE[whichCS] = WORK_STATE;
	if(debug) debugLog ( "resource_approved...working");
	Critical_Sections[whichCS] = true;
	var post_data = { ip : tokenRing.getMyIP(), "lock" : whichCS };
	tokenRing.generalPOST( BAG_IP, '/report_lock_granted', post_data );
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

function inRequestState(ID,timestamp,whichCS)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
		ReqDeferred[whichCS].push(ID);
		if(debug) debugLog("request in request state new timestamp");
	}
	else if (timestamp == highestTS)
	{
		if(debug) debugLog("Tiebreaker");
		if (ID > tokenRing.getMyIP())
		{
			ReqDeferred[whichCS].push(ID);
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

function inWorkState(ID,timestamp,whichCS)
{
	ReqDeferred[whichCS].push(ID);

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

	processReq(the_body.myIP, the_body.myTS, the_body.myReqCS);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});


function processApproval(IP, whichCS)
{
	if (STATE[whichCS] == REQUEST_STATE && PendingReplies[whichCS].indexOf(IP) != -1)
	{
		PendingReplies[whichCS].splice(PendingReplies.indexOf(IP),1);
		if(debug) debugLog("remaining replies: " + PendingReplies[whichCS]);
		if (PendingReplies[whichCS].length == 0)
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

function gapState(whichCS)
{
	STATE[whichCS] = GAP_STATE;
	screen.render();
}

function releaseShotgun(whichCS)
{
	gapState(whichCS);
	
	if(debug) debugLog("release shotgun. Current RD : " + ReqDeferred[whichCS]);
	var numRequests = ReqDeferred[whichCS].length;
	for (var i = 0; i < numRequests; i++)
	{
		var nextPendingRequest = getNextRequestDeferred(whichCS);
		var post_data = { myIP : tokenRing.getMyIP() };
	    if(debug) debugLog("Sending approval to : " + nextPendingRequest); 	
		tokenRing.generalPOST(nextPendingRequest, '/resource_approved', post_data); 
	}

	var post_data = { ip : tokenRing.getMyIP(), "lock" : whichCS };
	tokenRing.generalPOST( BAG_IP, '/report_lock_release', post_data );
}

/********* END SHOTGUN **********/

function setActionComplete()
{
	debugLog( "Setting Action Complete" );

	doneButton.setContent("{center}D = Action Completed{/center}");
	doneButton.hidden = true;	
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

app.post('/do_recievedBays', function(req, res){

	var the_body = req.body;  
	res.json(the_body);
	
	bays = the_body;

	debugLog( "Bays: " );
	debugLog( JSON.stringify( bays ) );

	if( !bays[bay_num-1] )
	{
		bayClear = true;
	}

});

app.post('/action_move', function(req, res) {
	debugLog( "moving" );
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: Move( " + the_body.inpdirection + " " + the_body.inpdistance + "inches at a speed of " + the_body.inpspeed + ")" );
    res.json(req.body);
	displayButton();
});

app.post('/action_turninplace', function(req, res) {
	debugLog( "Rotating" );
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: Rotate( " + the_body.inpdegrees + " degrees )");
    res.json(req.body);
    displayButton();
});

app.post('/action_turnsensor', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: turnsens " + the_body.inpdegrees + " degrees");
    res.json(req.body);
    displayButton();
});

app.post('/action_readsensor', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ("Run Command: readsens");
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

			getEntrancePoint();
			
			var callBack1 = setInterval(function(){
				if( entrance_set )
				{
					clearInterval( callBack1 );
					BeginTaskRoutine();
				}
			}, 500);

		} 
		else
		{
			getBagIP();
		}
	}, 500);
}

app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port ");
	debugLog("Five Seconds for discovery");
	setTimeout( initializeTruck, 5000 );
});
