import json
import os
from tethys_dataset_services.engines import GeoServerSpatialDatasetEngine
from tethysext.atcore.utilities import parse_url
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from tethysapp.tribs.cli.cli_helpers import (
    print_header,
    print_success,
    print_info,
    print_error,
)


def init_tribs(arguments):
    """
    Commandline interface for initializing the tribs app.
    """
    errors_occurred = False
    print_header("Initializing tRIBS...")

    url = parse_url(arguments.gsurl)
    # primary_db = parse_url(arguments.primary_db)

    try:
        GEOSERVER_CLUSTER_PORTS = json.loads(os.environ.get("GEOSERVER_CLUSTER_PORTS"))
    except (json.JSONDecodeError, TypeError):
        GEOSERVER_CLUSTER_PORTS = [8081, 8082, 8083, 8084]

    geoserver_engine = GeoServerSpatialDatasetEngine(
        endpoint=url.endpoint,
        username=url.username,
        password=url.password,
        node_ports=GEOSERVER_CLUSTER_PORTS,
    )

    tsm = TribsSpatialManager(geoserver_engine=geoserver_engine)

    # Initialize workspace
    print_info("Initializing tRIBS GeoServer Workspace...")
    try:
        tsm.create_workspace()
        print_success("Successfully initialized tRIBS GeoServer workspace.")
    except Exception as e:
        errors_occurred = True
        print_error("An error occurred during workspace creation: {}".format(e))

    # Initialize styles
    print_info("Initializing tRIBS GeoServer Styles...")
    try:
        tsm.create_all_styles(overwrite=True)
        print_success("Successfully initialized tRIBS GeoServer styles.")
    except Exception as e:
        errors_occurred = True
        print_error("An error occurred during style creation: {}".format(e))

    if not errors_occurred:
        print_success("Successfully initialized tRIBS.")
