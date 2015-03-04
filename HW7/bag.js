var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');

tokenRing.setRole(1);

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var bays = [];
bays[0] = true;
bays[1] = true; //init bays full
bays[2] = true;


/**************************************************
 ****** START : WINDOW CODE ***********************
 **************************************************/

var screen = blessed.screen();

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.key(['r', 'R'], function(ch, key) {
    return refreshDisplay();
});


var logEvents = blessed.scrollabletext({
    width: '64%',
    height: '50%',
    top: '50%',
    left: '0%',
	censor: false,
	inputOnFocus: false,
	border: {
		type: 'line',
		fg: 'white'
	},
	style: {
		fg: 'grey',
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
	tags: false,
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
	}
});



var logResults = blessed.scrollabletext({
	top: '50%',
	left: '64%',
	width: '36%',
	height: '50%',
	tags: false,
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
    top: '0',
    left: '0',
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
    top: '0',
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
    top: '0',
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
    left: '0',
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
 
screen.render();

function refreshDisplay() {

	debugLog("Refreshing the display...");

	bay1Work.setContent("...");
	bay2Work.setContent("...");
	bay3Work.setContent("...");

	bay1Sensor.setContent("...");
	bay2Sensor.setContent("...");
	bay3Sensor.setContent("...");

	var pendingTasks = "Total == " + tasks.length + "\n";
	for (var i = 0; i < tasks.length; i++)
		pendingTasks += "[" + tasks[i].id + "] @ Bay " + tasks[i].bayNumber + "\n";

	var pendingResults = "Total == " + results.length + "\n";
	for (var i = 0; i < results.length; i++)
		pendingResults += "[" + results[i].id + "] @ Bay " + results[i].bayNumber + "\n";


	screen.render();

	return;
}

function debugLog( msg ) 
{
	//log.insertLine(0, ""+highestTS+" (high) : "+myTS+" (mine) : "+msg);
	logEvents.insertLine(0, msg);
	screen.render();
	return;
}

/**************************************************
 ****** END : WINDOW CODE *************************
 **************************************************/


var tasks = new Array();
var results = new Array();

app.post('/do_insert_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "Task received: " + JSON.stringify( the_body) );
	var task = { id : the_body,  bayNumber : the_body.bayNumber}
	tasks.push(task);
	var resString =  "task inserted at bay "+JSON.stringify(task);
	debugLog(resString);
	var res_data = { result : resString, id : task.id };    
	res.json(res_data);
});

app.post('/do_get_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "received task request: " + JSON.stringify( the_body) );
	var validTaskIdx = -1;

	//check to see if any task have a bay number that can be entered
	for(var i = 0; i < tasks.length; i++)
	{
		var bay = tasks[i].bayNumber - 1;
		if(!bays[bay]) // bay can be entered
		{
			validTaskIdx = i;
			break;
		}
	}

	if(validTaskIdx != -1)
	{
		var task = tasks[validTaskIdx];
		tasks.splice(validTaskIdx, 1);
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		res.json(trueResponse);	
		tokenRing.generalPOST(the_body.ip, "/do_return_task",trueResponse);
	}
	else
	{
		var falseResponse = { isValid : false };
		debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);
		tokenRing.generalPOST(the_body.ip, "/do_return_task",falseResponse);
	}
});

app.post('/do_get_result', function(req, res) {
	var the_body = req.body;  
	debugLog ( "received result request: " + JSON.stringify( the_body) );
	
	if(results.length > 0)
	{
		var task = results.pop();
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		debugLog("Returning result "+JSON.stringify(trueResponse));
		res.json(trueResponse);	
		tokenRing.generalPOST(the_body.ip, "/do_return_result",falseResponse);
	}
	else
	{
		var falseResponse = { isValid : false };
		debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);

		tokenRing.generalPOST(the_body.ip, "/do_return_result",falseResponse);
	}
	
});

app.post('/do_insert_result', function(req, res) {
	var the_body = req.body;  
	debugLog ( "Result received: " + JSON.stringify( the_body) );
	var task = { id : the_body,  bayNumber : the_body.bayNumber}
	results.push(task);
	var resString =  "Result inserted "+JSON.stringify(task);
	var res_data = { result : resString, id : task.id };    
	res.json(res_data);
});

app.post("/do_sensor_update", function(req, res) {
	var the_body = req.body;
	
	bays[the_body.bayNumber] = the_body.isFull;
	debugLog("Recieved Sensor update from bay "+ the_body.bayNumber+" " +the_body.isFull);
});


function printIPs()
{
	var list =  tokenRing.getRing();
	var list2 = tokenRing.getRoleList(1);
	//console.log(list+" "+list2);
}

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	//discover();
	//debugLog( "Discovery Complete." );
	//debugLog("Waiting to print IPs...");
	setTimeout( printIPs , 8000 );
});
