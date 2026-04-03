"""
********************************************************************************
* Name: __init__.py
* Author: glarsen
* Created On: January 11, 2024
* Copyright: (c) Aquaveo 2024
********************************************************************************
"""
import argparse
from tethysapp.tribs.cli.init_command import init_tribs


def tribs_command():
    """
    agwa commandline interface function.
    """
    # Create parsers
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title='Commands')

    # init command ----------------------------------------------------------------------------------------------------#
    init_parser = subparsers.add_parser('init', help="Initialize the tribs app.")
    init_parser.add_argument(
        'gsurl',
        help='GeoServer url to geoserver rest endpoint '
        '(e.g.: "http://admin:geoserver@localhost:8181/geoserver/rest/").'
    )
    init_parser.add_argument(
        'primary_db',
        help='The url of the primary tRIBS database connection '
        '(e.g.: "postgresql://tethys_super:***@localhost:5435/tribs_primary_db").'
    )
    init_parser.set_defaults(func=init_tribs)

    # Parse commandline arguments and call command --------------------------------------------------------------------#
    args = parser.parse_args()
    args.func(args)
