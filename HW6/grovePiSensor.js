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

// var debug = true;
// tokenRing.debugMessages(false);

// var myArgs = process.argv.slice(2);

// if( !myArgs[0] ) myArgs[0] = -1;

// var node_functionality = myArgs[0];

// var PICA_IP;

// // Create a screen object.


// var log = blessed.scrollabletext({
//     parent: screen,
//     mouse: true,
//     keys: true,
//     vi: true,
//     border: {
// 	type: 'line',
// 	fg: '#00ff00'
//     },
//     scrollbar: {
// 	fg: 'blue',
// 	ch: '|'
//     },
//     width: '100%',
//     height: '60%',
//     top: '20%',
//     left: 'left',
//     align: 'left',
//     tags: true
// });
        
// var box = blessed.box({
//     parent: screen,
//     top: '0%',
//     left: 'left',
//     width: '100%',
//     height: '20%',
//     content: '',
//     tags: true,
//     border: {
// 	type: 'line',
// 	fg: 'white'
//     },
//     style: {
// 	fg: 'white',
// 	bg: 'black',
// 	border: {
// 	    fg: '#f0f0f0'
// 	}
//     }
// });

// /********* BUTTON CODE *********/
// var reqResourceButton = blessed.box({
//     parent: screen,
//     top: '80%',
//     height: '20%',
//     width: '50%',
//     left: '0%',
//     border: {
// 	type: 'line',
// 	fg: '#ffffff'
//     },
//     fg: '#ffffff',
//     bg: '#228822',
//     content: '{center}Z = Request Resource{/center}',
//     tags: true,
//     hoverEffects: {
// 	bg: 'green'
//     },
// 	hidden: true
// });

// reqResourceButton.on('click', function(data) {
// 	//if (STATE == GAP_STATE)
// 	//	reqResource();
// 	//else if (STATE == WORK_STATE)
// 	//	if(debug) debugLog( "Pending CS Return" );
// 		//releaseShotgun();
// });

// screen.key(['z', 'Z'], function(ch, key) {
// 	//if (STATE == GAP_STATE)
// 	//	reqResource();
// 	//else if (STATE == WORK_STATE)
// 	//	if(debug) debugLog( "Pending CS Return" );
// 	//	//releaseShotgun();
// });

// screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
//     return process.exit(0);
// });

// reqResourceButton.focus();
// screen.render();
// /********* END BUTTON ***********/

// function debugLog( msg ) 
// {
// 	log.insertLine(1, ""+highestTS+" (high) : "+myTS+" (mine) : "+msg);
// 	screen.render();
// 	return;
// }

// app.set('port', process.env.PORT || 3000);

// //curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// // handle discovery requests
// app.post('/do_discover', function(req, res) {
// 	var the_body = req.body;  //see connect package above
// 	if(debug) debugLog ( "discovery received: " + JSON.stringify( the_body) );

// 	tokenRing.addRingMember(the_body.ip);

// 	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
// });



// /*
//  * General function to replace separate functions for all different types of
//  * posts, e.g. winner, election
//  */
// function generalPOST ( genHost, genPath, post_data, err, res )
// {
// 	// check if arg param err does not exist
// 	if (typeof(err) != "function")
// 	{
// 		err = function(e) 
// 		{
// 			if(debug) debugLog("Lost connection to " + genHost + "removing from ring");

// 			tokenRing.removeRingMember(genHost);

// 			processApproval(genHost);

// 			if(debug) debugLog("generalPOST err called "+ e);
// 		};
// 	}

// 	// check if arg param res does not exist
// 	if (typeof(res) != "function")
// 	{
// 		res = function(r) {} ;
// 	}

// 	var dataString = JSON.stringify( post_data );

// 	var headers = {
// 		'Content-Type': 'application/json',
// 		'Content-Length': dataString.length
// 	};

// 	var post_options = {
// 		host: genHost,
// 		port: '3000',
// 		path: genPath,
// 		method: 'POST',
// 		headers: headers
// 	};

// 	var post_request = http.request(post_options, function(res){
// 		res.setEncoding('utf-8');
		
// 		var responseString = '';

// 		res.on('data', function(data){
// 			responseString += data;
// 		});

// 		res.on('end', function(){
// 			//var resultObject = JSON.parse(responseString);
// 		});
// 	});
	
// 	post_request.on('error', err );
// 	post_request.write(dataString);
// 	post_request.end();
// }

// app.post('/do_keepalive', function(req, res) {
// 	res.json(req.body);
// 	var the_body = req.body;  //see connect package above
// });

// box.setContent('this node (' + tokenRing.getMyIP() + ') will attempt to send its token to other nodes on network. ');
// screen.render();

// // Focus our element.
// box.focus();


app.post('/process_resource_request', function(req, res) {
	var the_body = req.body;  

	//if(debug) debugLog ( "process_resource_request " + JSON.stringify( the_body) );



	res.json({"ip": tokenRing.getMyIP(), "body" : the_body});
});

var options = {
  mode: 'text',
  pythonPath: '/usr/bin/python',
  pythonOptions: ['-u'],
  scriptPath: '/home/pi/GrovePi/Software/Python',
  //args: ['value1', 'value2', 'value3']
};

app.get('/do_get_dist', function (req, res){
	var the_body = req.query;
	var distance;
	PythonShell.run('my_script.py', options, function (err, results) {
	if (err) throw err;
	  // results is an array consisting of messages collected during execution 
	  console.log('results: %j', results);
	});
	res.json({"distance"  : results});
});


// Render the screen.
//screen.render();

http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	discover();
	debugLog( "Discovery Complete" );
	setTimeout( initializePICA, 4000  );
});
