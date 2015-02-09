
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

/*
var relResourceButton = blessed.box({
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
    content: '{center}X = Release Resource{/center}',
    tags: true,
    hoverEffects: {
	bg: 'blue'
    },
	hidden: true
});
*/

reqResourceButton.on('click', function(data) {
	if (STATE == GAP_STATE)
		reqResource();
	else if (STATE == WORK_STATE)
		releaseShotgun();
});

/*
relResourceButton.on('click', function(data) {
    //do something
});
*/

screen.key(['z', 'Z'], function(ch, key) {
    reqResource();
});

/*
screen.key(['x', 'X'], function(ch, key) {
    relResource();
});
*/

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

reqResourceButton.focus();
//relResourceButton.focus();
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

function discover() 
{
	box.style.bg = 'red';
    log.focus();
    screen.render();

    if(debug) log.insertLine(1, "Starting Discovery");
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
			/*
			debugLog("Lost connection to " + genHost + "removing from ring");

			var genHostID = tokenRing.indexOf( genHost );

			tokenRing.removeRingMember(genHost);
			if ( leaderIP == genHost )
			{
				if ( tokenRing.getMyIPIndex() == 0 )
				{
					debugLog( "New Election - Leader is down" );
					initialElectionParticipation = false;
					startElection();
				}
			}
			else if( isLeader && genHostID == ipSend )
			{
				debugLog( "New Compute Loop - Compute Node Down" );
				generalPOST( leaderIP, '/do_work', primesData );
			}
			*/
			debugLog("generalPOST err called "+ e);
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

box.setContent('this node (' + tokenRing.getMyIP() + ') will attempt to send its token to other nodes on network. ');
screen.render();

// Focus our element.
box.focus();


var GAP_STATE = 0;
var REQUEST_STATE = 1;
var WORK_STATE = 2;

var STATE = GAP_STATE;

var highestTS = 0;
var myTS = 0;
var ReqDeferred = [];
var NumPendingReplies = 0;

function reqResource()
{
	STATE = REQUEST_STATE;

	reqResourceButton.setContent('{center}RESOURCE REQUESTED!!{/center}');	
	reqResourceButton.style.bg = '#222288';
	reqResourceButton.style.fg = '#ffffff';
	box.setContent('{center}REQUEST - REQUEST- REQUEST{/center}');
	box.style.bg = 'yellow';
	screen.render();

	highestTS++;
	myTS = highestTS;
	debugLog ("Requesting Resource");

	var everyoneElse = tokenRing.getEveryoneElse();
	for (var i = 0; i < everyoneElse.length; i++)
	{
		var post_data = { myTS : myTS, myIP : tokenRing.getMyIP() }; 
		generalPOST(everyoneElse[i], '/process_resource_requested', post_data); 
		NumPendingReplies++;
	}
}

function getNextRequestDeferred()
{
	if (ReqDeferred.length < 1)
		return -1;
	else
		return ReqDeferred.splice(0, 1);
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
			console.log("Not valid state");
	}
}

function inGapState(ID,timestamp)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
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
	}
	else if (timestamp == highestTS)
	{
		debugLog("Tiebreaker");
	}	
	else
	{
		var post_data = { myIP : tokenRing.getMyIP() }; 
		generalPOST(ID, '/resource_approved', post_data); 
	}
}

function inWorkState(ID,timestamp)
{
	if (timestamp > highestTS)
	{
		highestTS = timestamp;
		ReqDeferred.push(ID);
	}
	else if (timestamp == highestTS)
	{
		debugLog("BAD inWorkState: timestamp == highestTS");
	}
	else
	{
		debugLog("BAD inWorkState: timestamp < highestTS");
	}
}

app.post('/process_resource_request', function(req, res) {
	var the_body = req.body;  

	if(debug) debugLog ( "process_resource_request " + JSON.stringify( the_body) );

	processReq(tokenRing.indexOf(the_body.myIP), the_body.myTS);

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

app.post('/resource_approved', function(req, res) {
	var the_body = req.body;  

	if (STATE == REQUEST_STATE)
	{
		NumPendingReplies--;
		if (NumPendingReplies == 0)
		{
			STATE = WORK_STATE;
			reqResourceButton.setContent('{center}RELEASE RESOURCE!!{/center}');	
			reqResourceButton.style.bg = '#222288';
			reqResourceButton.style.fg = '#ffffff';
			box.setContent('{center}SHOTGUN - SHOTGUN - SHOTGUN {/center}');
			box.style.bg = 'red';
			screen.render();
		}
		if(debug) debugLog ( "resource_approved...working" + JSON.stringify( the_body) );
	}
	else 
	{ 
		if(debug) debugLog ( "I never requested, shouldn't be approving." + JSON.stringify( the_body) );
	}

	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

function initializeStates()
{
	box.setContent('{center}Idle State{/center}');
	box.style.bg = 'green';
	reqResourceButton.hidden = false;
	screen.render();
}

function releaseShotgun()
{
	STATE = GAP_STATE;
	for (var i = 0; i < ReqDeferred.length; i++)
	{
		var nextPendingRequest = getNextRequestDeferred();
		var post_data = { myIP : tokenRing.getMyIP() }; 
		generalPOST(nextPendingRequest, '/resource_approved', post_data); 
	}
}

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
	setTimeout( initializeStates, 4000  );
});
