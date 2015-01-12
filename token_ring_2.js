var os = require('os');
var fs = require('fs');
var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var querystring = require('querystring');
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

var my_group = ["192.168.1.102", "192.168.1.101", "192.168.1.102"];	// replace with real IPs of group

var my_index = 1;	// replace with index of my IP in my_group

box.setContent('this node (' + my_group[my_index] + ') will attempt to send its token to other nodes on network. ');
screen.render();

function PostC()
{

	var querystring = require('querystring');
	
	var post_data = querystring.stringify({ n: 12, c: 123, k: 1234 });

	var post_options = 
	{
		host: my_group[my_index+1],
		port: '3000',
		path: '/do_pass',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(post_data);
		}
	};

	var post_req = http.request(post_options, function(res){
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			console.log('Response: ' + chunk);
		});
	});

	post_req.write(post_data);
	post_req.end();

}

// handle PASS requests
app.post('/do_pass', function(req, res) {
    var the_body = req.body;	//see connect package above

    console.log("My Request Body");
    console.log( the_body );

        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();
	res.json({"id":"responce"});
	setTimeout(wait, 500);

});

// callback function - set myself to black
function wait()
{
	box.style.bg = 'black';	//black after pass
	screen.render();
	PostC();
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
