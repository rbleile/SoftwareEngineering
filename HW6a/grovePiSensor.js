var http = require('http');
var express = require('express');
var connect = require("connect");
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');
var PythonShell = require('python-shell');
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

/*
function debugLog( msg ) 
{
	log.insertLine(1, msg);
	screen.render();
	return;
}
*/
app.set('port', process.env.PORT || 3000);

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests
app.post('/do_discover', function(req, res) {
var the_body = req.body;  //see connect package above
//	if(debug) debugLog ( "discovery received: " + JSON.stringify( the_body) );

	tokenRing.addRingMember(the_body.ip);

	var i = parseInt(the_body.role);

	//debugLog( "recieved role: " + i );

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
//			if(debug) debugLog( "which not Special type" + the_body.role );	
	}

	var post_data = { ip : tokenRing.getMyIP(), role: node_functionality };    

	res.json( post_data );

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
//			debugLog(resultObject);
			tokenRing.addRingMember(resultObject.ip);

		var i = parseInt(resultObject.role);

		//debugLog( "Role responce: " + resultObject.role );
//		debugLog( JSON.stringify( resultObject ) );

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
//				if(debug) debugLog( "which not Special type" + resultObject.role );	
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
//	box.style.bg = 'red';
//   log.focus();
 //   screen.render();

//    if(debug) debugLog("Starting Discovery");
	//limit the scanning range
	var start_ip = 100;
	var end_ip   = 120;
   
	//we are assuming a subnet mask of 255.255.255.0

	//break it up to extract what we need 
	var ip_add = tokenRing.getMyIP().split(".");

	//put it back together without the last part
	var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
//	if(debug) debugLog("Base ip address : " +  base_add);

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
	////debugLog("Calling keepalive " );
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
//			if(debug) debugLog("Lost connection to " + genHost + "removing from ring");

			tokenRing.removeRingMember(genHost);

//			if(debug) debugLog("generalPOST err called "+ e);
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

var options = {
  mode: 'text',
  pythonPath: '/usr/bin/python',
  pythonOptions: ['-u'],
  scriptPath: '/home/pi/GrovePi/Software/Python',
  //args: ['value1', 'value2', 'value3']
};
var isFull =false;
app.get('/do_get_dist', function (req, res){
	var the_body = req.query;
//	var isFull = false;
	PythonShell.run('one_ultra.py', options, function (err, results) {
	if (err) throw err;
	  // results is an array consisting of messages collected during execution 
	  console.log('results: %j', results);
	  if(results[0] < 50) isFull = true;
          console.log("is full : " + isFull + " "+results[0]);	
	});
	res.json({"isFull" : isFull});

	var post_data = { "ip": tokenRing.getMyIP(), "isFull" : isFull }

	generalPOST( HOST_IP, '/do_sensor_responce', post_data )
});


http.createServer(app).listen(app.get('port'), function(){
//	debugLog("Express server listening on port " + app.get('port'));
	discover();
//	debugLog( "Discovery Complete" );
});
