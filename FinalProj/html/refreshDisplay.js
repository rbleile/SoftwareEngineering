
//Principle components of the simulation:

var parkingNorth = { locked: false, color: '', ref: document.getElementById('parkingNorth') };
var parkingSouth = { locked: false, color: '', ref: document.getElementById('parkingSouth') };
var bay1Stall = { locked: false, color: '', ref: document.getElementById('bay1Stall') };
var bay2Stall = { locked: false, color: '', ref: document.getElementById('bay2Stall') };
var bay3Stall = { locked: false, color: '', ref: document.getElementById('bay3Stall') };
var bay1Sensor = { locked: false, color: '', ref: document.getElementById('bay1Sensor') };
var bay2Sensor = { locked: false, color: '', ref: document.getElementById('bay2Sensor') };
var bay3Sensor = { locked: false, color: '', ref: document.getElementById('bay3Sensor') };
var bay1Corridor = { locked: false, color: '', ref: document.getElementById('bay1Corridor') };
var bay2Corridor = { locked: false, color: '', ref: document.getElementById('bay2Corridor') };
var bay3Corridor = { locked: false, color: '', ref: document.getElementById('bay3Corridor') };

var items = [	parkingNorth,
				parkingSouth,
				bay1Stall,
				bay2Stall,
				bay3Stall,
				bay1Corridor,
				bay2Corridor,
				bay3Corridor
			];

function refreshVariables() {

	/*var global_state = {
		"bayState" : bays,
		"requestedLocks" : request_array,
		"actualLocks" : working_array,
		"locations" : truckLocations
	};*/

	var xmlhttp = new XMLHttpRequest();
	var url = "http://localhost:3000/do_get_state";

	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	        var state = JSON.parse(xmlhttp.responseText);
	        console.log(state);
	    }
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();

	return;
}

function resetElements() {

	for (var i = 0; i < items.length; i++) {
		items[i].ref.querySelector('.lockBlue').style.display = 'none';
		items[i].ref.querySelector('.lockRed').style.display = 'none';
		items[i].ref.querySelector('.lockReservedBlue').style.display = 'none';
		items[i].ref.querySelector('.lockReservedRed').style.display = 'none';
		items[i].ref.querySelector('.truckBlue').style.display = 'none';
		items[i].ref.querySelector('.truckRed').style.display = 'none';
	}

	bay1Sensor.ref.style.backgroundImage = "url('img/lightGreen.png')";
	bay1Stall.ref.style.backgroundImage = "url('img/warehouse.png')";
	bay1Stall.ref.querySelector('.signOpen').style.display = 'block';
	bay1Stall.ref.querySelector('.signClosed').style.display = 'none';

	bay2Sensor.ref.style.backgroundImage = "url('img/lightGreen.png')";
	bay2Stall.ref.style.backgroundImage = "url('img/warehouse.png')";
	bay2Stall.ref.querySelector('.signOpen').style.display = 'block';
	bay2Stall.ref.querySelector('.signClosed').style.display = 'none';

	bay3Sensor.ref.style.backgroundImage = "url('img/lightGreen.png')";
	bay3Stall.ref.style.backgroundImage = "url('img/warehouse.png')";
	bay3Stall.ref.querySelector('.signOpen').style.display = 'block';
	bay3Stall.ref.querySelector('.signClosed').style.display = 'none';

	return;
};

function updateDisplay() {
	console.log('[' + Date.now() + '] refreshDisplay() called.');

	demo = true;

	/* Demo code: */
	if (demo) {
		//light bay 2 on fire:
		bay2Sensor.ref.style.backgroundImage = "url('img/lightRed.png')";
		bay2Stall.ref.style.backgroundImage = "url('img/fire.gif')";
		bay2Stall.ref.querySelector('.signOpen').style.display = 'none';
		bay2Stall.ref.querySelector('.signClosed').style.display = 'block';
		//show the trucks:
		bay1Stall.ref.querySelector('.truckBlue').style.display = 'block';
		bay2Corridor.ref.querySelector('.truckRed').style.display = 'block';
		//put some tasks in the bays:
		bay1Sensor.ref.querySelector('.taskCount').innerHTML = '5';
		bay2Sensor.ref.querySelector('.taskCount').innerHTML = '2';
		bay3Sensor.ref.querySelector('.taskCount').innerHTML = '7';
		//give red a locked path:
		//bay1Corridor.ref.querySelector('.lockRed').style.display = 'block';
		bay2Corridor.ref.querySelector('.lockRed').style.display = 'block';
		bay3Corridor.ref.querySelector('.lockRed').style.display = 'block';
		bay3Stall.ref.querySelector('.lockRed').style.display = 'block';
		//give blue a locked & waiting path:
		bay1Stall.ref.querySelector('.lockBlue').style.display = 'block';
		bay1Corridor.ref.querySelector('.lockBlue').style.display = 'block';
		bay2Corridor.ref.querySelector('.lockReservedBlue').style.display = 'block';
		bay3Corridor.ref.querySelector('.lockReservedBlue').style.display = 'block';
		parkingSouth.ref.querySelector('.lockBlue').style.display = 'block';
	} else {
		//lock the start positions
		parkingNorth.ref.querySelector('.lockBlue').style.display = 'block';
		parkingSouth.ref.querySelector('.lockRed').style.display = 'block';
		//put trucks in start positions
		parkingNorth.ref.querySelector('.truckBlue').style.display = 'block';
		parkingSouth.ref.querySelector('.truckRed').style.display = 'block';
	} //end: demo

	for (var i = 0; i < items.length; i++) {
		if (items[i].locked) {
			if (items[i].color == 'blue') {
				items[i].ref.querySelector('.lockBlue').style.display = 'block';
			} else {
				items[i].ref.querySelector('.lockRed').style.display = 'block';
			}
		}
	}


	console.log('[' + Date.now() + '] refreshDisplay() completed.');

	$(window).trigger('resize');

	return;
};

//This is where code execution begins  (This needs to be in a timer-based loop):

refreshVariables();
resetElements();
updateDisplay();

//Done.
