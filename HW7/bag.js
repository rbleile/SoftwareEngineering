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
var screen = blessed.screen();



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
	var resString =  "task inserted at bay "+task;
	var res_data = { result : resStrig, id : task.id };    
	res.json(res_data);
});

app.post('/do_get_task', function(req, res) {
	var the_body = req.body;  
	debugLog ( "received task request: " + JSON.stringify( the_body) );
	
	if(task.length > 0)
	{
		var task = tasks.pop();
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		res.json(trueResponse);	
	}
	else
	{
		var falseResponse = { isValid : false };
		debugLog("Returing false" +falseResponse);
		res.json(falseResponse);
	}
	
});

app.post('/do_get_result', function(req, res) {
	var the_body = req.body;  
	debugLog ( "received result request: " + JSON.stringify( the_body) );
	
	if(results.length > 0)
	{
		var result = results.pop();
		var trueResponse = { isValid : true, id : task.id, bayNumber : task.bayNumber};
		debugLog("Returning result "+trueResponse);
		res.json(trueResponse);	
	}
	else
	{
		var falseResponse = { isValid : false };
		debugLog("Returing false" +falseResponse);
		res.json(falseResponse);
	}
	
});

app.post('/do_insert_result', function(req, res) {
	var the_body = req.body;  
	debugLog ( "Result received: " + JSON.stringify( the_body) );
	var task = { id : the_body,  bayNumber : the_body.bayNumber}
	result.push(task);
	var resString =  "Result inserted "+task;
	var res_data = { result : resStrig, id : task.id };    
	res.json(res_data);
});

function printIPs()
{
	var list =  tokenRing.getRing();
	for( var i = 0; i < list.length; i++)
	{
		console.log(list[0]);
	}
	setTimeout( printIPs , 1000 );
}

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	//discover();
	//debugLog( "Discovery Complete." );
	//debugLog("Waiting to print IPs...");
	setTimeout( printIPs , 1000 );
});
