var os = require('os');
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
tokenRing.debugMessages(true);

// Create a screen object.
var screen = blessed.screen();

// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
	top: 'center',
	left: 'center',
	width: '50%',
	height: '50%',
	content: '',
	tags: true,
	border: {
		type: 'line'
	},
	style: {
		fg: 'white',
		bg: 'black',
		border: {
			fg: '#f0f0f0'
		},
		hover: {
			bg: 'black'
		}
	}
});

// Append our box to the screen.
screen.append(box);

app.set('port', process.env.PORT || 3000);

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests
app.post('/do_discover', function(req, res) {
	var the_body = req.body;  //see connect package above
	if(debug) console.log ( "discovery received: " + JSON.stringify( the_body) );

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
			console.log(resultObject);
			tokenRing.addRingMember(resultObject.ip);
		});

	});

	post_request.on('error', function(e) {
		// no one is home, do nothing
		if(debug) console.log('no one at this address: ' + e.message);
	});

	post_request.write(dataString);
	post_request.end();
}

var keepAliveTimeout = 1000;
function discover() 
{
	box.style.bg = 'red';
	screen.render();

	if(debug) console.log("Starting Discovery");
	//limit the scanning range
	var start_ip = 100;
	var end_ip   = 120;
   
	//we are assuming a subnet mask of 255.255.255.0

	//break it up to extract what we need 
	var ip_add = tokenRing.getMyIP().split(".");
	//put it back together without the last part
	var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
	if(debug) console.log("Base ip address : " +  base_add);

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

function keepAlive()
{
	var listIPs = tokenRing.getRing();
	for( var i = 0; i < listIPs.length; i++) 
	{
		var post_data = { myIP : i };
		generalPOST ( listIPs[i], '/do_keepalive', post_data );
	}
}

function updateTopology() 
{
	
}

var myComputeID = -1;
var currBestComputeID = 1000000000;
var participated = 0;

function Delay( handicap )
{
	var computeSize = 1000000;
	var currentTime = new Date();
	var start = currentTime.getTime();
	var value1 = 0.0;

	for( var i = 0; i < computeSize; i++ )
	{
		value1 += value1 + Math.sqrt( i*i-(i+100/i*2) );
	}

	var currentTime2 = new Date();
	var end = currentTime2.getTime();
	var time = end - start;

	currBestComputeID = myComputeID;

	return time + handicap;
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
		err = function() {} ;
	}

	// check if arg param res does not exist
	if (typeof(res) != "function")
	{
		res = function() {} ;
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

		res.on('error', err);

		res.on('response', res);

        res.on('end', function(){
			var resultObject = JSON.parse(responseString);
		});
	});

	post_request.write(dataString);
	post_request.end();
}

//Election Passing
app.post('/do_election', function(req, res) {
	var the_body = req.body;  //see connect package above
	//console.log ( "Election token received: " + JSON.stringify( the_body) );

	res.json(the_body);

	box.style.bg = 'yellow';
	screen.render();

	var incomingComputeID = the_body.computeID;
  
	if ( incomingComputeID == myComputeID )
	{
		/* Pass win message */
		//console.log("Received my own token back. participated = " + participated);
		console.log( "I win!!! ");
		participated = 0;

		// Passing IP instead of index because IP will always be unique. 

		var post_data = { listIP : tokenRing.getMyIP(),
						  computeVal : myComputeID 
		                };
		generalPOST( tokenRing.getNeighborIP(), '/do_winner', post_data );
	}
	else if ( incomingComputeID > myComputeID )
	{
		if ( incomingComputeID < currBestComputeID )
		{
			currBestComputeID = incomingComputeID;
		}

		/* Do Pass this Compute ID */
    	if ( participated == 0 ) 
    	{
			participated = 1;
		}

		//electionPOST( incomingComputeID );
		var post_data = { computeID : incomingComputeID };
		generalPOST (tokenRing.getNeighborIP(), '/do_election', post_data );

		//console.log("Forwarding incomingComputeID: " + incomingComputeID );
	}
	else if ( incomingComputeID < myComputeID ) //forward incoming packet 
	{
		if ( participated == 0 )
		{
			participated = 1;
			//console.log("Begin participating in new election: " + myComputeID);
			
			var post_data = { computeID : myComputeID };		
			generalPOST( tokenRing.getNeighborIP(), '/do_election', post_data ); 
			currBestComputeID = myComputeID;
		}
		else if ( participated == 1 ) 
		{   
			//console.log("Dropping " + incomingComputeID ); 
		}
	}
  
	//console.log("Leaving do election part = " + participated);
	/* Else don't pass along ( drop out of election ) */
});

app.post('/do_winner', function(req, res) {
	var the_body = req.body;  //see connect package above
	console.log ( "Winner token received. Election over.\n" + JSON.stringify(the_body));

	res.json(the_body);

	var IP = the_body.listIP;
	var Val = the_body.computeVal;
  
	if( myComputeID != Val )
	{
		participated = 0;
		
		box.style.bg = 'blue';
		screen.render();
		
		var post_data = { listIP : IP, computeVal : Val };
		generalPOST( tokenRing.getNeighborIP(), '/do_winner', post_data );
	} 
	else
	{
		box.style.bg = 'green';
		screen.render(); 
	}
});

function startElection()
{
	console.log( "This is the group at the start of the Election " + tokenRing.getRing() );

	console.log( "My Index in Group: " + tokenRing.getMyIPIndex() );

	console.log( "My Compute ID: " + myComputeID );
	participated = 1;

	//electionPOST( myComputeID );
	setTimeout( initialElection, 3000);
	//maybe initialElection();
}

var initialElectionParticipation = false;

function initialElection()
{
	var post_data = { computeID : myComputeID };		
	if (!initialElectionParticipation)
	{
		//electionPOST ( myComputeID );
		generalPOST (tokenRing.getNeighborIP(), '/do_election', post_data );
	}
}

box.setContent('this node (' + tokenRing.getMyIP() + ') will attempt to send its token to other nodes on network. ');
screen.render();


// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
	myComputeID = Delay( parseInt( process.argv[2] ) || 0 );
	currBestComputeID = myComputeID;
	discover();
	setTimeout( startElection, 4000  );
});
