import sys, getopt, time
from gopigo import *

DistancePerPulse = 0.4361

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

def main(deg):
	TurnInPlace(deg)

if __name__=="__main__":
	main(int(arg1))