/*
  NodeJS Token Ring Manager Module (TRMM)
*/

var os   = require('os');

var myIP;
var tokenRing = [];
var debug = false;
//find ip address
var ifaces = os.networkInterfaces();

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
  isMember : isMember,
  getRingSize : function() { return tokenRing.length ; },
  getRing : function() { return tokenRing; }
};


