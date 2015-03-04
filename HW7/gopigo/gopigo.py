#------ GoPiGo Wheels ------#
#Diameter: 2.5in
#Radius: 1.25in
#Circumference: (2)(pi)(r) = (2)(pi)(1.25in) = 2.5(3.14) = 7.85 
#Encoder Pulse:	18 times per revolution
#Distance Moved per Pulse: circumference/18 = (2.5(pi))/(18) = 0.1389(pi) = 0.4361 in

import sys, getopt, time
from gopigo import *

DistancePerPulse = 0.4361

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
			os.system("move.py 1 10 6")
		elif ans == "2":	
			os.system("turninplace.py")
		elif ans == "3":
			os.system("turnsensor.py")
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
