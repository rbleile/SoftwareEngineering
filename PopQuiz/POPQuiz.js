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

//TODO: Only the EAST and WEST TURNSTILES should display this box.
var visitor = blessed.box({
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
    content: '{center}V = Admit Visitor{/center}',
    tags: true,
    hoverEffects: {
	bg: 'green'
    }
});

visitor.on('click', function(data) {

    //do something

});

function admitVisitor() {
    //TODO: This function is where you start...
    //      i.e. attempt to acquire.

    visitor.setContent('{center}VISITOR!!{/center}');
    visitor.style.bg = '#222288';
    visitor.style.fg = '#ffffff';
    screen.render();
	
	turnStileAquireLock();

    //TODO: When the lock is acquired, set the colors back to bg='#228822'
}

screen.key(['v', 'V'], function(ch, key) {
    admitVisitor();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

visitor.focus();
screen.render();

function debugLog( msg ) {
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
var Lock_IP;
var East_IP;
var West_IP;
var Var_IP;
var VAL = 0;

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

function turnStileAquireLock()
{
	debugLog( "Aquire Lock" );
	
	generalPOST( Lock_IP, "/get_lock", { ip: tokenRing.getMyIP()} );
}

var LockOut = false;

app.post('/lock_granted', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );

	debugLog( "Lock Granted" );
	
	generalPOST( Var_IP, "/read_val", the_body );
	
});

app.post('/lock_denied', function(req, res) {
	var the_body = req.body;  //see connect package above

	debugLog( "Lock Denied" );
	
	res.json( the_body );
	
	setTimeout( turnStileAquireLock, 1000 );	
});

app.post('/read_val', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );

	debugLog( "Read Val" );
	
	generalPOST( the_body.ip, "/return_val", { val: VAL } );
	
});

app.post('/return_val', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );
	
	var value = the_body.val;
	
	value++;
	
	debugLog( "Return Val " + the_body.val + " -> write " + value );
	
	generalPOST( Var_IP, "/write_val", {val: value} );
	
	generalPOST( Lock_IP, "/release_lock", {ip: tokenRing.getMyIP() } );
	
});

app.post('/write_val', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );
	
	VAL = the_body.val;
	
	debugLog( "Value: " + VAL );
	
});

app.post('/get_lock', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );
	
	debugLog( "Lock Requested" );

	if( LockOut )
	{
		generalPOST( the_body.ip, "/lock_denied", the_body );
	}
	else{
		LockOut = true;
		generalPOST( the_body.ip, "/lock_granted", the_body );
	}
	
});

app.post('/release_lock', function(req, res) {
	var the_body = req.body;  //see connect package above
	
	res.json( the_body );
	
	debugLog( "Lock Released" );

	LockOut = false;
	
});

function startLock()
{
	debugLog( "Lock Started" );
}

function startVar()
{
	debugLog( "Var Started" );
}

function startTurnstile()
{
	debugLog( "Turnstile Started" );
	/* chads code */
	
	setTimeout( turnStileAquireLock, 2000 );

}

function initializeStates()
{

	debugLog( "Init" );

	var ring = tokenRing.getRing();

	Lock_IP = ring[0];
	East_IP = ring[1];	
	West_IP = ring[2];	
	Var_IP  = ring[3];
	
	var id = tokenRing.indexOf( tokenRing.getMyIP());
	
	debugLog( id + " " + Lock_IP + " " + East_IP );

	if( id == 0 )
        {
	    box.setContent('{center}LOCK - LOCK - LOCK{/center}');
	    box.style.bg = '#222288';
		visitor.setContent("");
		visitor.style.bg = 'black';
	    screen.render();
	    startLock();
	}
	else if( id == 1 || id == 2)
	{
	    if (id == 1) {
		box.setContent('{center}** >> EAST ** >> EAST ** >>{/center}');
		box.style.bg = '#FF0000';
	    } else {
		box.setContent('{center}<< ## WEST << ## WEST << ##{/center}');
		box.style.bg = '#FF0000';
	    }
	    screen.render();
		startTurnstile();
	}
	else if( id == 3 )
    {
	box.setContent('{center}!!! VAR !!! VAR !!!{/center}');
	box.style.bg = 'magenta';
	visitor.setContent("");
	visitor.style.bg = 'black';
	screen.render();
	startVar();
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
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
	setTimeout( initializeStates, 4000  );
});

