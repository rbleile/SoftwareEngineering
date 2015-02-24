def Move(direction, distance, speed):

def TurnInPlace(degrees):
	# see Dexter Industries GoPiGo Github, compass examples
	if (degrees > 0):
		left_rot()
	elif (degrees < 0):
		right_rot()

def TurnSensor(degrees):
	if (degrees > 180):
		print("ERROR")

def ReadSensor():
	dist = us_dist(pin)
