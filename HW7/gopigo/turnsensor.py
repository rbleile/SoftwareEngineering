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

def main():
	inpSensorDegrees = int(raw_input("\nDegrees (20-150): "))
	TurnSensor(inpSensorDegrees)

if __name__=="__main__":
	main()