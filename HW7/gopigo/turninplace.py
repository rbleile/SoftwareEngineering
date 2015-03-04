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

def main():
	inpRobotDegrees = int(raw_input("\nDegrees (positive number for left, negative number for right): "))
	TurnInPlace(inpRobotDegrees)

if __name__=="__main__":
	main()