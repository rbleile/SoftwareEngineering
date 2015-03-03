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




// var log = blessed.scrollabletext({
//     parent: screen,
//     //mouse: true,
//     keys: true,
//     //vi: true,
//     border: {
//     type: 'line',
//     fg: '#00ff00'
//     },
//     scrollbar: {
//     fg: 'blue',
//     ch: '|'
//     },
//     width: '100%',
//     height: '100%',
//     //top: '10%',
//     //left: '50%',
//     align: 'left',
//     tags: true
// });

//screen.append(log);
function debugLog( msg ) 
{
	//log.insertLine(0, msg);
	console.log(msg);
	screen.render();
	return;
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

			//tokenRing.removeRingMember(genHost);

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
/*
curl -H "Content-Type: application/json" -d '{"id" : "1",  "bayNumber" : "0"}' http://localhost:3000/do_get_result
curl -H "Content-Type: application/json" -d '{"id" : "1",  "bayNumber" : "0"}' http://localhost:3000/do_get_task
curl -H "Content-Type: application/json" -d '{"id" : "1",  "bayNumber" : "0"}' http://localhost:3000/do_insert_result
curl -H "Content-Type: application/json" -d '{"id" : "1",  "bayNumber" : "0"}' http://localhost:3000/do_insert_task
*/


app.post("/do_sensor_update", function(req, res) {
	var the_body = req.body;
	
	bays[the_body.bayNumber] = the_body.isFull;
	debugLog("Recieved Sensor update from bay "+ the_body.bayNumber+" " +the_body.isFull);

});


function printIPs()
{
	var list =  tokenRing.getRing();
	var list2 = tokenRing.getRoleList(1);
	console.log(list+" "+list2);

	//setTimeout( printIPs , 8000 );
}

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	//discover();
	//debugLog( "Discovery Complete." );
	//debugLog("Waiting to print IPs...");
	setTimeout( printIPs , 8000 );
});
