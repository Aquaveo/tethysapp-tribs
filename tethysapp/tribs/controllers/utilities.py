"""
********************************************************************************
* Name: utility.py
* Author: EJones
* Created On: Nov 6, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
import os
import pathlib


def check_files_and_folders_for_filetype(path, filetype):
    """Check through files and folders and search for the first file with the given filetype.

    Args:
        path (str): The selected path to begin the search
        filetype (str): the extension or suffix of the filetype

    Return:
        file (str): The full path to the found file or None if not found

    """
    file = None
    for filename in os.listdir(path):
        full_filename = os.path.join(path, filename)
        if os.path.isdir(full_filename):
            result = check_files_and_folders_for_filetype(full_filename, filetype)
            if result is not None:
                return result
        elif os.path.isfile(full_filename):
            if pathlib.Path(filename).suffix == filetype:
                file = full_filename
                return file


def human_readable_size(total_size):
    """Give the best size and units for human readability.

    Args:
        total_size (int): The size of the files

    Return:
        total_size (int): The size of the files
        units (str): the units of the total size
    """
    gigabyte = 1000000000
    megabyte = 1000000
    kilobyte = 1000
    units = 'B'
    if total_size > gigabyte:
        units = 'GB'
        total_size /= gigabyte
    elif total_size > megabyte:
        units = 'MB'
        total_size /= megabyte
    elif total_size > kilobyte:
        units = 'KB'
        total_size /= kilobyte
    total_size = round(total_size, 2)

    return total_size, units
