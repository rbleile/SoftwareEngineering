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

var my_group = ["192.168.1.100", "192.168.1.101", "192.168.1.102"];	// replace with real IPs of group

var my_index = 1;	// replace with index of my IP in my_group

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

function someFunction()
{
	var post_data = ' ';		
	var post_options = {
		host: my_group[(my_index+1) % my_group.length],
		port: '3000',
		path: '/do_pass',
		method: 'POST',
		headers: {} //{"Content-Type" , "application/json;charset=UTF-8" }
	};
    console.log("9");
	var post_request = http.request(post_options, function() {});
    console.log("10");
	post_request.write(post_data);
    console.log("11");
	post_request.end();
    console.log("done w/somefunction");
}

// handle PASS requests
app.post('/do_pass', function(req, res) {
	var the_body = req.body;	//see connect package above
	//console.log ( "token received: " + the_body );
    console.log("1");
        box.setContent("Post with body: " + the_body);
    console.log("2");
	box.style.bg = 'red';	//red for pass
    console.log("3");
	screen.render();
    console.log("4");
	res.json({"body": the_body, "id": JSON.stringify(my_group[my_index])});
    console.log("5");
	setTimeout(wait, 500);
    console.log("done w/do_pass");
});

// callback function - set myself to black
function wait()
{
    console.log("6");
	box.style.bg = 'black';	//black after pass
    console.log("7");
	screen.render();
    console.log("8");
	someFunction();
    console.log("done w/wait");
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
