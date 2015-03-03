var http = require('http');
var express = require('express');
var connect = require("connect");
var blessed = require('blessed');
var bodyParser = require('body-parser');
var app = express();
var tokenRing = require('./TokenRingManager');

tokenRing.setRole(0);

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debug = true;

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
    width: '50%',
    height: '40%',
    top: '10%',
    left: '50%',
    align: 'left',
    tags: true
});

var log2 = blessed.scrollabletext({
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
    width: '50%',
    height: '50%',
    top: '50%',
    left: '50%',
    align: 'left',
    tags: true,
	hidden: false
});

var box = blessed.box({
    parent: screen,
    top: '0%',
    left: 'left',
    width: '100%',
    height: '10%',
    content: '{center}SUPERVISOR - SUPERVISOR - SUPERVISOR {/center}',
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

var response1 = "";
var inputBox1 = blessed.textbox({
	parent: screen,
	top: '80%',
	left: '0%',
	width: '50%',
	height: '15%',
	content: '',
	tags: false,
	hidden: true,
	censor: false,
	inputOnFocus: true,
	border: {
		type: 'line',
		fg: 'white'
	},  
	style: {
		fg: 'white',
		bg: 'blue',
		bold: true,
		border: {
			fg: 'blue',
			bold: true,
			underline: false
		}   
	},  
}); 
inputBox1.setLabel({
	text: 'Enter bay number: ',
	side: 'left'
});
inputBox1.on('submit', function() {
	response1 = inputBox1.value;
	debugLog("Response1 entered: " + response1);
	inputBox1.value = "";
	log.focus();
	inputBox1.hide();
	//screen.remove(inputBox);
	screen.render();
}); 
screen.append(inputBox1);


/********* BUTTON CODE *********/
var addtaskButton = blessed.box({
    parent: screen,
    top: '10%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}A = Add Task{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: true 
});
addtaskButton.on('click', function(data) {
    addtaskFunctionality();
});
screen.key(['a', 'A'], function(ch, key) {
    addtaskFunctionality();
});

var inresultButton = blessed.box({
    parent: screen,
    top: '20%',
    height: '10%',
    width: '50%',
    left: '0%',
    border: {
        type: 'line',
        fg: '#ffffff'
    },
    fg: '#ffffff',
    bg: '#228822',
    content: '{center}R = In Result{/center}',
    tags: true,
    hoverEffects: {
        bg: 'green'
    },
    hidden: true
});
inresultButton.on('click', function(data) {
    inresultFunctionality();
});
screen.key(['r', 'R'], function(ch, key) {
    inresultFunctionality();
});

screen.key(['escape', 'q', 'Q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.render();
/********* END BUTTON ***********/

var count = 0;

function addtaskFunctionality()
{
	addtaskButton.style.bg = "red";
	addtaskButton.style.fg = "white";
	addtaskButton.hidden = false;
	
	inresultButton.setContent("");
	inresultButton.style.bg = "black";
	inresultButton.style.fg = "black";
	inresultButton.hidden = true;

	inputBox1.hidden = false;
	inputBox1.focus();
	//debugLog("Enter degrees (pos or neg)");
	//log2.insertLine(0, "Enter bay number (1, 2, or 3).");
	var baynum = "";
	var _responseCheck1 = setInterval(function() {
		if (response1) {
			clearInterval(_responseCheck1);
			inputBox1.setContent("");
			baynum = response1;
			response1 = "";
			var post_data = { id : count, bayNumber : baynum };
			tokenRing.generalPOST(Bag_IP, '/do_insert_task', post_data);
			count++;
			defaultmenu();
		}
	}, 100);
	screen.render();


}

app.post('/do_return_result', function(req, res) {
	var the_body = req.body;
	if (the_body.isValid == true)
	{
		log2.insertLine(0, "In result: " + JSON.stringify(the_body));
	}
	else if (the_body.isValid == false)
	{
		log2.insertLine(0, "In result: not valid");
	}
});

function inresultFunctionality()
{
	addtaskButton.setContent("");
	addtaskButton.style.bg = "black";
	addtaskButton.style.fg = "black";
	addtaskButton.hidden = true;

	inresultButton.style.bg = "red";
	inresultButton.style.fg = "white";
	inresultButton.hidden = false;

	var post_data = { ip : tokenRing.getMyIP() };
	tokenRing.generalPOST(Bag_IP, '/do_get_result', post_data);

	screen.render();

	defaultmenu();
}

function debugLog( msg ) 
{
	log.insertLine(0, msg);
	screen.render();
	return;
}

var Bag_IP;

function getBagIP()
{
	var bag = [];
	bag = tokenRing.getRoleList(1);
	if (bag.length != 1)
	{
		if (debug) debugLog("Problem!! Bag does not exist yet or more than one bag exists.");
	}
	else
	{
		Bag_IP = bag[0];
		log2.insertLine(0, "Bag_IP is " + Bag_IP);
	}
}

function defaultmenu()
{
	addtaskButton.setContent("{center}A = Add Task{/center}");
	addtaskButton.style.bg = "green";
	addtaskButton.style.fg = "white";
	addtaskButton.hidden = false;

	inresultButton.setContent("{center}R = In Result{/center}");
	inresultButton.style.bg = "green";
	inresultButton.style.fg = "white";
	inresultButton.hidden = false;

	getBagIP();

	screen.render();
}

function printIPs()
{
    var list1 =  tokenRing.getRing();
    var list2 = tokenRing.getRoleList(0);
    if (debug) debugLog(list1 + " " + list2);

	defaultmenu();
}

// Render the screen.
screen.render();

app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	debugLog("Express server listening on port " + app.get('port'));
	setTimeout( printIPs , 1000 );
});
