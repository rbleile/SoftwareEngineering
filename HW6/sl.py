#------ GoPiGo Wheels ------#
#Diameter: 2.5in
#Radius: 1.25in
#Circumference: (2)(pi)(r) = (2)(pi)(1.25in) = 2.5(3.14) = 7.85 
#Encoder Pulse:	18 times per revolution
#Distance Moved per Pulse: circumference/18 = (2.5(pi))/(18) = 0.1389(pi) = 0.4361 in

import sys, getopt
from gopigo import *

DistancePerPulse = 0.4361

# direction is true if forward, false if backward
# distance is in inches
# speed is fixed range 0..10
def Move(direction, distance, speed):
	enable_encoders()

	#convert distance to no. of pulses
	numPulses = (1/DistancePerPulse)*distance

	#set speed of both motors (default speed is 200, range is 0 to 255)
	set_speed(speed)

	if (direction == True):
		enc_tgt(1,1,numPulses)
		fwd()
	elif (direction == False):
		enc_tgt(1,1,numPulses)
		bwd()

	disable_encoders()


# +degrees turn left, -degrees turn right
def TurnInPlace(degrees):
	enable_encoders()

	numPulses = DistancePerPulse*(abs(degrees)/360)

	if (degrees > 0):
		enc_tgt(1,1,numPulses)
		left_rot()
	elif (degrees < 0):
		enc_tgt(1,1,numPulses)
		right_rot()

	disable_encoders()


# +degrees turn left, -degrees turn right
# Cannot turn beyond 180 degree freedom of action
def TurnSensor(degrees):
	if (degrees > 180):
		print("ERROR")
	elif (degrees > 0 and degrees <= 180):
		enable_servo()
		servo(degrees)
		disable_servo()

# Return value of the range-finder sensor
def ReadSensor():
	return us_dist(15)

def main():
	ans = True
	while ans:
		print("""
----- MENU -----
1. Move GoPiGo
2. Turn GoPiGo In Place
3. Turn Sensor
4. Read Sensor
5. End
		""")
		ans = raw_input("Selection (1-5): ")
		if ans == "1":
			inpDirection = raw_input("\nDirection (True for fwd, False for bwd): ")
			inpDistance = raw_input("Distance: ")
			inpSpeed = raw_input("Speed (0-10): ")
			Move(inpDirection, inpDistance, inpSpeed)
		elif ans == "2":
			inpRobotDegrees = raw_input("\nDegrees (+ for left, - for right): ")
			TurnInPlace(inpRobotDegrees)
		elif ans == "3":
			inpSensorDegrees = raw_input("\nDegrees (0-180): ")
			TurnSensor(inpSensorDegrees)
		elif ans == "4":
			outpSensor = ReadSensor()
		elif ans == "5":
			print("\nGoodbye!")
			ans = False
		elif ans != "":
			print("Invalid choice. Try again.")
	
if __name__=="__main__":
	main()
