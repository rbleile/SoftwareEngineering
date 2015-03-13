var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');
var fs = require('fs');
tokenRing.setRole(1);

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = false;
var blueTruck = -1;
var blueIp = "0.0.0.1";
var redIp = "0.0.0.2";
var redTruck = -1;
var tasks = [];
var results = [];
var bays = [];
//each bay has information about the active task; activeTasks[0] = bay 0 info
var activeTasks = [];

var aTaskProperties1 = { isActive : false, ip : "0.0.0.0", id : -1 };
var aTaskProperties2 = { isActive : false, ip : "0.0.0.0", id : -1 };
var aTaskProperties3 = { isActive : false, ip : "0.0.0.0", id : -1 };

activeTasks[0] = aTaskProperties1; //bay 0 
activeTasks[1] = aTaskProperties2; //bay 1
activeTasks[2] = aTaskProperties3; //bay 2

bays[0] = false;
bays[1] = false; //init bays full
bays[2] = false;

var numCriticalLocations = 8; //same as in truck.js
var request_array = [];
var working_array = [];
var numTrucks = 2;
var TRUCK_IPs = [];
for (var i = 0; i < numCriticalLocations; i++)
{
	var temp = [];
	temp.push("0.0.0.0");
	temp.push("0.0.0.0");
	request_array.push(temp);
	working_array.push("0.0.0.0");
}
// for (var i = 0; i < numCriticalLocations; i++)
// {
// 	for (var j = 0; j < numTrucks; j++)
// 	{
// 		request_array[i].push("0.0.0.0");	
// 	}
// }

/**************************************************
 ****** START : WINDOW CODE ***********************
 **************************************************/

var screen = blessed.screen();

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.key(['r', 'R'], function(ch, key) {
	debugLog("Refreshing. [My IP:" + tokenRing.getMyIP() + "]");
    return refreshDisplay();
});


var logEvents = blessed.scrollabletext({
    width: '64%',
    height: '50%',
    top: '50%',
    left: '0%',
    keys: true,
    vi: true,
	censor: false,
	inputOnFocus: false,
	border: {
		type: 'line',
		fg: 'white'
	},
	style: {
		fg: 'white',
		bg: 'black',
		bold: false,
		border: {
			fg: 'white',
			bg: 'black',
			bold: true,
			underline: false
		}
	}
});



var logTasks = blessed.scrollabletext({
    width: '36%',
    height: '50%',
    top: '0%',
    left: '64%',
	tags: true,
	censor: false,
	inputOnFocus: false,
	border: {
		type: 'line',
		fg: 'green',
		bold: true
	},
	style: {
		fg: 'white',
		bg: '#002200',
		bold: true,
	},
	hidden: false
});



var logResults = blessed.scrollabletext({
	top: '50%',
	left: '64%',
	width: '36%',
	height: '50%',
	tags: true,
	censor: false,
	inputOnFocus: false,
	border: {
		type: 'line',
		fg: 'blue',
		bold: true
	},
	style: {
		fg: 'white',
		bg: 'blue',
		bold: true
	}
});


/**********
 ***  Little boxes...
 ***/



var bay1Sensor = blessed.box({
    width: '20%',
    height: '20%',
    top: '0%',
    left: '0%',
    align: 'center',
    valign: 'middle',
   	content: 'SENSOR[1]',
	border: false,
	style: {
		fg: 'white',
		bg: 'red',
		bold: true
	}
});

var bay2Sensor = blessed.box({
    width: '20%',
    height: '20%',
    top: '0%',
    left: '22%',
    align: 'center',
    valign: 'middle',
   	content: 'SENSOR[2]',
	border: false,
	style: {
		fg: 'white',
		bg: 'red',
		bold: true
	}
});

var bay3Sensor = blessed.box({
    width: '20%',
    height: '20%',
    top: '0%',
    left: '44%',
    align: 'center',
    valign: 'middle',
   	content: 'SENSOR[3]',
	border: false,
	style: {
		fg: 'white',
		bg: 'red',
		bold: true
	}
});


