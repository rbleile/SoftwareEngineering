var http = require('http');
var express = require('express');
var connect = require("connect");
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');
var PythonShell = require('python-shell');

tokenRing.setRole(3);

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;

var myArgs = process.argv.slice(2);
if( !myArgs[0] ) myArgs[0] = -1;
var whichBay = myArgs[0];

var options = {
  mode: 'text',
  pythonPath: '/usr/bin/python',
  pythonOptions: ['-u'],
  scriptPath: '/home/pi/GrovePi/Software/Python',
  //args: ['value1', 'value2', 'value3']
};

var Bag_IP;

function getBagIP()
{
	var bag = [];
	bag = tokenRing.getRoleList(1);
	if (bag.length == 1)
	{
		Bag_IP = bag[0];
	}
}

var isFull = false;

function sensorUpdate()
{
	PythonShell.run('one_ultra.py', options, function (err, results) {
		if (err) throw err;
		// results is an array consisting of messages collected during execution 
		console.log('results: %j', results);
		if(parseInt(results[0]) < 50) 
		{
			isFull = true;
		}
		else { isFull = false; }
	    	console.log("is full : " + isFull + " "+results[0]);	
	});

	var post_data = { "ip": tokenRing.getMyIP(), "isFull" : isFull , "bayNumber" : whichBay };
	tokenRing.generalPOST(Bag_IP, '/do_sensor_update', post_data );
	setTimeout ( sensorUpdate , 3000 );
}

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("I am bay "+ whichBay);
	sensorUpdate();
});
