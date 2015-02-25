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
screen.render();
/********* END BUTTON ***********/

function moveFunctionality()
{
	moveButton.style.bg = "red";
	moveButton.style.fg = "white";
	moveButton.hidden = false;
	
	turninplaceButton.setContent = "";
	turninplaceButton.style.bg = "black";
	turninplaceButton.style.fg = "black";
	turninplaceButton.hidden = true;

	screen.render();

    var post_data = { myIP : tokenRing.getMyIP() , command : "move" };
    generalPOST(TRUCK_IP, '/action_move', post_data);
}

function turninplaceFunctionality()
{
	moveButton.setContent = "";
	moveButton.style.bg = "white";
	moveButton.style.fg = "white";
	moveButton.hidden = true;

	turninplaceButton.style.bg = "red";
	turninplaceButton.style.fg = "white";
	turninplaceButton.hidden = true;

	screen.render();
	
    var post_data = { myIP : tokenRing.getMyIP(), command : "turn in place" };
    generalPOST(TRUCK_IP, '/action_turninplace', post_data);
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

	var i = parseInt(the_body.role);

	switch (i){
		case 0:
			HOST_IP = the_body.IP;
			break;
		case 1:
			TRUCK_IP = the_body.IP;
			break;
		case 2:
			GoPiGo_IP = the_body.IP;
			break;
		case 3:
			Grove_Sensor_IP = the_body.IP;
			break;
		case 4:
			Human_Sensor_IP = the_body.IP;
			break;
		default:
			if(debug) debugLog( "which not Special type" + the_body.role );	
	}

	var post_data = { ip : tokenRing.getMyIP(), role: node_functionality };    

	res.json(post_data);
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

		switch (i){
			case 0:
				HOST_IP = resultObject.IP;
				break;
			case 1:
				TRUCK_IP = resultObject.IP;
				break;
			case 2:
				GoPiGo_IP = resultObject.IP;
				break;
			case 3:
				Grove_Sensor_IP = resultObject.IP;
				break;
			case 4:
				Human_Sensor_IP = resultObject.IP;
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
		var post_data = { myIP : i, role: node_functionality };
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

//			processApproval(genHost);

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


app.post('/action_completed', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ( "Action completed!!!");
    res.json(req.body);
});


// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
});