var bay1Work = blessed.scrollabletext({
    width: '20%',
    height: '20%',
    top: '25%',
    left: '0%',
    align: 'center',
    valign: 'middle',
   	content: 'WORK(1)',
	censor: false,
	inputOnFocus: false,
	border: false,
	style: {
		fg: 'black',
		bg: 'white',
		bold: false
	}
});

var bay2Work = blessed.scrollabletext({
    width: '20%',
    height: '20%',
    top: '25%',
    left: '22%',
    align: 'center',
    valign: 'middle',
   	content: 'WORK(2)',
	censor: false,
	inputOnFocus: false,
	border: false,
	style: {
		fg: 'black',
		bg: 'white',
		bold: false
	}
});

var bay3Work = blessed.scrollabletext({
    width: '20%',
    height: '20%',
    top: '25%',
    left: '44%',
    align: 'center',
    valign: 'middle',
   	content: 'WORK(3)',
	censor: false,
	inputOnFocus: false,
	border: false,
	style: {
		fg: 'black',
		bg: 'white',
		bold: false
	}
});

/**********/



screen.append(logResults);
screen.append(logTasks);
screen.append(logEvents);
screen.append(bay1Sensor);
screen.append(bay2Sensor);
screen.append(bay3Sensor);
screen.append(bay1Work);
screen.append(bay2Work);
screen.append(bay3Work);

logEvents.setLabel({ text: '{  EVENT LOG  }', side: 'left' });
logTasks.setLabel({ text: '{  PENDING TASKS  }', side: 'left' });
logResults.setLabel({ text: '{  UNREAD RESULTS  }', side: 'left' });

bay1Work.setLabel({ text: '[WORK:1]', side: 'right' });
bay2Work.setLabel({ text: '[WORK:2]', side: 'right' });
bay3Work.setLabel({ text: '[WORK:3]', side: 'right' });

bay1Sensor.setLabel({ text: '[SENSOR:1]', side: 'left' })
bay2Sensor.setLabel({ text: '[SENSOR:2]', side: 'left' })
bay3Sensor.setLabel({ text: '[SENSOR:3]', side: 'left' })

screen.render();

function refreshDisplay() {
    
	var bay1TaskCount = 0;
	var bay2TaskCount = 0;
	var bay3TaskCount = 0;
	var bay1Risk = "";
	var bay2Risk = "";
	var bay3Risk = "";

	var pendingTasks = "Total = {bold}" + tasks.length + "{/bold}\n";
	for (var i = 0; i < tasks.length; i++) {
		pendingTasks += "[" + tasks[i].id + "] @ Bay " + tasks[i].bayNumber + "\n";
		if (tasks[i].bayNumber == 1) bay1TaskCount++;
		if (tasks[i].bayNumber == 2) bay2TaskCount++;
		if (tasks[i].bayNumber == 3) bay3TaskCount++;
	};

	var pendingResults = "Total = {bold}" + results.length + "{/bold}\n";
	for (var i = 0; i < results.length; i++) {
		pendingResults += "[" + results[i].id + "] @ Bay " + results[i].bayNum + "\n";
	};

	bay1Work.setContent("" + bay1TaskCount);
	bay2Work.setContent("" + bay2TaskCount);
	bay3Work.setContent("" + bay3TaskCount);

	if (bays[0]) {
		bay1Risk = "/ X X \\\nDANGER!\n\\ X X /";
		bay1Sensor.style = { fg: 'white', bg: 'red', bold: true };
	} else {
		bay1Risk = "--------\n  SAFE  \n--------";
		bay1Sensor.style = { fg: 'white', bg: 'green', bold: true };
	}

	if (bays[1]) {
		bay2Risk = "/ X X \\\nDANGER!\n\\ X X /";
		bay2Sensor.style = { fg: 'white', bg: 'red', bold: true };
	} else {
		bay2Risk = "--------\n  SAFE  \n--------";
		bay2Sensor.style = { fg: 'white', bg: 'green', bold: true };
	}

	if (bays[2]) {
		bay3Risk = "/ X X \\\nDANGER!\n\\ X X /";
		bay3Sensor.style = { fg: 'white', bg: 'red', bold: true };
	} else {
		bay3Risk = "--------\n  SAFE  \n--------";
		bay3Sensor.style = { fg: 'white', bg: 'green', bold: true };
	}

	bay1Sensor.setContent(bay1Risk);
	bay2Sensor.setContent(bay2Risk);
	bay3Sensor.setContent(bay3Risk);
	logTasks.setContent(pendingTasks);
	logResults.setContent(pendingResults);

	logEvents.focus();
    
	screen.render();

	return;
}

