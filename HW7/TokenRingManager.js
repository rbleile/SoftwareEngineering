/*
  NodeJS Token Ring Manager Module (TRMM)
*/

var os   = require('os');

var myIP;
var tokenRing = [];
var debug = false;
//find ip address
var ifaces = os.networkInterfaces();


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

  if(debug) console.log("Current group : " + tokenRing);
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


