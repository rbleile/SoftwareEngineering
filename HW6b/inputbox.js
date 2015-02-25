/*****
 * Begin inputBox code:
 */

//The value entered will go here.
var response = '';

function someFunction() {

	var inputBox = blessed.textbox({
		top: '80%',
		left: '10%',
		width: '80%',
		height: '20%',
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
			bold: true,
			border: {
				fg: 'blue',
				bold: true,
				underline: false
			}
		},
	});

	inputBox.setLabel({
		text: 'Enter a VALUE:',
		side: 'left'
	});

	inputBox.on('submit', function() {
		response = inputBox.value;
		debugLog("response entered: " + response);
		log.focus();
		inputBox.hide();
		screen.remove(inputBox);
		screen.render();
	});

	screen.append(inputBox);
	inputBox.focus();

} //end: someFunction
/*
 * ...end of inputBox code.
 **********/

function demoWaitingForReturnValue() {

	//  This is a demo of how to wait until some variable has a value.
	//  It does not stop Node.js from doing other work in the background.

	//NOTE: If you're going to open the text box multiple times, make sure
	//		to clear the response variable after you read it!

	var _responseCheck = setInterval(function() {
    	if (response) {
        	clearInterval(_responseCheck);

			//  THIS IS WHERE CODE GOES THAT NEEDS THE VARIABLE
			//  You could just call a function here rather than embedding
			//  a bunch of code.

			//permanentVar = response;
			//response = '';  // <-- uncomment if inputBox is reused.

    	}
    }, 100); // interval set at 100 milliseconds

} //end: someOtherFunction

