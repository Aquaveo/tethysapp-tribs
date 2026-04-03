#!/opt/tethys-python
import os
import sys
import tempfile
import traceback
import zipfile

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tethys_dataset_services.engines.geoserver_engine import GeoServerSpatialDatasetEngine
from tribs_adapter.io.util import check_files_and_folders_for_filetype
from tribs_adapter.resources import Scenario, Realization, Project
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager


def run(
    resource_db_url, project_id, scenario_id, resource_id, input_archive, srid, geoserver_endpoint,
    geoserver_public_endpoint, geoserver_username, geoserver_password, status_key
):
    """
    Condor executable that creates the geoserver layers for GSSHA projects.

    Args:
        resource_db_url(str): SQLAlchemy url to the Resource database (e.g.: postgresql://postgres:pass@localhost:5432/db).
        project_id(str): ID of associated project.
        scenario_id(str): ID of associated scenario.
        resource_id(str): ID of the Resource associated with the GSSHA model.
        input_archive(str): Path to the GSSHA model zip archive.
        srid(str): Spatial reference system id (e.g.: 4236).
        geoserver_endpoint(str): Url to the GeoServer public endpoint (e.g.: http://localhost:8181/geoserver/rest/).
        geoserver_public_endpoint(str): Url to the GeoServer public endpoint (e.g.: https://geoserver.aquaveo.com/geoserver/rest/).
        geoserver_username(str): Administrator username for given GeoServer.
        geoserver_password(str): Administrator password for given GeoServer.
        status_key(str): Name of status key to use for status updates on the Resource.
    """  # noqa: E501
    resource_db_session = None
    try:
        make_session = sessionmaker()
        gs_engine = GeoServerSpatialDatasetEngine(
            endpoint=geoserver_endpoint,
            username=geoserver_username,
            password=geoserver_password,
        )
        gs_engine.public_endpoint = geoserver_public_endpoint
        gs_manager = TribsSpatialManager(gs_engine)

        resource_db_engine = create_engine(resource_db_url)
        resource_db_session = make_session(bind=resource_db_engine)
        realization = resource_db_session.query(Realization).get(resource_id)
        project = resource_db_session.query(Project).get(project_id)
        scenario = resource_db_session.query(Scenario).get(scenario_id)

        if realization is None:
            raise RuntimeError(f'Could not find Resource of type "{Realization.TYPE}" with id "{resource_id}".')

        if project is None:
            raise RuntimeError(f'Could not find Project with id "{project_id}".')

        if scenario is None:
            raise RuntimeError(f'Could not find Scenario with id "{scenario_id}".')

        # Use a temporary directory to unzip our data and find the input file
        with tempfile.TemporaryDirectory() as temp_dir:
            with zipfile.PyZipFile(input_archive, 'r') as z:
                # Extracting all the members of the zip into a specific location.
                z.extractall(path=temp_dir)
                input_file = check_files_and_folders_for_filetype(temp_dir, '.in')

            if input_file is None:
                raise RuntimeError('Could not find tRIBS input file while initializing scenario.')

            # Initialize the scenario and datasets, including viz
            realization.init(scenario=scenario, model_root=temp_dir, spatial_manager=gs_manager)

        realization.set_status(status_key, Realization.STATUS_SUCCESS)
        resource_db_session.commit()
        sys.stdout.write(f'\nSuccessfully processed {resource_id}\n')

    except Exception as e:
        if realization:
            realization.set_status(status_key, Realization.STATUS_ERROR)
            resource_db_session.commit()
        traceback.print_exc(file=sys.stderr)
        sys.stderr.write(type(e).__name__)
        sys.stderr.write(repr(e))
        raise e
    finally:
        resource_db_session and resource_db_session.close()


if __name__ == "__main__":
    args = sys.argv
    args.pop(0)
    sys.stdout.write(f'Args: {args}\n')
    sys.stdout.write(f'GEOSERVER_CLUSTER_PORTS: {os.environ.get("GEOSERVER_CLUSTER_PORTS")}\n')
    run(*args)
