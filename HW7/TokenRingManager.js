/*
  NodeJS Token Ring Manager Module (TRMM)
*/
var http = require('http');
var express = require('express');
var connect = require("connect");
var os   = require('os');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var keepAliveTimeout = 1000;
var tokeRingPort='2999';
var tokeRingPortNum=2999;
var myIP;
var tokenRing = [];
var debug = true;
//find ip address
var ifaces = os.networkInterfaces();

var node_functionality =0; //i dont think we evem need this. 
// Input 0
var HOST_IP;

//Input 1
var TRUCK_IP;

//Input 2
var GoPiGo_IP;

//Input 3
var Grove_Sensor_IP;

//Input 4
var Human_Sensor_IP;

//Input 5
var Human_Sensor2_IP;

app.post('/do_keepalive', function(req, res) {
  res.json(req.body);
  var the_body = req.body;  //see connect package above
});


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

        removeRingMember(genHost);

//      processApproval(genHost);

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
    port: tokeRingPort,
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





function PostDiscover(ip_address)
{
  var post_data = { ip : getMyIP(), role: node_functionality };    
        
  var dataString = JSON.stringify( post_data );

  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataString.length
  };

  var post_options = {
    host: ip_address,
    port: tokeRingPort,
    path: '/do_discover',
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
      var resultObject = JSON.parse(responseString);
      console.log(resultObject);
      addRingMember(resultObject.ip);

    var i = parseInt(resultObject.role);

    switch (i){
      case 0:
        HOST_IP = resultObject.ip;
        break;
      case 1:
        TRUCK_IP = resultObject.ip;
        break;
      case 2:
        GoPiGo_IP = resultObject.ip;
        break;
      case 3:
        Grove_Sensor_IP = resultObject.ip;
        break;
      case 4:
        Human_Sensor_IP = resultObject.ip;
        break;
      case 5:
        Human_Sensor2_IP = resultObject.ip;
        break;
      default:
        console.log( "Undefined role type" + resultObject.role );  
    }
    });
  });

  post_request.on('error', function(e) {
    // no one is home, do nothing
    //if(debug) debugLog('no one at this address: ' + e.message);
  });

  post_request.write(dataString);
  post_request.end();
}


function discover() 
{

  console.log("Starting Discovery");
  //limit the scanning range
  var start_ip = 100;
  var end_ip   = 120;
   
  //we are assuming a subnet mask of 255.255.255.0

  //break it up to extract what we need 
  var ip_add = getMyIP().split(".");

  //put it back together without the last part
  var base_add = ip_add[0] + "." + ip_add[1] + "." + + ip_add[2] + ".";
  console.log("Base ip address : " +  base_add);

  for(var i = start_ip; i < end_ip; i++)
  {      
    var ip = base_add + i.toString();

    if(!isMember(ip))
    {
      PostDiscover(ip);
    }
  }

  setTimeout( keepAlive, keepAliveTimeout);
}
/***********End Discovery***********************/


/* Function to check if other devices are there. */
function keepAlive()
{
  //debugLog("Calling keepalive " );
  var listIPs = tokenRing;
  for( var i = 0; i < listIPs.length; i++) 
  {
    var post_data = { myIP : i, role: node_functionality };
    if (listIPs[i] != getMyIP())
    {
      generalPOST ( listIPs[i], '/do_keepalive', post_data );
    }
  }
  
  setTimeout( keepAlive, keepAliveTimeout );
}





//scan NICs
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    myIP = iface.address;
  
  });
  
  tokenRing[0] = myIP;

});

function debugMessages(on)
{
  if (on.constructor === Boolean)
  {
    debug = on;
  }
  else
  {
    console.log("debugMessages(boolean) must be passed a boolean if you expect to set it.");
  }
}

function getMyIP()
{
  return myIP;
}

function getMyIPIndex()
{
  return tokenRing.indexOf(getMyIP());
}

function getNeighborIndex()
{
  return ( (getMyIPIndex() + 1) % tokenRing.length );
}

function getNeighborIP()
{
  return tokenRing[ getNeighborIndex() ];
}

function addRingMember(ip_address)
{
  if(tokenRing.indexOf(ip_address) == -1) 
  {
    tokenRing[tokenRing.length] = ip_address;
    if(debug) console.log("New node at " + ip_address);
    tokenRing.sort();
  }
  else
  {
    if(debug) console.log("Already discovered "+ ip_address);
  }

  if(debug) console.log("Current group : " + tokenRing);
}

/* general remove IP addresses for non-token ring case */
function removeRingMember(ip_address) 
{
  if(tokenRing.indexOf(ip_address) != -1) 
  {
	tokenRing.splice(tokenRing.indexOf(ip_address), 1);
    if(debug) console.log("Removing node at " + ip_address);
    tokenRing.sort();
  }
  else
  {
    if(debug) console.log("DNE: "+ ip_address);
  }

  if(true) console.log("Current group : " + tokenRing);
}

/* remove neighbor IP addresses in token ring */
function removeRingNeigbor()
{

  if( getMyIPIndex != getNeighborIndex() )
  {
    tokenRing.splice(getNeighborIndex(), 1);
  } 
  else
  {
    if(debug) console.log("Error. Impossible to remove yourself from the ring." );
  } 

  if(debug) console.log("Current group : " + tokenRing);
}

function getEveryoneElse()
{
	var every = [];
	for (var i = 0; i < tokenRing.length; i++)
	{
		if (i != getMyIPIndex())
			every.push(i);
	}
	return every;
}

function isMember(ip_address)
{
  if(tokenRing.indexOf(ip_address) == -1) return false;
  else return true;
}

app.post('/do_discover', function(req, res) {
  var the_body = req.body;  //see connect package above
  console.log( "Discovery received: " + JSON.stringify( the_body) );

  addRingMember(the_body.ip);

  var i = parseInt(the_body.role);

  console.log( "recieved role: " + i );

  switch (i){
    case 0:
      HOST_IP = the_body.ip;
      break;
    case 1:
      TRUCK_IP = the_body.ip;
      break;
    case 2:
      GoPiGo_IP = the_body.ip;
      break;
    case 3:
      Grove_Sensor_IP = the_body.ip;
      break;
    case 4:
      Human_Sensor_IP = the_body.ip;
      break;
    case 5:
      Human_Sensor2_IP = the_body.ip;
      break;
    default:
      console.log( "which not Special type" + the_body.role ); 
  }

  var post_data = { ip : getMyIP(), role: node_functionality };    

  res.json( post_data );
});


app.set('port', process.env.PORT || tokeRingPortNum);
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  discover();
  //debugLog( "Discovery Complete." );
  //debugLog("Waiting to print IPs...");
  //setTimeout( printIPs , 10000 );

});


module.exports = {
  debugMessages : debugMessages,
  getMyIP : getMyIP,
  getMyIPIndex : getMyIPIndex,
  getNeighborIP : getNeighborIP,
  addRingMember : addRingMember,
  removeRingNeigbor : removeRingNeigbor,
  removeRingMember : removeRingMember,
  isMember : isMember,
  getRingSize : function() { return tokenRing.length ; },
  getRing : function() { return tokenRing; },
  indexOf : function(IP) { return tokenRing.indexOf(IP); },
  getIPofIndex : function(index) { return tokenRing[index]; },
  getEveryoneElse : getEveryoneElse 
};


