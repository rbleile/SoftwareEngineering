import sys, getopt, time
from gopigo import *

DistancePerPulse = 0.4361

# direction is true if forward, false if backward
# distance is in inches
# speed is fixed range 0..10
def Move(direction, distance, speed):
	#print("\nIn Move() function")

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

def main(dir, dist, speed):
	Move(dir, dist, speed)

if __name__=="__main__":
	main(int(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3]))
