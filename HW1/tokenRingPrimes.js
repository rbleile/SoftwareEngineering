var os = require('os');
var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser());

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

var my_group = ["192.168.0.101", "192.168.0.102", "192.168.0.103", "192.168.0.101"];	// replace with real IPs of group

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

var all_debug_txt = "";

function debug(txt) {
    all_debug_txt = all_debug_txt + txt;
    box.setContent(all_debug_txt);
    screen.render();
    return;
}

function PostPrimeToken( num, count, time )
{
	var post_data = { n: num, c: count, k: time };		
        
	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: my_group[ my_index+1 ],
		port: '3000',
		path: '/do_pass',
		method: 'POST',
		headers: headers
	};

	var post_request = http.request(post_options, function(res){
		res.setEncoding('utf-8');
		
		var responceString = '';

        res.on('data', function(data){
			responceString += data;
		});
		
        res.on('end', function(){
			var resultObject = JSON.parse(responceString);
		});

	});

	post_request.write(dataString);
        post_request.end();
       // debug("sF():done ");
}

// handle PASS requests
app.post('/do_pass', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "token received: " + JSON.stringify( the_body) );

        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();

	//res.json({"body": the_body, "id": JSON.stringify(my_group[my_index])});
	res.json(the_body);

        var bData = the_body;

    computePrimes(bData.n, bData.c, bData.k);


        //debug("do_pass:done ");
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

function computePrimes(n, c, k) {
    var rightnow = new Date();
    var start_time = rightnow.getTime();
    var proceed = true;
    
    while (proceed) {
	n++;
	if ((n % 2) == 0) continue;
	if ( isprime(n) ) c++;
	//-----
	var rightnow = new Date();
	if ((rightnow.getTime() - start_time) > k) proceed = false;
    }

    //Display the number of discovered primes:


    //TODO: This data needs to get into the JSON object that is xmitted to next node.

    PostPrimeToken(n, c, k);

    return;
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
