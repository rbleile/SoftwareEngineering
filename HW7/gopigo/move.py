#------ GoPiGo Wheels ------#
#Diameter: 2.5in
#Radius: 1.25in
#Circumference: (2)(pi)(r) = (2)(pi)(1.25in) = 2.5(3.14) = 7.85 
#Encoder Pulse:	18 times per revolution
#Distance Moved per Pulse: circumference/18 = (2.5(pi))/(18) = 0.1389(pi) = 0.4361 in

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

def main():
	inpDirection = int(raw_input("\nDirection (1 for fwd, 0 for bwd): "))
	inpDistance = float(raw_input("Distance (in inches): "))
	inpSpeed = int(raw_input("Speed (0-10): "))
	Move(inpDirection, inpDistance, inpSpeed)

if __name__=="__main__":
	main()
