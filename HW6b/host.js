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

//Input 5
var Human_Sensor2_IP;

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
    height: '40%',
    top: '10%',
    left: '50%',
    align: 'left',
    tags: true
});

var log2 = blessed.scrollabletext({
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
    height: '50%',
    top: '50%',
    left: '50%',
    align: 'left',
    tags: true
});

var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '10%',
    content: '{center}HOST - HOST - HOST{/center}',
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

var response1 = "";
var response2 = "";
var response3 = "";
var inputBox1 = blessed.textbox({
	parent: screen,
	top: '80%',
	left: '0%',
	width: '50%',
	height: '15%',
	//content: '',
	tags: false,
	hidden: true,
	censor: false,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},  
	style: {
		fg: 'white',
		bg: 'blue',
		bold: true,
		border: {
			fg: 'blue',
			bold: true,
			underline: false
		}   
	},  
}); 
/*
inputBox1.setLabel({
	text: 'Enter direction:',
	side: 'left'
}); 
*/
inputBox1.on('submit', function() {
	response1 = inputBox1.value;
	debugLog("Response1 entered: " + response1);
	log.focus();
	inputBox1.hide();
	//screen.remove(inputBox);
	screen.render();
}); 
screen.append(inputBox1);

var inputBox2 = blessed.textbox({
	top: '80%',
	left: '0%',
	width: '50%',
	height: '15%',
	//content: '',
	tags: false,
	hidden: true,
	censor: false,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},  
	style: {
		fg: 'white',
		bg: 'blue',
		bold: true,
		border: {
			fg: 'blue',
			bold: true,
			underline: false
		}   
	},  
}); 
inputBox2.on('submit', function() {
	response2 = inputBox2.value;
	debugLog("Response2 entered: " + response2);
	log.focus();
	inputBox2.hide();
	//screen.remove(inputBox);
	screen.render();
}); 
/*
inputBox2.setLabel({
	text: 'Enter distance: ',
	side: 'left'
}); 
*/

var inputBox3 = blessed.textbox({
	top: '80%',
	left: '0%',
	width: '50%',
	height: '15%',
	//content: '',
	tags: false,
	hidden: true,
	censor: false,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},  
	style: {
		fg: 'white',
		bg: 'blue',
		bold: true,
		border: {
			fg: 'blue',
			bold: true,
			underline: false
		}   
	},  
}); 
inputBox3.on('submit', function() {
	response3 = inputBox3.value;
	debugLog("Response3 entered: " + response3);
	log.focus();
	inputBox3.hide();
	//screen.remove(inputBox);
	screen.render();
}); 
/*
inputBox3.setLabel({
	text: 'Enter speed: ',
	side: 'left'
}); 
*/

screen.append(inputBox2);
screen.append(inputBox3);

