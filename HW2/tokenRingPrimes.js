var os = require('os');
var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;

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

var my_group = [];	// replace with real IPs of group

var my_index = 0;	// replace with index of my IP in my_group


/****************Discovery***********************/
var my_ip;

//find ip address
var os = require('os');
var ifaces = os.networkInterfaces();

//scan NICs
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0
    ;
    ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    my_ip = iface.address;
  });
  my_group[0] = my_ip;
});

function addIp(ip_address)
{
  if(my_group.indexOf(ip_address) == -1) 
  {
    my_group[my_group.length] = ip_address;
    if(debug) console.log("New node at " + ip_address);
    my_group.sort();
  }
  else
  {
    if(debug) console.log("Already discovered "+ ip_address);
  }

  if(debug) console.log("Current group : " + my_group);
}

//curl -H "Content-Type: application/json" -d '{"ip" : "192.168.1.101"}' http://localhost:3000/do_discover
// handle discovery requests
app.post('/do_discover', function(req, res) {
  var the_body = req.body;  //see connect package above
  if(debug) console.log ( "discovery received: " + JSON.stringify( the_body) );

  addIp(the_body.ip);

  res.json({"ip": my_ip, "body" : the_body});
});

function PostDiscover(ip_address)
{
  var post_data = { ip : my_ip };    
        
  var dataString = JSON.stringify( post_data );

  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataString.length
  };

  var post_options = {
    host: ip_address,
    port: '3000',
    path: '/do_discover',
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
      console.log(resultObject);
      addIp(resultObject.ip);
    });

  });

  post_request.on('error', function(e) {
    // no one is home, do nothing
    //if(debug) console.log('no one at this address: ' + e.message);
  });
  post_request.write(dataString);
  post_request.end();
}

function discover()
{
   if(debug) console.log("Starting Discovery");
   var start_ip = 100;
   var end_ip   = 120;
   
   //we are assuming a subnet mask of 255.255.255.0

   //break it up to extract what we need 
   var ip_add = my_ip.split(".");
   //put it back together without the last part
   var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
   if(debug) console.log("Base ip address : " +  base_add);

   for(var i = start_ip; i < end_ip; i++)
   {
      
      var ip = base_add + i.toString();
      //if(debug) console.log("i " + i + " ip " + ip + " " + my_group.indexOf(ip));
      if(my_group.indexOf(ip) == -1)
      {
        //if(debug) console.log("trying ip " + ip);
        PostDiscover(ip);
      }
   }
}

var myComputeID;

var myLeader;

function Delay( handicap ){

	var computeSize = 10000;

	var currentTime = new Date();

	var start = currentTime.getTime();

	var value = 0.0;

	for( var i = 0; i < computeSize; i++ )
	{
		value += value + Math.sqrt( i*i(i+100/i*2) );
	}

	var currentTime2 = new Date();

	var end = currentTime2.getTime();

	var time = end - start;

	return time + handicap;
	
}

function electionPOST( )
{
    var post_data = { computeID : myLeader };		
        
	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: my_group[ ( my_group.indexOf( my_ip ) + 1 ) % my_group.length ],
		port: '3000',
		path: '/do_election',
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
}

function winnerPOST( winningID )
{
    var post_data = { listID : winningID };
        
	var dataString = JSON.stringify( post_data );

	var headers = {
		'Content-Type': 'application/json',
		'Content-Length': dataString.length
	};

	var post_options = {
		host: my_group[ ( my_group.indexOf( my_ip ) + 1 ) % my_group.length ],
		port: '3000',
		path: '/do_winner',
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
}

function startElection()
{

console.log( "This is timeout Callback: " + my_group );

console.log( "My ID: " + my_group.indexOf( my_ip ) );

myComputeID = Delay( Integer.parseInt( process.argv[2] ) );
myLeader = myComputeID;

setTimeout( electionPOST, 5000 );

}

/***********End Discovery***********************/


box.setContent('this node (' + my_ip + ') will attempt to send its token to other nodes on network. ');
screen.render();

// handle GET requests
app.get('/do_get', function (req, res){
	var the_body = req.query;
	console.log ( "get body: " + the_body );
	box.setContent("Get with query: " + the_body);
	box.style.bg = 'green';	//green for get
	screen.render();
	res.json({"query": the_body, "id": my_ip});
});

// handle POST requests
app.post('/do_post', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "post body: " + the_body );
	box.setContent("Post with body: " + the_body);
	box.style.bg = 'blue';	//blue for post
	screen.render();
	res.json({"body": the_body, "id": my_ip});
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

	box.style.bg = 'black';	//black for pass
	screen.render();
}

//Election Passing
app.post('/do_election', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "token received: " + JSON.stringify( the_body) );

	res.json(the_body);

	var ID = the_body.computeID;
	
	if( ID == myLeader )
	{
	     /* Pass win Message */
		 winnerPOST( my_group.indexOf( my_ip ) );
	}
	else if( ID < myLeader )
	{
	    /* Do Pass this Compute ID */
		myLeader = ID;
		electionPOST();
	}
	
	/* Else don't pass along ( drop out of election ) */

});

app.post('/do_winner', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "token received: " + JSON.stringify( the_body) );

	res.json(the_body);

	var ID = the_body.listID;

    if( ID != my_group.indexOf( my_ip ) )
	{
	    winnerPOST( ID );
	}	

});

// handle PASS requests
app.post('/do_pass', function(req, res) {
	var the_body = req.body;	//see connect package above
	console.log ( "token received: " + JSON.stringify( the_body) );

        box.setContent("Post with body: " + the_body);
	box.style.bg = 'red';	//red for pass
	screen.render();

	//res.json({"body": the_body, "id": my_ip});
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
    box.setContent("Primes below " + n + ": " + c + "\nIn " + k*1000 + "seconds");
    screen.render();

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
  discover();
  setTimeout( startElection, 10000  );
});



