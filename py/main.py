import downsample
import mismatch_calculation
import sys
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Please enter a patient ID. ex: 1')
    else:
        patientID = sys.argv[1]
        downsample.run_all('../data/patient' + patientID + '/', patientID)
        mismatch_calculation.run_all('../data/patient' + patientID + '/', patientID)