/********* BUTTON CODE *********/
var moveButton = blessed.box({
    parent: screen,
    top: '10%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}M = Move{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
moveButton.on('click', function(data) {
    moveFunctionality();
});
screen.key(['m', 'M'], function(ch, key) {
    moveFunctionality();
});

var turninplaceButton = blessed.box({
    parent: screen,
    top: '20%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}P = TurnInPlace{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
turninplaceButton.on('click', function(data) {
    turninplaceFunctionality();
});
screen.key(['p', 'P'], function(ch, key) {
    turninplaceFunctionality();
});

var turnsensorButton = blessed.box({
    parent: screen,
    top: '30%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}T = TurnSensor{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
turnsensorButton.on('click', function(data) {
    turnsensorFunctionality();
});
screen.key(['t', 'T'], function(ch, key) {
    turnsensorFunctionality();
});

var readsensorButton = blessed.box({
    parent: screen,
    top: '40%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}R = ReadSensor{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
turninplaceButton.on('click', function(data) {
    readsensorFunctionality();
});
screen.key(['r', 'R'], function(ch, key) {
    readsensorFunctionality();
});

var scanbaysButton = blessed.box({
    parent: screen,
    top: '60%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}X = ScanBays{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
moveButton.on('click', function(data) {
    scanbaysFunctionality();
});
screen.key(['x', 'X'], function(ch, key) {
    scanbaysFunctionality();
});
screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

var bay1Button = blessed.box({
	parent: screen,
    top: '70%',
    height: '10%',
    width: '15%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Bay1{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
var bay2Button = blessed.box({
	parent: screen,
    top: '70%',
    height: '10%',
    width: '15%',
    left: '15%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Bay2{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
var bay3Button = blessed.box({
	parent: screen,
    top: '70%',
    height: '10%',
    width: '15%',
    left: '30%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Bay3{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: false
});
//moveButton.focus();
//turninplaceButton.focus();
//turnsensorButton.focus();
//readsensorButton.focus();
//scanbaysButton.focus();
screen.render();
/********* END BUTTON ***********/

function scanbaysFunctionality()
{
	scanbaysButton.style.fg = "white";
	scanbaysButton.style.bg = "red";
	scanbaysButton.hidden = false;

	screen.render();

	var post_data = {myIP : tokenRing.getMyIP()};
	generalPOST(Grove_Sensor_IP, "/do_sensor", post_data);
	generalPOST(Human_Sensor_IP, "/do_sensor", post_data);
	generalPOST(Human_Sensor2_IP, "/do_sensor", post_data);
}

app.post("/do_sensor_response", function(req, res) {
	var the_body = req.body;
	baycolor(the_body);
});

function baycolor(fields)
{
	var full = fields.isFull;
	var col = "green";
	if (full) 
		col = "red";
	if (fields.ip == Grove_Sensor_IP)
	{
		bay1Button.setContent("{center}Bay1{/center}");
		bay1Button.style.bg = col;
		bay1Button.style.fg = "white";
		log2.insertLine(0,"Looking for sensor in Bay 1...");
	}
	else if (fields.ip == Human_Sensor_IP)
	{
		bay2Button.setContent("{center}Bay2{/center}");
		bay2Button.style.bg = col;
		bay2Button.style.fg = "white";
		log2.insertLine(0,"Looking for sensor in Bay 2...");
	}
	else if (fields.ip == Human_Sensor2_IP)
	{
		bay3Button.setContent("{center}Bay3{/center}");
		bay3Button.style.bg = col;
		bay3Button.style.fg = "white";
		log2.insertLine(0,"Looking for sensor in Bay 3...");
	}
	screen.render();
}

function moveFunctionality()
{
	moveButton.style.bg = "red";
	moveButton.style.fg = "white";
	moveButton.hidden = false;
	
	turninplaceButton.setContent("");
	turninplaceButton.style.bg = "black";
	turninplaceButton.style.fg = "black";
	turninplaceButton.hidden = true;

	turnsensorButton.setContent("");
	turnsensorButton.style.bg = "black";
	turnsensorButton.style.fg = "black";
	turnsensorButton.hidden = true;

	readsensorButton.setContent("");
	readsensorButton.style.bg = "black";
	readsensorButton.style.fg = "black";
	readsensorButton.hidden = true;

	inputBox1.hidden = false;
	inputBox1.focus();
	//log.insertLine(1, msg);
	//debugLog("Enter direction (fwd or bwd)");
	log2.insertLine(0,"Enter direction (fwd or bwd).");
	var direction = "";
	var distance = "";
	var speed = "";
	var _responseCheck1 = setInterval(function() {
		if (response1) {
			clearInterval(_responseCheck1);
			//inputBox1.setContent("");
			direction = response1;

			inputBox2.hidden = false;
			inputBox2.focus();
			//debugLog("Enter distance (in inches)");
			log2.insertLine(0, "Enter distance (in inches).");
			screen.render();
			var _responseCheck2 = setInterval(function() {
				if (response2) {
					clearInterval(_responseCheck2);
					//inputBox2.setContent("");
					distance = response2;

					inputBox3.hidden = false;
					inputBox3.focus();
					//debugLog("Enter speed (0 to 10)");
					log2.insertLine(0, "Enter speed (0 to 10).");
					screen.render();
					var _responseCheck3 = setInterval(function() {
						if (response3) {
							clearInterval(_responseCheck3);
							//inputBox3.setContent("");
							speed = response3;
							var post_data = { myIP : tokenRing.getMyIP() , command : "Move" , inpdistance : distance, inpdirection : direction , inpspeed : speed };
							generalPOST(TRUCK_IP, '/action_move', post_data);
						}
					}, 100);
				}
			}, 100);
		}
	}, 100);
	screen.render();
}

function turninplaceFunctionality()
{
	moveButton.setContent("");
	moveButton.style.bg = "black";
	moveButton.style.fg = "black";
	moveButton.hidden = true;

	turninplaceButton.style.bg = "red";
	turninplaceButton.style.fg = "white";
	turninplaceButton.hidden = true;

	turnsensorButton.setContent("");
	turnsensorButton.style.bg = "black";
	turnsensorButton.style.fg = "black";
	turnsensorButton.hidden = true;

	readsensorButton.setContent("");
	readsensorButton.style.bg = "black";
	readsensorButton.style.fg = "black";
	readsensorButton.hidden = true;

	inputBox1.hidden = false;
	inputBox1.focus();
	//debugLog("Enter degrees (pos or neg)");
	log2.insertLine(0, "Enter degrees (-360 to +360).");
	var degrees = "";
	var _responseCheck1 = setInterval(function() {
		if (response1) {
			clearInterval(_responseCheck1);
			//inputBox1.setContent("");
			degrees = response1;
			var post_data = { myIP : tokenRing.getMyIP(), command : "Turn in place", inpdegrees : degrees };
			generalPOST(TRUCK_IP, '/action_turninplace', post_data);
		}
	}, 100);
	screen.render();
	
}

function turnsensorFunctionality()
{
	moveButton.setContent("");
	moveButton.style.bg = "black";
	moveButton.style.fg = "black";
	moveButton.hidden = true;

	turninplaceButton.setContent("");
	turninplaceButton.style.bg = "black";
	turninplaceButton.style.fg = "black";
	turninplaceButton.hidden = true;

	turnsensorButton.style.bg = "red";
	turnsensorButton.style.fg = "white";
	turnsensorButton.hidden = false;

	readsensorButton.setContent("");
	readsensorButton.style.bg = "black";
	readsensorButton.style.fg = "black";
	readsensorButton.hidden = true;

	inputBox1.hidden = false;
	inputBox1.focus();
	//debugLog("Enter degrees (0 to 180)");
	log2.insertLine(0, "Enter degrees (0 to 180).");
	var degrees = "";
	var _responseCheck1 = setInterval(function() {
		if (response1) {
			clearInterval(_responseCheck1);
			//inputBox1.setContent("");
			degrees = response1;
			var post_data = { myIP : tokenRing.getMyIP(), command : "Turn sensor", inpdegrees : degrees};
			generalPOST(TRUCK_IP, '/action_turnsensor', post_data);
		}
	}, 100);
	screen.render();
	
}

function readsensorFunctionality()
{
	moveButton.setContent("");
	moveButton.style.bg = "black";
	moveButton.style.fg = "black";
	moveButton.hidden = true;

	turninplaceButton.setContent("");
	turninplaceButton.style.bg = "black";
	turninplaceButton.style.fg = "black";
	turninplaceButton.hidden = true;

	turnsensorButton.setContent("");
	turnsensorButton.style.bg = "black";
	turnsensorButton.style.fg = "black";
	turnsensorButton.hidden = true;

	readsensorButton.style.bg = "red";
	readsensorButton.style.fg = "white";
	readsensorButton.hidden = false;
	
	screen.render();

    var post_data = { myIP : tokenRing.getMyIP(), command : "Read sensor"};
    generalPOST(TRUCK_IP, '/action_readsensor', post_data);
}

app.post('/do_resultsreadsensor', function(req, res) {
	var the_body = req.body;
	log2.insertLine(0,"Object is " + the_body.objdistance + " inches away.");	
});

function debugLog( msg ) 
{
	log.insertLine(0, msg);
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
			HOST_IP = the_body.ip;
			break;
		case 1:
			TRUCK_IP = the_body.ip;
			break;
		case 2:
			GoPiGo_IP = the_body.ip;
			break;
		case 3:
			Grove_Sensor_IP = the_body.ip;
			break;
		case 4:
			Human_Sensor_IP = the_body.ip;
			break;
		case 5:
			Human_Sensor2_IP = the_body.ip;
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
				HOST_IP = resultObject.ip;
				break;
			case 1:
				TRUCK_IP = resultObject.ip;
				break;
			case 2:
				GoPiGo_IP = resultObject.ip;
				break;
			case 3:
				Grove_Sensor_IP = resultObject.ip;
				break;
			case 4:
				Human_Sensor_IP = resultObject.ip;
				break;
			case 5:
				Human_Sensor2_IP = resultObject.ip;
				break;
			default:
				if(debug) debugLog( "Role not special type" + resultObject.role );	
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
    //log.focus();
	//log2.focus();
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

function defaultmenu()
{
	moveButton.setContent("{center}M = Move{/center}");
	moveButton.style.bg = "green";
	moveButton.style.fg = "white";
	moveButton.hidden = false;

	turninplaceButton.setContent("{center}P = TurnInPlace{/center}");
	turninplaceButton.style.bg = "green";
	turninplaceButton.style.fg = "white";
	turninplaceButton.hidden = false;

	turnsensorButton.setContent("{center}T = TurnSensor{/center}");
	turnsensorButton.style.bg = "green";
	turnsensorButton.style.fg = "white";
	turnsensorButton.hidden = false;

	readsensorButton.setContent("{center}R = ReadSensor{/center}");
	readsensorButton.style.bg = "green";
	readsensorButton.style.fg = "white";
	readsensorButton.hidden = false;

	scanbaysButton.setContent("{center}X = ScanBays{/center}");
	scanbaysButton.style.bg = "green";
	scanbaysButton.style.fg = "white";
	scanbaysButton.hidden = false;

	screen.render();
}

function printIPs()
{
	debugLog("This is the list of IPs in the ring: " + tokenRing.getRing());
	debugLog("TRUCK_IP = " + TRUCK_IP);
	debugLog("GoPiGo_IP = " + GoPiGo_IP);
	debugLog("GroveSensor_IP = " + Grove_Sensor_IP);
	debugLog("Human_Sensor_IP = " + Human_Sensor_IP);
	debugLog("Human_Sensor2_IP = " + Human_Sensor2_IP);
}

app.post('/do_keepalive', function(req, res) {
	res.json(req.body);
	var the_body = req.body;  //see connect package above
});


app.post('/action_completed', function(req, res) {
    var the_body = req.body;  //see connect package above
    if(debug) debugLog ( "Action completed!!!");
    res.json(req.body);
	defaultmenu();
});


// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete." );
	debugLog("Waiting before printing IPs...");
	setTimeout( printIPs , 10000 );
});