function debugLog( msg ) 
{
	logEvents.insertLine(0, msg);
	screen.render();
	return;
}

/**************************************************
 ****** END : WINDOW CODE *************************
 **************************************************/


app.post('/do_insert_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "Task received: " + JSON.stringify( the_body) );

	if( the_body.bayNumber == 1 || the_body.bayNumber == 2 || the_body.bayNumber == 3 ){ 

		var task = { id : the_body.id,  bayNumber : the_body.bayNumber}
		tasks.push(task);
	
		if (debug) debugLog( "Task Length: " + tasks.length );
	
		var resString =  "task inserted at bay "+ JSON.stringify(task.bayNumber);
		if (debug) debugLog(resString);
		var res_data = { result : resString, id : task.id };    
		res.json(res_data);
		refreshDisplay();

	}

});

app.post('/do_insert_result', function(req, res) {
	var task = req.body;  
	debugLog ( "Result received: " + JSON.stringify( task ) );
	//var task = { id : the_body.id,  bayNumber : the_body.bayNumber}
	if (debug) debugLog("VAL: " + task.bayNum-1);
	results.push(task);
	var resString =  "Result inserted "+JSON.stringify(task);
	var res_data = { result : resString, id : task.id };  
	activeTasks[task.bayNum-1].isActive = false;
	activeTasks[task.bayNum-1].ip = "0.0.0.0";
	activeTasks[task.bayNum-1].id = -1;
	res.json(res_data);
    refreshDisplay();

});

app.post('/do_get_bays', function(req, res){

	var the_body = req.body;  
	res.json(the_body);

	tokenRing.generalPOST( the_body.ip, '/do_receivedBays', bays );
});

app.post('/do_get_task', function(req, res) {
	var the_body = req.body;  
	if (debug) debugLog ( "received task request: " + JSON.stringify( the_body) );
	var validTaskIdx = -1;
    
	if (debug) debugLog( "Tasks" + JSON.stringify( tasks ) );
	if (debug) debugLog( "Task size: " + tasks.length );
	if (debug) debugLog("Bays: " + JSON.stringify( bays ) );
	if (debug) debugLog("activeTasks: " + JSON.stringify( activeTasks ) );

	//check to see if any task have a bay number that can be entered
	for(var i = 0; i < tasks.length; i++)
	{
		var bay = tasks[i].bayNumber - 1;
		if (debug) debugLog("activeTasks: " + bay );
		if(!bays[bay] && !activeTasks[bay].isActive) // bay can be entered and no nobody is has a task to the same bay
		{
			validTaskIdx = i;
			if (debug) debugLog( "Valid Task: " + validTaskIdx );
			break;
		}
	}

	if (debug) debugLog( "Valid Task: " + validTaskIdx );
	if(validTaskIdx != -1)
	{
		var task = tasks[validTaskIdx];
		tasks.splice(validTaskIdx, 1);
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		res.json(trueResponse);	
		debugLog( "Returning True" );
		tokenRing.generalPOST(the_body.ip, "/do_return_task",trueResponse);
		if (debug) debugLog("before AT: " + JSON.stringify(activeTasks));
		activeTasks[task.bayNumber-1].isActive = true;
		activeTasks[task.bayNumber-1].ip = the_body.ip;
		activeTasks[task.bayNumber-1].id = task.id;
		if (debug) debugLog("after AT: " + JSON.stringify(activeTasks));

	}
	else
	{
		var falseResponse = { isValid : false };
		if (debug) debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);
		tokenRing.generalPOST(the_body.ip, "/do_return_task",falseResponse);
	}
refreshDisplay();
});

