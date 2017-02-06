import downsample
import mismatch_calculation

if __name__ == '__main__':
    downsample.run_all('../data/input/')
    mismatch_calculation.run_all('../data/input/', '../data/processed/1/')
