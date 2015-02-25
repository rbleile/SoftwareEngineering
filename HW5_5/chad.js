var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');
var whiteList = require('./TokenRingManager');

var sha1 = require('./SHA1Encryption');

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;
tokenRing.debugMessages(false);

var myArgs = process.argv.slice(2);

if( !myArgs[0] ) myArgs[0] = -1;

var node_functionality = myArgs[0];

var PICA_IP;

// Create a screen object.
var screen = blessed.screen();

var log = blessed.scrollabletext({
    parent: screen,
    mouse: true,
    keys: true,
    vi: true,
    border: {
	type: 'line',
	fg: '#00ff00'
    },
    scrollbar: {
	fg: 'blue',
	ch: '|'
    },
    width: '100%',
    height: '60%',
    top: '20%',
    left: 'left',
    align: 'left',
    tags: true
});
        
var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '20%',
    content: '',
    tags: true,
    border: {
		type: 'line',
		fg: 'white'
    },
    style: {
		fg: 'white',
		bg: 'black',
		border: {
	    	fg: '#f0f0f0'
		}
    }
});

/********* BUTTON CODE *********/
var reqResourceButton = blessed.box({
    parent: screen,
    top: '80%',
    height: '20%',
    width: '50%',
    left: '0%',
    border: {
	type: 'line',
	fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}Z = Request Resource{/center}',
    tags: true,
    hoverEffects: {
		bg: 'green'
    },
	hidden: true
});

reqResourceButton.on('click', function(data) {
	if (STATE == GAP_STATE)
		reqResource();
	else if (STATE == WORK_STATE)
		if(debug) debugLog( "Pending CS Return" );
		//releaseShotgun();
});

screen.key(['z', 'Z'], function(ch, key) {
	if (STATE == GAP_STATE)
		reqResource();
	else if (STATE == WORK_STATE)
		if(debug) debugLog( "Pending CS Return" );
		//releaseShotgun();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

reqResourceButton.focus();

/*****
 * Begin password code:
 */
var password = ''; //<--- Loop and wait for this to be non-zero.
var password_hash = '';

var passwordBox = blessed.textbox({
	top: '40%',
	left: '30%',
	width: '40%',
	height: '30%',
	//content: '',
	tags: false,
	censor: true,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},
	style: {
		fg: 'white',
		bg: 'blue',
		border: {
			fg: 'white'
		}
	},
});

passwordBox.setLabel({
	text: 'Enter a PASSWORD:',
	side: 'left'
});

passwordBox.on('submit', function() {
	password = passwordBox.value;
	password_hash = sha1.hash(password);

	debugLog("Password entered: " + password);
	debugLog("Password encrypt: " + password_hash);

	//passwordBox.hide();
	//screen.remove(passwordBox);
	//screen.render();
});

screen.append(passwordBox);
passwordBox.focus();
/*
 * ...end of password code.
 **********/

screen.render();
/********* END BUTTON ***********/