app.post('/do_get_result', function(req, res) {
	var the_body = req.body;  
	if (debug) debugLog ( "received result request: " + JSON.stringify( the_body) );
	//res.json(the_body);
	if(results.length > 0)
	{
		var task = results.pop();
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		if (debug) debugLog("Returning result "+JSON.stringify(trueResponse));
		res.json(trueResponse);	
		tokenRing.generalPOST(the_body.ip, "/do_return_result",trueResponse);
	}
	else
	{
		var falseResponse = { isValid : false };
		if (debug) debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);

		tokenRing.generalPOST(the_body.ip, "/do_return_result",falseResponse);
	}
refreshDisplay();
	
});

app.post("/do_sensor_update", function(req, res) {
	var the_body = req.body;
	
	bays[the_body.bayNumber] = the_body.isFull;
	debugLog("Recieved Sensor update from bay "+ ( parseInt(the_body.bayNumber) ) + " " +the_body.isFull);
	refreshDisplay();
	res.json(the_body);
});

var truckLocations = [];
var objobjojb1 = {"ip": "0.0.0.0", "currLocation": -1};
var objobjojb2 = {"ip": "0.0.0.0", "currLocation": -1};

truckLocations.push(objobjojb1);
truckLocations.push(objobjojb2);


function indexInTruckInList(ip)
{
	for(var i = 0; i<truckLocations.length;i++)
	{
		if(ip == truckLocations[i].ip) return i;
	}
	return -1;
}

function getEmptyTruckListIndex()
{
	for(var i = 0; i<truckLocations.length;i++)
	{
		if("0.0.0.0" == truckLocations[i].ip) return i;
	}

	return -1
}

app.post("/do_update_trucks", function(req, res) {
	var the_body = req.body;
	TRUCK_IPs = the_body.trucks;
	numTrucks = the_body.trucks.length;
   

	debugLog("num_TRUCKS " + numTrucks);
	debugLog("TRUCKS " + TRUCK_IPs);
	res.json(the_body);
});

app.post("/do_update_move", function(req, res) {
	var the_body = req.body; // ip, location
	debugLog("/do_update_move");
	res.json(the_body);
	var obj = {"ip": the_body.ip, "currLocation": the_body.location};
	var idx = indexInTruckInList(the_body.ip);
	if(idx == -1) idx = getEmptyTruckListIndex();

	truckLocations[idx].ip = the_body.ip;
	truckLocations[idx].currLocation = the_body.location+2; //this is to match the truck locations
	if(truckLocations[idx].currLocation == 8)
	{
		redTruck = idx;
		redIp = truckLocations[idx].ip;
	}
	else if(truckLocations[idx].currLocation == 9)
	{
		blueTruck = idx;
		blueIp = truckLocations[idx].ip;
	}
	debugLog("Truck " + truckLocations[idx].ip + " at " + truckLocations[idx].currLocation);

});

/*
 * Does the webpage need to know where the truck starts?
app.post("/do_update_start_point", function(req, res) {
	var the_body = req.body; // ip, nextCS
	
	startLocation = the_body.startDoor;
});
*/

app.post("/do_update_request", function(req, res) {
	var the_body = req.body; // ip, lock
	debugLog("/do_update_request at "+the_body.lock);
	//debugLog("lock: " + the_body.lock);
	request_array[the_body.lock][TRUCK_IPs.indexOf(the_body.ip)] = the_body.ip;
	res.json(the_body);
	for (var i = 2; i < request_array.length; i++)
	{
		for (var j = 0; j < numTrucks; j++)
		{
			debugLog("request_array[" + i+ "][" + j + "]: " + request_array[i][j]);
		}
	}
});

app.post("/do_update_truck_initial", function(req, res) {
	var the_body = req.body; // initLock
	//debugLog("truck at CS (door)" + the_body.initLock);
	res.json(the_body);
});

