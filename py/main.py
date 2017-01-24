# Joshua Kulas
# Data to process sleep data


from data_loader import check_load_Yvonne_dataset
import numpy as np


def downsample_data(X, Y, factor, patientID):
    out_x = []
    out_y = []
    grouped_x = [0,0,0,0,0,0]
    for i in range(len(X)):
        # if np.isnan(Y[i]):
        #     if np.isnan(Y[i]) != np.isnan(prev_value):
        #         print('new: ' + str(Y[i]))
        #         print('old: ' + str(prev_value))
        #         print('time: ' + str(i))
        #         print('difference: ' + str(difference/200))
        #         print('-----------')
        #         prev_value = Y[i]
        #         difference = 0
        #     else:
        #         difference += 1
        # else:
        #     if Y[i] != prev_value:
        #         print('new: ' + str(Y[i]))
        #         print('old: ' + str(prev_value))
        #         print('time: ' + str(i))
        #         print('difference: ' + str(difference/200))
        #         print('---------------')
        #         prev_value = Y[i]
        #         difference = 0
        #     else:
        #         difference += 1
        if i % 200 == 199:
            out_x.append([grouped_x[x] / factor for x in range(len(X[i]))])
            grouped_x = [0, 0, 0, 0, 0, 0]
        for j in range(len(X[i])):
            grouped_x[j] += X[i][j]
        if i % 6000 == 0:
            out_y.append(Y[i])
    np.savetxt(data_path + str(patientID) + '_' + str(factor) + '_EEG.csv', out_x, delimiter= ',', fmt='%.3f')
    np.savetxt(data_path + str(patientID) + '_' + str(factor) + '_sleepStates.csv', out_y, delimiter= ',')
data_path = '../data/'


EEG_file_path = '../data/YvonneDataSet_Exported_1.mat'
label_file = '../data/YvonneDataSet_Labels_1.mat'


EEG_channels = ['F3M2','F4M1','C3M2','C4M1','O1M2','O2M1']
EEG, sleep_stage, other_info = check_load_Yvonne_dataset(EEG_file_path, label_file, channels=EEG_channels)


# print(other_info)


downsample_data(EEG, sleep_stage, 200, 1)
# function to downsample input and labels by a certain factor


