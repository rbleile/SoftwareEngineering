
//Principle components of the simulation:

var parkingNorth = { locked: false, color: '', ref: document.getElementById('parkingNorth') };
var parkingSouth = { locked: false, color: '', ref: document.getElementById('parkingSouth') };
var bay1Stall = { locked: false, color: '', ref: document.getElementById('bay1Stall') };
var bay2Stall = { locked: false, color: '', ref: document.getElementById('bay2Stall') };
var bay3Stall = { locked: false, color: '', ref: document.getElementById('bay3Stall') };
var bay1Sensor = { locked: false, color: '', ref: document.getElementById('bay1Sensor') };
var bay2Sensor = { locked: false, color: '', ref: document.getElementById('bay2Sensor') };
var bay3Sensor = { locked: false, color: '', ref: document.getElementById('bay3Sensor') };

var baySensors = [];
var bayStalls = [];

baySensors[0] = bay1Sensor;
baySensors[1] = bay2Sensor;
baySensors[2] = bay3Sensor;

bayStalls[0] = bay1Stall;
bayStalls[1] = bay2Stall;
bayStalls[2] = bay3Stall;

var bay1Corridor = { locked: false, color: '', ref: document.getElementById('bay1Corridor') };
var bay2Corridor = { locked: false, color: '', ref: document.getElementById('bay2Corridor') };
var bay3Corridor = { locked: false, color: '', ref: document.getElementById('bay3Corridor') };


var positions = [];
positions[0] = 0;          
positions[1] = 0;		   

positions[2] = bay1Stall;
positions[3] = bay2Stall;
positions[4] = bay3Stall;

positions[5] = bay1Corridor;
positions[6] = bay2Corridor;
positions[7] = bay3Corridor;

positions[8] = parkingNorth;
positions[9] = parkingSouth;





var items = [	parkingNorth,
				parkingSouth,
				bay1Stall,
				bay2Stall,
				bay3Stall,
				bay1Corridor,
				bay2Corridor,
				bay3Corridor
			];



function resetElements() {
	console.log("Clearing");
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

function refreshVariables() {
    //resetElements();
	/*var global_state = {
		"bayState" : bays,
		"requestedLocks" : request_array,
		"actualLocks" : working_array,
		"locations" : truckLocations
	};*/

	var xmlhttp = new XMLHttpRequest();
	var url = "state.json";

	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	        var state = JSON.parse(xmlhttp.responseText);
	        console.log(state);

	  //       bay1Sensor.locked = true;
			// bay2Sensor.locked = true;
			// bay3Sensor.locked = true;

			for(var i = 0; i < 3; i++)
			{
				if(state.bayState[i])
				{
					
					baySensors[i].ref.style.backgroundImage = "url('img/lightRed.png')";
					bayStalls[i].ref.style.backgroundImage = "url('img/fire.gif')";
					bayStalls[i].ref.querySelector('.signOpen').style.display = 'none';
					bayStalls[i].ref.querySelector('.signClosed').style.display = 'block';
					if(i == (state.blueLoc -2)) document.getElementById('audiotag1').play();
					if(i == (state.redLoc  -2)) document.getElementById('audiotag1').play();
				}
				else
				{
					baySensors[i].ref.style.backgroundImage = "url('img/lightGreen.png')";
					bayStalls[i].ref.style.backgroundImage = "url('img/warehouse.png')";
					bayStalls[i].ref.querySelector('.signOpen').style.display = 'block';
					bayStalls[i].ref.querySelector('.signClosed').style.display = 'none';
				}
			}
			
			 

			bay1Sensor.ref.querySelector('.taskCount').innerHTML = ''+ state.bayTaskCount[0];
			bay2Sensor.ref.querySelector('.taskCount').innerHTML = ''+ state.bayTaskCount[1];
			bay3Sensor.ref.querySelector('.taskCount').innerHTML = ''+ state.bayTaskCount[2];

			//positions[state.blueLoc].ref.querySelector('.truckBlue').style.display = 'block';
			//positions[state.redLoc].ref.querySelector('.truckRed').style.display = 'block';
			for(var i = 2; i < 10; i++)
			{
				if(i == state.blueLoc) positions[i].ref.querySelector('.truckBlue').style.display = 'block';
				else if(i == state.redLoc ) positions[i].ref.querySelector('.truckRed').style.display = 'block';
				else
				{
					positions[i].ref.querySelector('.truckBlue').style.display = 'none';
					positions[i].ref.querySelector('.truckRed').style.display = 'none';	
				} 

			}

			for(var i = 2; i < 8; i++)
			{
				if(state.locks[i]=='red') 
				{
					positions[i].ref.querySelector('.lockRed').style.display = 'block';
					positions[i].ref.querySelector('.lockBlue').style.display = 'none';
				}
				else if(state.locks[i]=='blue') 
				{
					positions[i].ref.querySelector('.lockBlue').style.display = 'block';
					positions[i].ref.querySelector('.lockRed').style.display = 'none';
				}
				else 
				{
					positions[i].ref.querySelector('.lockBlue').style.display = 'none';
					positions[i].ref.querySelector('.lockRed').style.display = 'none';
				}
			}

			for(var i = 2; i < 8; i++)
			{
				if(state.requestedLocks[i][0]=='red' || state.requestedLocks[i][1]=='red') positions[i].ref.querySelector('.lockReservedRed').style.display = 'block';
				else if(state.requestedLocks[i][0]=='blue' || state.requestedLocks[i][1]=='blue') positions[i].ref.querySelector('.lockReservedBlue').style.display = 'block';
				else 
				{
					positions[i].ref.querySelector('.lockReservedRed').style.display = 'none';
					positions[i].ref.querySelector('.lockReservedBlue').style.display = 'none';
				}

				//if(state.requestedLocks[i][1]=='red') positions[i].ref.querySelector('.lockReservedRed').style.display = 'block';
				//if(state.requestedLocks[i][1]=='blue') positions[i].ref.querySelector('.lockReservedBlue').style.display = 'block';
			}


			if()
			//document.getElementById('audiotag1').play();
	    }
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();

	setTimeout(refreshVariables, 500);
	return;
}


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
		parkingSouth.ref.querySelector('.truckBlue').style.display = 'block';
		parkingNorth.ref.querySelector('.truckRed').style.display = 'block';
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


resetElements();
//updateDisplay();


setTimeout(refreshVariables, 500);
refreshVariables();

//Done.