app.post("/do_update_work", function(req, res) {
	var the_body = req.body; // ip, lock
	debugLog("/do_update_work at "+the_body.lock);
	working_array[the_body.lock] = the_body.ip;
	for (var i = 2; i < working_array.length; i++)
		debugLog("working_array[" + i+ "]: " + working_array[i]);
	if(the_body.lock >1)
	{
		var idx = request_array[the_body.lock].indexOf(the_body.ip);
		if(idx != -1)
		{
			request_array[the_body.lock][idx] = "0.0.0.0";
		}
		else
		{
			debugLog("This should never happen" +request_array[the_body.lock]);
		} 
	}
	
	res.json(the_body);
});

app.post("/do_update_release_shotgun", function(req, res) {
	var the_body = req.body; // ip, lock
	debugLog("/do_update_release_shotgun at "+the_body.lock);
	working_array[the_body.lock] = "0.0.0.0";
	for (var i = 2; i < working_array.length; i++)
		debugLog("working_array[" + i + "]: " + working_array[i]);
	res.json(the_body);
})

app.get('/do_get_state', function (req, res){
	var the_body = req.query;
	console.log ( "get body: " + the_body );
	var bayTasks = [];


	var global_state = 
	{
			bayState : bays,
			requestedLocks : request_array,
			actualLocks : working_array,
			locations : truckLocations
	};

	res.json(global_state);
});


function writedata()
{
	var bayTasks = [];
	bayTasks[0] = 0;
	bayTasks[1] = 0;
	bayTasks[2] = 0;
	var bPos; 
	var rPos;

	if(blueTruck != -1)  bPos = truckLocations[blueTruck].currLocation;
	else bPos = 9;
	if(redTruck != -1)  rPos = truckLocations[redTruck].currLocation;
	else rPos = 8;
	
	for(var i = 0; i < tasks.length; i++)
	{
		bayTasks[tasks[i].bayNumber-1]++;
	}

	var locks = [];
	for(var i = 0; i < working_array.length; i++)
	{
		if(working_array[i] == blueIp)
		{
			locks[i] = 'blue';
		}
		else if(working_array[i] == redIp)
		{
			locks[i] = 'red';
		}
		else
		{
			locks[i] = 'none';
		}
	}


	var requestlocks = [];
	
	for(var i = 0; i < request_array.length; i++)
	{
		var temp= [];
		temp.push('none');
		temp.push('none');
		requestlocks.push(temp);
	}

	for(var i = 0; i < request_array.length; i++)
	{	

		for(var j = 0; j < 2; j++)
		{
			if(request_array[i][j] == blueIp)
			{
				requestlocks[i][j] = 'blue';
			}
			else if(request_array[i][j] == redIp)
			{
				requestlocks[i][j] = 'red';
			}
			else 
			{
				requestlocks[i][j] = 'none';	
			}

		}
		
		
	}

	var global_state = 
	{
			bayState : bays,
			bayTaskCount : bayTasks,
			requestedLocks : requestlocks,
			locks : locks,
			blueLoc : bPos,
			redLoc : rPos,
			redIp : redIp,
			blueIp : blueIp
	};

	//debugLog("Red loc "+ rPos +"  blue loc "+bPos);
	var outputFilename = 'html/state.json';

	fs.writeFile(outputFilename, JSON.stringify(global_state, null, 4), function(err) {
	    if(err) {
	      console.log(err);
	    } else {
	      //console.log("JSON saved to " + outputFilename);
	    }
	}); 

	setTimeout( writedata , 500 );
}


function printIPs()
{
	var list =  tokenRing.getRing();
	var list2 = tokenRing.getRoleList(1);

	refreshDisplay();
	//console.log(list+" "+list2);
}

function callback(ip)
{
	if (debug) debugLog(" Test failurecallack "+ ip);
	//console.log("SDGSGDFSDFSD");
}

tokenRing.registerFailureCallback(callback);

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	setTimeout(printIPs, 8000);
	setTimeout( writedata , 500 );
	
});
