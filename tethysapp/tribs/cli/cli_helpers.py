import json
import os
import logging
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tethys_dataset_services.engines import GeoServerSpatialDatasetEngine
from tethysext.atcore.utilities import parse_url
from tribs_adapter.common.dataset_types import DatasetTypes
from tribs_adapter.resources import Dataset
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager


def print_error(statement):
    print('{}{}{}'.format('\033[91m', statement, '\033[0m'))


def print_success(statement):
    print('{}{}{}'.format('\033[92m', statement, '\033[0m'))


def print_warning(statement):
    print('{}{}{}'.format('\033[93m', statement, '\033[0m'))


def print_info(statement):
    print('{}{}{}'.format('\033[94m', statement, '\033[0m'))


def print_header(statement):
    print('{}{}{}'.format('\033[95m', statement, '\033[0m'))


class PGPassManager(object):
    def __init__(self):
        self.path = self.get_path()
        self.content = self.get_content()

    @staticmethod
    def get_path():
        this_usr_dir = os.path.expanduser('~/')
        return os.path.join(this_usr_dir, '.pgpass')

    def get_content(self):
        pg_pass_content = ''

        if os.path.exists(self.path):
            with open(self.path, 'r') as f:
                pg_pass_content = f.read()

        return pg_pass_content

    def restore_content(self):
        with open(self.path, 'w+') as f:
            f.write(self.content)

    def add_entry_if_not_exists(self, host, port, db_name, username, password):
        entry = '{}:{}:{}:{}:{}'.format(host, port, db_name, username, password)
        if entry not in self.content:
            with open(self.path, 'a') as f:
                f.write(entry)
                f.write('\n')


@contextmanager
def all_logging_disabled(highest_level=logging.CRITICAL):
    """
    A context manager that will prevent any logging messages
    triggered during the body from being processed.
    :param highest_level: the maximum logging level in use.
      This would only need to be changed if a custom level greater than CRITICAL
      is defined.
    """
    # two kind-of hacks here:
    #    * can't get the highest logging level in effect => delegate to the user
    #    * can't get the current module-level override => use an undocumented
    #       (but non-private!) interface

    previous_level = logging.root.manager.disable

    logging.disable(highest_level)

    try:
        yield
    finally:
        logging.disable(previous_level)


def parse_dataset_type(value):
    """The ``DatasetTypes`` member named ``value`` (case-insensitive), e.g. ``TRIBS_TIN``."""
    try:
        return DatasetTypes[value.upper()]
    except KeyError:
        valid = ', '.join(member.name for member in DatasetTypes)
        raise ValueError(f'Unknown dataset type "{value}". Valid types: {valid}')


def make_session(primary_db):
    """A SQLAlchemy session on the primary tRIBS database."""
    return sessionmaker(bind=create_engine(primary_db))()


def make_spatial_manager(gsurl):
    """The spatial manager for the given GeoServer REST url (same setup as ``tribs init``)."""
    url = parse_url(gsurl)
    try:
        node_ports = json.loads(os.environ.get('GEOSERVER_CLUSTER_PORTS'))
    except (json.JSONDecodeError, TypeError):
        node_ports = [8081, 8082, 8083, 8084]
    geoserver_engine = GeoServerSpatialDatasetEngine(
        endpoint=url.endpoint, username=url.username, password=url.password, node_ports=node_ports
    )
    return TribsSpatialManager(geoserver_engine=geoserver_engine)


def select_datasets(session, dataset_types=(), dataset_ids=(), project_id=None, include=None):
    """The datasets a dataset command works on, oldest first.

    Args:
        session (Session): SQLAlchemy session on the primary database.
        dataset_types (iterable): ``DatasetTypes`` members to keep; empty keeps every type.
        dataset_ids (iterable): Dataset ids to keep; empty keeps every dataset.
        project_id (str): Keep only the datasets of this project. A dataset without a project never matches.
        include (callable): Optional ``include(dataset) -> bool`` for what else a command requires of a dataset.

    Returns:
        list: The matching datasets.
    """
    query = session.query(Dataset)
    if dataset_ids:
        query = query.filter(Dataset.id.in_(list(dataset_ids)))
    datasets = []
    for dataset in query.order_by(Dataset.date_created):
        if include is not None and not include(dataset):
            continue
        if dataset_types and dataset.dataset_type not in dataset_types:
            continue
        if project_id and (dataset.project is None or str(dataset.project.id) != str(project_id)):
            continue
        datasets.append(dataset)
    return datasets


def add_dataset_filter_arguments(parser, verb):
    """The ``--dataset-type``, ``--dataset-id`` and ``--project-id`` options shared by the dataset commands."""
    parser.add_argument(
        '--dataset-type',
        action='append',
        dest='dataset_types',
        metavar='TYPE',
        default=[],
        help='Only datasets of this type (e.g. TRIBS_TIN, TRIBS_OUT_TIME_INTEGRATED). Repeatable.',
    )
    parser.add_argument(
        '--dataset-id',
        action='append',
        dest='dataset_ids',
        metavar='ID',
        default=[],
        help='Only the dataset with this id. Repeatable.',
    )
    parser.add_argument('--project-id', metavar='ID', help='Only datasets of this project.')
    parser.add_argument(
        '--dry-run', action='store_true', help=f'List the datasets that would be {verb} without changing anything.'
    )
