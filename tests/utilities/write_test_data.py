# """
# ********************************************************************************
# * Name: utility_functions.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
import re
from collections import OrderedDict
from tribs_adapter.resources.project import Project
from tribs_adapter.resources.scenario import Scenario
from tribs_adapter.resources.dataset import Dataset
from tribs_adapter.resources.realization import Realization


def write_test_data_to_file(data, fp, tabs=''):
    """This function will put an item into a file to compare the data from our tests (Recursive).

    Args:
        data (Any object): Item that we want to write to the file
        fp (filepointer): File pointer
        tabs (str): tabs for current line (as we go deeper into objects, we will add a tab)
    """
    if isinstance(data, str):
        fp.write(tabs)
        pattern = r"id='(\d+)'"  # Regular expression to remove id numbers from the string
        data_str = re.sub(pattern, "id=", data)
        fp.write(data_str)
        fp.write('\n')
    elif isinstance(data, int) or isinstance(data, float):
        fp.write(tabs)
        fp.write(str(data))
        fp.write('\n')
    elif isinstance(data, Project):
        fp.write(tabs)
        fp.write('Project:\t')
        fp.write(data.name)
        fp.write('\n')
    elif isinstance(data, Scenario):
        fp.write(tabs)
        fp.write('Scenario:\t')
        fp.write(data.name)
        fp.write('\n')
    elif isinstance(data, Dataset):
        fp.write(tabs)
        fp.write('Dataset:\t')
        fp.write(data.name)
        fp.write('\n')
    elif isinstance(data, Realization):
        fp.write(tabs)
        fp.write('Realization:\t')
        fp.write(data.name)
        fp.write('\n')
    elif isinstance(data, list):
        tabs += '\t'
        fp.write(tabs)
        fp.write('List\n')
        for item in data:
            write_test_data_to_file(item, fp, tabs)
    elif isinstance(data, tuple):
        tabs += '\t'
        fp.write(tabs)
        fp.write('Tuple[0]:\t')
        write_test_data_to_file(data[0], fp, tabs)
        fp.write(tabs)
        fp.write('Tuple[1]:\t')
        write_test_data_to_file(data[1], fp, tabs)
    elif isinstance(data, OrderedDict) or isinstance(data, dict):
        tabs += '\t'
        fp.write(tabs)
        fp.write('Dictionary\n')
        for key, value in data.items():
            fp.write(tabs)
            fp.write('Key:\t')
            write_test_data_to_file(key, fp, tabs)
            fp.write(tabs)
            fp.write('Values:\t')
            write_test_data_to_file(value, fp, tabs + '\t')
    else:
        # Unrecognized type. Try to write it and mark with (NR) for debugging/recognizing
        fp.write(tabs)
        # fp.write(str(data))  # Don't write the data, because we don't want to write IDs that change
        fp.write('(Not Recognized)\n')
