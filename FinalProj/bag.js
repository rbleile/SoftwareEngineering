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


var tasks = [];
var results = [];
var bays = [];
//each bay has information about the active task; activeTasks[0] = bay 0 info
var activeTasks = [];

var aTaskProperties = { isActive : false, ip : "0.0.0.0", id : -1 };
activeTasks[0] = aTaskProperties; //bay 0 
activeTasks[1] = aTaskProperties; //bay 1
activeTasks[2] = aTaskProperties; //bay 2

bays[0] = false;
bays[1] = false; //init bays full
bays[2] = false;


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
		pendingResults += "[" + results[i].id + "] @ Bay " + results[i].bayNumber + "\n";
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
	//log.insertLine(0, ""+highestTS+" (high) : "+myTS+" (mine) : "+msg);
	logEvents.insertLine(0, msg);
	//console.log( msg );
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
	
		//debugLog( "Task Length: " + tasks.length );
	
		var resString =  "task inserted at bay "+ JSON.stringify(task.bayNumber);
		//debugLog(resString);
		var res_data = { result : resString, id : task.id };    
		res.json(res_data);
		refreshDisplay();

	}

});

app.post('/do_insert_result', function(req, res) {
	var task = req.body;  
	debugLog ( "Result received: " + JSON.stringify( task ) );
	//var task = { id : the_body.id,  bayNumber : the_body.bayNumber}
	debugLog("VAL: " + task.bayNum-1);
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

	tokenRing.generalPOST( the_body.ip, '/do_recievedBays', bays );
});

app.post('/do_get_task', function(req, res) {
	var the_body = req.body;  
	//debugLog ( "received task request: " + JSON.stringify( the_body) );
	var validTaskIdx = -1;
    
	//debugLog( "Tasks" + JSON.stringify( tasks ) );
	//debugLog( "Task size: " + tasks.length );
	//debugLog("Bays: " + JSON.stringify( bays ) );
	//debugLog("activeTasks: " + JSON.stringify( activeTasks ) );

	//check to see if any task have a bay number that can be entered
	for(var i = 0; i < tasks.length; i++)
	{
		var bay = tasks[i].bayNumber - 1;
		//debugLog("activeTasks: " + bay );
		if(!bays[bay] && !activeTasks[bay].isActive) // bay can be entered and no nobody is has a task to the same bay
		{
			validTaskIdx = i;
			//debugLog( "Valid Task: " + validTaskIdx );
			break;
		}
	}

	//debugLog( "Valid Task: " + validTaskIdx );
	if(validTaskIdx != -1)
	{
		var task = tasks[validTaskIdx];
		tasks.splice(validTaskIdx, 1);
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		res.json(trueResponse);	
		//debugLog( "Returning True" );
		tokenRing.generalPOST(the_body.ip, "/do_return_task",trueResponse);
		activeTasks[task.bayNumber-1].isActive = true;
		activeTasks[task.bayNumber-1].ip = the_body.ip;
		activeTasks[task.bayNumber-1].id = task.id;

	}
	else
	{
		var falseResponse = { isValid : false };
		//debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);
		tokenRing.generalPOST(the_body.ip, "/do_return_task",falseResponse);
	}
refreshDisplay();
});

app.post('/do_get_result', function(req, res) {
	var the_body = req.body;  
	//debugLog ( "received result request: " + JSON.stringify( the_body) );
	
	if(results.length > 0)
	{
		var task = results.pop();
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		debugLog("Returning result "+JSON.stringify(trueResponse));
		res.json(trueResponse);	
		tokenRing.generalPOST(the_body.ip, "/do_return_result",trueResponse);
	}
	else
	{
		var falseResponse = { isValid : false };
		//debugLog("Returing false" +JSON.stringify(falseResponse));
		res.json(falseResponse);

		tokenRing.generalPOST(the_body.ip, "/do_return_result",falseResponse);
	}
refreshDisplay();
	
});

app.post("/do_sensor_update", function(req, res) {
	var the_body = req.body;
	
	bays[the_body.bayNumber] = the_body.isFull;
	debugLog("Recieved Sensor update from bay "+ ( parseInt(the_body.bayNumber) + 1 ) + " " +the_body.isFull);
refreshDisplay();
});


function printIPs()
{
	var list =  tokenRing.getRing();
	var list2 = tokenRing.getRoleList(1);
	//console.log(list+" "+list2);
}

function callback(ip)
{
	//debugLog(" Test failurecallack "+ ip);
	//console.log("SDGSGDFSDFSD");

}

tokenRing.registerFailureCallback(callback);

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	setTimeout( printIPs , 8000 );
});
