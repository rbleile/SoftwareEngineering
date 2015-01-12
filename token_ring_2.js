var os = require('os');
var fs = require('fs');
var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var app = express();

//app.use(bodyParser.urlencoded());

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

var my_group = ["192.168.1.102", "192.168.1.101"];	// replace with real IPs of group

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

var post_data = querystring.stringify( { n: 1 } );

	var options = {
		hostname: my_group[( (my_index + 1) % my_group.length )],
		port: 3000,
		path: '/do_pass',
		method: 'POST',
		headers: { 'Content-Type': 'x-www-form-urlencoded', 'Content-Length' : post_data.length }
	};

	var req = http.request( options, function(res){

	//	console.log('STATUS: ' + res.statusCode);
	//	console.log('HEADERS: ' + JSON.stringify( res.headers ));

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk );
		});
	});

	req.on('error', function(e){
	
		console.log('problem with request: ' + e.message);

	});

	req.write( post_data );
//	req.write('NOW NOW NOW NOW');
	req.end();

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

    console.log(" ");
    console.log("My Responce Body");
    console.log( the_body );
//    console.log( JSON.stringify( the_body ) );


//    console.log ( req );


    //fs.writeFile( "test.txt", JSON.stringify( req ), function( err ){ if (err){ console.log(err)}  } );



    console.log(" ");
    console.log(" ");
//    console.log(" ");
   // console.log ( res );

        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();
	res.json({"id":"responce"});
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
