#------ GoPiGo Wheels ------#
#Diameter: 2.5in
#Radius: 1.25in
#Circumference: (2)(pi)(r) = (2)(pi)(1.25in) = 2.5(3.14) = 7.85 
#Encoder Pulse:	18 times per revolution
#Distance Moved per Pulse: circumference/18 = (2.5(pi))/(18) = 0.1389(pi) = 0.4361 in

import sys, getopt, time
from gopigo import *

DistancePerPulse = 0.4361

# direction is true if forward, false if backward
# distance is in inches
# speed is fixed range 0..10
def Move(direction, distance, speed):
	print("\nIn Move() function")

	#enable_encoders()

	#convert distance to no. of pulses
	numPulses = int((1/DistancePerPulse)*distance)
	print("\nnumPulses: " + str(numPulses))

	#set speed of both motors (default speed is 200, range is 0 to 255)
	targetSpeed = int((speed/10.0)*255)
	print( "Target Speed : " + str( targetSpeed ) )
	set_speed(targetSpeed)

	if (direction == True):
		print enc_tgt(1,1,numPulses)
		fwd()
	else:
		print enc_tgt(1,1,numPulses)
		bwd()



# +degrees turn left, -degrees turn right
def TurnInPlace(degrees):
	#enable_encoders()

	numPulses = int( 32.5*(abs(degrees)/360.0))
	print("\nnumPulses: " + str(numPulses))

	if (degrees > 0):
		enc_tgt(1,1,numPulses)
		left_rot()
	elif (degrees < 0):
		enc_tgt(1,1,numPulses)
		right_rot()



# +degrees turn left, -degrees turn right
# Cannot turn beyond 180 degree freedom of action
def TurnSensor(degrees):
	if (degrees > 150 ):
		print("ERROR")
	elif (degrees > 20 and degrees <= 150):
		enable_servo()
		servo(degrees)
		time.sleep(0.5)
		disable_servo()

# Return value of the range-finder sensor
def ReadSensor():
	return us_dist(15)

def main():
	#enable_encoders()
	ans = True
	while ans:
		print("""
----- MENU -----
1. Move GoPiGo
2. Turn GoPiGo In Place
3. Turn Sensor
4. Read Sensor
5. GoPiGo Stop
6. End
		""")
		ans = raw_input("Selection (1-6): ")
		if ans == "1":
			inpDirection = int(raw_input("\nDirection (1 for fwd, 0 for bwd): "))
			inpDistance = float(raw_input("Distance (in inches): "))
			inpSpeed = int(raw_input("Speed (0-10): "))
			Move(inpDirection, inpDistance, inpSpeed)
		elif ans == "2":
			inpRobotDegrees = int(raw_input("\nDegrees (positive number for left, negative number for right): "))
			TurnInPlace(inpRobotDegrees)
		elif ans == "3":
			inpSensorDegrees = int(raw_input("\nDegrees (20-150): "))
			TurnSensor(inpSensorDegrees)
		elif ans == "4":
			print("Distance from Object (in cm): " + str(ReadSensor()))
		elif ans == "5":
			stop()
		elif ans == "6":
			print("\nGoodbye!")
			ans = False
		elif ans != "":
			print("Invalid choice. Try again.")
	
if __name__=="__main__":
	main()
