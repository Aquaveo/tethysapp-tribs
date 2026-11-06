"""``tribs regenerate-viz``: rebuild the visualization artifacts and ``viz`` metadata of existing datasets.

A dataset's visualization (glTF meshes and legends, GeoServer layers, CZML) and the ``viz`` attribute the frontend
reads are only built when the dataset is created. Datasets created before a change to that pipeline keep their old
artifacts and metadata until they are regenerated, which this command does in bulk.
"""
import logging
import sys

from tribs_adapter.resources import Dataset
from tethysapp.tribs.cli.cli_helpers import (
    add_dataset_filter_arguments, make_session, make_spatial_manager, parse_dataset_type, print_error, print_header,
    print_info, print_success, print_warning
)

log = logging.getLogger(f'tethys.apps.{__name__}')


def add_regenerate_viz_parser(subparsers):
    """Register the ``regenerate-viz`` sub-command on the ``tribs`` CLI."""
    parser = subparsers.add_parser(
        'regenerate-viz',
        help='Rebuild the visualization artifacts and viz metadata of existing datasets.',
        description='Rebuild the visualization artifacts and viz metadata of existing datasets. By default every '
        'dataset that has a visualization is regenerated; narrow it down with --dataset-type, --dataset-id and '
        '--project-id.',
    )
    parser.add_argument(
        'primary_db',
        help='The url of the primary tRIBS database connection '
        '(e.g.: "postgresql://tethys_super:***@localhost:5435/tribs_primary_db").'
    )
    parser.add_argument(
        'gsurl',
        help='GeoServer url to geoserver rest endpoint '
        '(e.g.: "http://admin:geoserver@localhost:8181/geoserver/rest/").'
    )
    add_dataset_filter_arguments(parser, verb='regenerated')
    parser.set_defaults(func=main)
    return parser


def select_datasets(session, dataset_types=(), dataset_ids=(), project_id=None):
    """The datasets to regenerate: those with a ``viz`` attribute, narrowed by the given filters."""
    query = session.query(Dataset)
    if dataset_ids:
        query = query.filter(Dataset.id.in_(list(dataset_ids)))
    datasets = []
    for dataset in query.order_by(Dataset.date_created):
        if dataset.get_attribute('viz') is None:
            continue
        if dataset_types and dataset.dataset_type not in dataset_types:
            continue
        if project_id and str(dataset.project.id) != str(project_id):
            continue
        datasets.append(dataset)
    return datasets


def regenerate_dataset(session, spatial_manager, dataset):
    """Remove and rebuild the visualization of one dataset, tracking it in the dataset status like the app does."""
    dataset.set_status(status=dataset.STATUS_PROCESSING)
    session.commit()
    try:
        dataset.remove_visualization(session, spatial_manager)
        dataset.generate_visualization(session, spatial_manager)
    except Exception:
        dataset.set_status(status=dataset.STATUS_ERROR)
        session.commit()
        raise
    dataset.set_status(status=dataset.STATUS_COMPLETE)
    session.commit()


def regenerate_viz(arguments):
    """Commandline interface for regenerating dataset visualizations.

    Returns:
        int: 0 when every selected dataset was regenerated (or nothing was selected), 1 otherwise.
    """
    print_header('Regenerating tRIBS dataset visualizations...')
    try:
        dataset_types = [parse_dataset_type(t) for t in arguments.dataset_types]
    except ValueError as e:
        print_error(str(e))
        return 1

    session = make_session(arguments.primary_db)
    failures = []
    try:
        datasets = select_datasets(session, dataset_types, arguments.dataset_ids, arguments.project_id)
        if not datasets:
            print_warning('No datasets with a visualization match.')
            return 0
        print_info(f'{len(datasets)} dataset(s) to regenerate:')
        for dataset in datasets:
            print(f'  {dataset.id}  {dataset.dataset_type:<28} {dataset.name}')
        if arguments.dry_run:
            print_info('Dry run: nothing regenerated.')
            return 0

        spatial_manager = make_spatial_manager(arguments.gsurl)
        for dataset in datasets:
            print_info(f'Regenerating {dataset.name} ({dataset.id})...')
            try:
                regenerate_dataset(session, spatial_manager, dataset)
            except Exception as e:  # keep going; report at the end
                log.exception(f'Failed to regenerate visualization of dataset {dataset.id}')
                failures.append(dataset)
                print_error(f'  An error occurred while regenerating {dataset.id}: {e}')
            else:
                print_success('  done')
    finally:
        session.close()

    done = len(datasets) - len(failures)
    if failures:
        print_error(
            f'Regenerated {done} of {len(datasets)} dataset(s); {len(failures)} failed: ' +
            ', '.join(str(dataset.id) for dataset in failures)
        )
        return 1
    print_success(f'Successfully regenerated {done} dataset(s).')
    return 0


def main(arguments):
    """Entry point used by the ``tribs`` CLI: exit with the command's status code."""
    sys.exit(regenerate_viz(arguments))
