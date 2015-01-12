var os = require('os');
var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded());

// Create a screen object.
var screen = blessed.screen();

// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
	top: 'center',
	left: 'center',
	width: '50%',
	height: '50%',
	content: '',
	tags: true,
	border: {
		type: 'line'
	},
	style: {
		fg: 'white',
		bg: 'black',
		border: {
			fg: '#f0f0f0'
		},
		hover: {
			bg: 'black'
		}
	}
});

// Append our box to the screen.
screen.append(box);

app.set('port', process.env.PORT || 3000);

var my_group = ["192.168.1.100", "192.168.1.101"];	// replace with real IPs of group

var my_index = 0;	// replace with index of my IP in my_group

box.setContent('this node (' + my_group[my_index] + ') will attempt to send its token to other nodes on network. ');
screen.render();

// handle GET requests
app.get('/do_get', function (req, res){
	var the_body = req.query;
	console.log ( "get body: " + the_body );
	box.setContent("Get with query: " + the_body);
	box.style.bg = 'green';	//green for get
	screen.render();
	res.json({"query": the_body, "id": JSON.stringify(my_group[my_index])});
});

// handle POST requests
app.post('/do_post', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "post body: " + the_body );
	box.setContent("Post with body: " + the_body);
	box.style.bg = 'blue';	//blue for post
	screen.render();
	res.json({"body": the_body, "id": JSON.stringify(my_group[my_index])});
});

function nodeExample()
{

	var options = {
		hostname: my_group[( (my_index + 1) % my_group.length )],
		port: 3000,
		path: '/do_pass',
		method: 'POST'
	};

	var req = http.request( options, function(res){
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify( res.headers ));

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk );
		});
	});

	req.on('error', function(e){
	
		console.log('problem with request: ' + e.message);

	});

	re.write('data\n');
	re.write('data\n');
	req.end();

}

function examplePost()
{


var post_data = JSON.stringify({ 'one' : 2, 'two' : 2, 'three' : 3  });

var post_options = {
	host: my_group[( (my_index + 1) % my_group.length )],
	port: '3000',
	path: 'do/pass',
	method: 'POST',
	headers: { 'Content-Type' : 'application/JSON', 'Content-Length' : post_data.length }

};

var post_req = http.request( post_options, function(res){ 
	res.setEncoding('utf-8');
	//res.on( 'data' , function(chunk){  console.log( 'Responce: ' + chunk );  } );
});

console.log( "In Example" );
post_req.write(post_data);
post_req.end();

console.log( "In Example" );
}


function someFunction()
{
	var post_data = JSON.stringify( { 'one' : 1 } );		
	var post_options = {
		host: my_group[(my_index+1) % my_group.length],
		port: '3000',
		path: '/do_pass',
		method: 'POST',
		headers: {"Content-Type" : "application/json", "Content-Length" : post_data.length  }
	};
	var post_request = http.request(post_options, function() {});
	post_request.write(post_data);
	post_request.end();
}


app.post('/start_pass', function(req, res) {

        box.setContent("BODY");
	box.style.bg = 'red';	//red for pass
	screen.render();
	res.json({ "id": JSON.stringify(my_group[my_index])});
	setTimeout(wait, 500);
console.log( "Done" );

});

// handle PASS requests
app.post('/do_pass', function(req, res) {
    var the_body = req.body;	//see connect package above

    console.log ( req );
    console.log(" ");
    console.log(" ");
    console.log(" ");
   // console.log ( res );

        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();
	res.json({"body": the_body, "id": JSON.stringify(my_group[my_index])});
	setTimeout(wait, 500);

console.log( "In Example" );
});

// callback function - set myself to black
function wait()
{
	box.style.bg = 'black';	//black after pass
	screen.render();
        nodeExample();
//	examplePost();
//	someFunction();
}

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
