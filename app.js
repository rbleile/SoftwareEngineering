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

var all_debug_txt = "";

function debug(txt) {
    all_debug_txt = all_debug_txt + txt;
    box.setContent(all_debug_txt);
    screen.render();
    return;
}

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
	var post_request = http.request(post_options, function() {});
	post_request.write(post_data);
        post_request.end();
        debug("sF():done ");
}

// handle PASS requests
app.post('/do_pass', function(req, res) {
	var the_body = req.body;	//see connect package above
	//console.log ( "token received: " + the_body );
        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();
	res.json({"body": the_body, "id": JSON.stringify(my_group[my_index])});

        //TODO: Move from the wait() function to the computePrimes() function...
        setTimeout(wait, 500);

        debug("do_pass:done ");
});

function isprime(num)
{
    var i = 0;
    if (num <= 1) {
	return false;
    }
    for (i = 2; i * i <= num; i = i + 2) {
	if (num % i == 0) {
	    return false;
	}
    }
    return true;
}

function computePrimes(n, k) {
    var rightnow = new Date();
    var start_time = rightnow.getTime();
    var proceed = true;
    var c = 3;
    var i = 3;
    
    while (proceed) {
	i++;
	if ((i % 2) == 0) continue;
	if isprime(i) c++;
	//-----
	var rightnow = new Date();
	if ((rightnow.getTime() - start_time) > k) proceed = false;
    }
    //Display the number of discovered primes:
    box.setContent("Primes below " + n + ": " + c );
    screen.render();

    //TODO: This data needs to get into the JSON object that is xmitted to next node.

    return;
}



// callback function - set myself to black
function wait()
{
	box.style.bg = 'black';	//black after pass
	screen.render();
        someFunction();
        debug("wait():done ");
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
