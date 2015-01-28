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
    height: '80%',
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
	},
	hover: {
	    bg: 'black'
	}
    }
});

function debugLog( msg ) {
	log.insertLine(1, msg);
	screen.render();
	return;
}

app.set('port', process.env.PORT || 3000);

var isLeader = false;
var leaderIP = '';

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

var keepAliveTimeout = 10000;

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
	//	var post_data = { myIP : i };
		if (listIPs[i] != tokenRing.getMyIP())
		{
			generalPOST ( listIPs[i], '/do_keepalive', primesData );
		}
	}
	
	setTimeout( keepAlive, keepAliveTimeout );
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

/* Obsolete function..replaced with generalPOST
function PostPrimeToken()
{
	var post_data = primesData;
        
	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: leaderIP ,
		port: '3000',
		path: '/do_work',
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
		});
	});

	post_request.write(dataString);
        post_request.end();
       // debug("sF():done ");

	box.style.bg = 'black';	//black for pass
	screen.render();
}
*/

function SetPrimesData( pd )
{
	if ( pd.n > primesData.n){
		primesData.n = pd.n;
		primesData.k = pd.k;
	}

}

app.post( '/update_primes', function(req, res){

	debugLog( " Updating Prime Value " );

	var the_body = req.body;

	res.json(the_body);

	SetPrimesData( the_body );

});

var ipSend = 0;
var workIncrementor = 0;

// handle PASS requests
app.post('/do_work', function(req, res) {

	var the_body = req.body;	//see connect package above
	res.json(the_body);
	
	if( participated == 0){
		
		debugLog( "DO_WORK: " + workIncrementor );

		workIncrementor++;

		//res.json({"body": the_body, "id": my_ip});


		if ( leaderIP == tokenRing.getMyIP() )
		{
			debugLog ( "token received-leader: " + JSON.stringify( the_body) );

			SetPrimesData( the_body );
			
			var listIPs = tokenRing.getRing();
			
			for( var i = 0; i < listIPs.length; i++ )
			{		
				if( listIPs[i] != tokenRing.getMyIP() ){
					generalPOST( listIPs[i], '/update_primes', primesData );
				}
			}
			
			ipSend = (ipSend+1)%(listIPs.length);
			
			if( ipSend == tokenRing.getMyIPIndex() )
			{
				ipSend = (ipSend+1)%(listIPs.length);
			}
			
			debugLog ("ipSend Value: " + ipSend);
			
			generalPOST( listIPs[ ipSend ], '/do_work', primesData );
			
		}
		else{

			debugLog ( "token received-worker: " + JSON.stringify( the_body) );
			box.setContent("Post with body: " + the_body);
		        box.style.bg = 'white';	//white for pass
		        box.style.fg = 'black';
			screen.render();

			if (the_body.n > primesData.n)
			{
				primesData.n = the_body.n;
				primesData.k = the_body.k;
			}

			computePrimes(primesData.n, primesData.k, primesData.t);
		    box.style.bg = 'blue';
		    screen.render();
		}
	}
	//debug("do_pass:done ");
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
			debugLog("Lost connection to " + genHost + "reomiving from ring");

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

	if (the_body.n > primesData.n)
	{
		primesData.n = the_body.n;
		primesData.k = the_body.k;
	}	
});

//Election Passing
app.post('/do_election', function(req, res) {
	var the_body = req.body;  //see connect package above
	//debugLog ( "Election token received: " + JSON.stringify( the_body) );

	res.json(the_body);

	box.style.bg = 'yellow';
	screen.render();

	var incomingComputeID = the_body.computeID;
  
	if ( incomingComputeID == myComputeID )
	{
		/* Pass win message */
		//debugLog("Received my own token back. participated = " + participated);
		debugLog( "I win!!! ");
		participated = 0;
		isLeader = true;
		leaderIP = tokenRing.getMyIP();

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
			isLeader = false;
		}

		//electionPOST( incomingComputeID );
		var post_data = { computeID : incomingComputeID };
		generalPOST (tokenRing.getNeighborIP(), '/do_election', post_data );

		//debugLog("Forwarding incomingComputeID: " + incomingComputeID );
	}
	else if ( incomingComputeID < myComputeID ) //forward incoming packet 
	{
		if ( participated == 0 )
		{
			participated = 1;
			isLeader = false;

			//debugLog("Begin participating in new election: " + myComputeID);
			
			var post_data = { computeID : myComputeID };		
			generalPOST( tokenRing.getNeighborIP(), '/do_election', post_data ); 
			currBestComputeID = myComputeID;
		}
		else if ( participated == 1 ) 
		{   
			//debugLog("Dropping " + incomingComputeID ); 
		}
	}
  
	//debugLog("Leaving do election part = " + participated);
	/* Else don't pass along ( drop out of election ) */
});

var primesData = { n:3, k:2, t:500, leadIP:'' };

app.post('/do_winner', function(req, res) {
	var the_body = req.body;  //see connect package above
	debugLog ( "Winner token received. Election over.\n" + JSON.stringify(the_body));

	res.json(the_body);

	var IP = the_body.listIP;
	var Val = the_body.computeVal;
  
	if( myComputeID != Val )
	{
		participated = 0;
		
		box.style.bg = 'blue';
		screen.render();
		
		var post_data = { listIP : IP, computeVal : Val };
		leaderIP = IP;
		generalPOST( tokenRing.getNeighborIP(), '/do_winner', post_data );
	} 
	else
	{
		box.style.bg = 'green';
		screen.render(); 

		primesData.leadIP = leaderIP;
		//Leader signals to workers to calculate primes if number of devices is
		//greater than 1.
		
		generalPOST( tokenRing.getNeighborIP(), '/do_work', primesData );

	}
});

function startElection()
{
	debugLog( "This is the group at the start of the Election " + tokenRing.getRing() );

	debugLog( "My Index in Group: " + tokenRing.getMyIPIndex() );

	debugLog( "My Compute ID: " + myComputeID );
	participated = 1;
	isLeader = false;

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
		initialElectionParticipation = true;
		generalPOST (tokenRing.getNeighborIP(), '/do_election', post_data );
	}
}

function isprime(num)
{
    var i = 0;
    if (num <= 1) 
	{
		return false;
    }
    for (i = 2; i * i <= num; i = i + 2) 
	{
		if (num % i == 0) 
		{
			return false;
		}
	}
    return true;
}

function computePrimes(n, c, k) 
{

    var rightnow = new Date();
    var start_time = rightnow.getTime();
    var proceed = true;
    
    while (proceed) 
	{
		n++;
		if ((n % 2) == 0) continue;
		if ( isprime(n) ) c++;
		//-----
		var rightnow = new Date();
		if ((rightnow.getTime() - start_time) > k) proceed = false;
    }

    //Display the number of discovered primes:
    box.setContent("Primes below " + n + ": " + c + "\nIn " + k*1000 + "seconds");
    screen.render();

    //TODO: This data needs to get into the JSON object that is xmitted to next node.
	primesData.n = n;
	primesData.k = c;

    //PostPrimeToken();
	generalPOST ( leaderIP, '/do_work', primesData );

    return;
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
	debugLog("Express server listening on port " + app.get('port'));
	myComputeID = Delay( parseInt( process.argv[2] ) || 0 );
	currBestComputeID = myComputeID;
	discover();
	setTimeout( startElection, 4000  );
});

