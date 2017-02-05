# Joshua Kulas
# Data to process sleep data


from data_loader import check_load_Yvonne_dataset
import numpy as np
import scipy.io as sio

def downsample_data(X, Y, factor, patientID):
    out_x = []
    out_y = []
    min_x = [0,0,0,0,0,0]
    max_x = [0,0,0,0,0,0]
    print(len(X))
    # downsampling
    # input data is 200 records per second
    for i in range(len(X)):
        # dump downsampled data
        if i % factor == factor - 1:
            out_x.append(min_x)
            out_x.append(max_x)
            min_x = [0,0,0,0,0,0]
            max_x = [0,0,0,0,0,0]
        for j in range(len(X[i])):
            if X[i][j] < min_x[j]:
                min_x[j] = X[i][j]
            if X[i][j] > max_x[j]:
                max_x[j] = X[i][j]
        if i % 6000 == 0:
            out_y.append(Y[i])
    np.savetxt(data_path + str(patientID) + '_' + str(factor) + '_EEG.csv', out_x, delimiter= ',', fmt='%.3f')
    np.savetxt(data_path + str(patientID) + '_' + str(factor) + '_sleepStates.csv', out_y, delimiter= ',')


def load_export_spect_data(fp):
    all_data = sio.loadmat(fp)
    spect_matrix = np.swapaxes(all_data['sf'], 0, 1)
    timestamps = np.swapaxes(all_data['stimes'], 0, 1)

    # downsample timestamps and spect_matrix
    min_values = np.zeros(len(spect_matrix[0]))
    max_values = np.zeros(len(spect_matrix[0]))

    min_values.fill(9223372036854775807)
    max_values.fill(-9223372036854775807)

    output_matrix = []
    for i in range(len(spect_matrix)):
        if i % 200 == 0:
            output_matrix.append(min_values)
            output_matrix.append(max_values)
            min_values = np.zeros(len(spect_matrix[0]))
            max_values = np.zeros(len(spect_matrix[0]))

            min_values.fill(9223372036854775807)
            max_values.fill(-9223372036854775807)

        for j in range(len(spect_matrix[i])):
            if spect_matrix[i][j] < min_values[j]:
                min_values[j] = spect_matrix[i][j]
            if spect_matrix[i][j] > max_values[j]:
                max_values[j] = spect_matrix[i][j]

    # output_matrix = np.swapaxes(output_matrix, 0, 1)
    # write matrix
    headers = [str(x) for x in range(1,len(output_matrix[0]) + 1)]
    headers.append('\n')
    with open('../data/spect_data_1.csv', 'w') as f:
        f.write(','.join(headers))
        np.savetxt(f,output_matrix,fmt='%.3f', delimiter=',')

    np.savetxt('../data/spect_timestamps_1.csv', timestamps, fmt= '%.2f', delimiter=',')


data_path = '../data/'


EEG_file_path = '../data/YvonneDataSet_Exported_1.mat'
label_file = '../data/YvonneDataSet_Labels_1.mat'


EEG_channels = ['F3M2','F4M1','C3M2','C4M1','O1M2','O2M1']
EEG, sleep_stage, other_info = check_load_Yvonne_dataset(EEG_file_path, label_file, channels=EEG_channels)


# print(other_info)
#
# load_export_spect_data(data_path + 'spect_file_1.mat')

downsample_data(EEG, sleep_stage, 2000, 1)
# function to downsample input and labels by a certain factor


