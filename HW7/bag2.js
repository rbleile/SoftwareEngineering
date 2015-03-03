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
var screen = blessed.screen();

var bays = [];
bays[0] = true;
bays[1] = true; //init bays full
bays[2] = true;


//screen.append(log);
function debugLog( msg ) 
{
	//log.insertLine(0, msg);
	console.log(msg);
	screen.render();
	return;
}

var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '10%',
    content: '{center}BAG - BAG - BAG{/center}',
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

var logTasks = blessed.scrollabletext({
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
    left: '0%',
    align: 'left',
    tags: true
});

var logResults = blessed.scrollabletext({
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


var tasks = [];
var results = [];

app.post('/do_insert_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "Task received: " + JSON.stringify( the_body) );
	var task = { id : the_body,  bayNumber : the_body.bayNumber}
	tasks.push(task);

	debugLog( "Task Length: " + tasks.length );

	var resString =  "task inserted at bay "+JSON.stringify(task);
	debugLog(resString);
	var res_data = { result : resString, id : task.id };    
	res.json(res_data);
});

app.post('/do_get_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "received task request: " + JSON.stringify( the_body) );
	var validTaskIdx = -1;

	debugLog( "Tasks" + JSON.stringify( tasks ) );

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
