"""``tribs delete-datasets``: delete existing datasets of a type, with their visualizations, files and links.

For dataset types the app no longer creates, such as the time-dynamic spatial output (TRIBS_OUT_TIME_DYNAMIC) that
was dropped from realizations on 2026-10-30. Deleting a dataset does what the app's delete action does (remove the
visualization, delete the file collection, delete the resource) and also drops the dataset from the output file
paths recorded in the input file of the realizations it was linked to.
"""
import logging
import sys

from tribs_adapter.resources import Dataset
from tethysapp.tribs.cli.cli_helpers import (
    add_dataset_filter_arguments, make_session, make_spatial_manager, parse_dataset_type, print_error, print_header,
    print_info, print_success, print_warning
)

log = logging.getLogger(f'tethys.apps.{__name__}')


def add_delete_datasets_parser(subparsers):
    """Register the ``delete-datasets`` sub-command on the ``tribs`` CLI."""
    parser = subparsers.add_parser(
        'delete-datasets',
        help='Delete existing datasets (visualization, files and resource) by type or id.',
        description='Delete existing datasets by type or id: their visualization, file collection and resource, and '
        'the references to them in the input files of linked realizations. At least one of --dataset-type or '
        '--dataset-id is required; --project-id narrows the selection further. Meant for dataset types the app no '
        'longer creates, e.g. --dataset-type TRIBS_OUT_TIME_DYNAMIC.',
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
    add_dataset_filter_arguments(parser, verb='deleted')
    parser.set_defaults(func=main)
    return parser


def select_datasets(session, dataset_types=(), dataset_ids=(), project_id=None):
    """The datasets to delete: those of the given types or ids, optionally only of one project."""
    query = session.query(Dataset)
    if dataset_ids:
        query = query.filter(Dataset.id.in_(list(dataset_ids)))
    datasets = []
    for dataset in query.order_by(Dataset.date_created):
        if dataset_types and dataset.dataset_type not in dataset_types:
            continue
        if project_id and (dataset.project is None or str(dataset.project.id) != str(project_id)):
            continue
        datasets.append(dataset)
    return datasets


def unlink_from_realizations(dataset):
    """Drop the dataset from the output file paths recorded in the input file of each realization it is linked to.

    Returns:
        list: The realizations whose input file was changed.
    """
    changed = []
    for realization in dataset.linked_realizations:
        input_file = realization.input_file
        if input_file is None:
            continue
        touched = False
        for _card, field in input_file.files(mode=input_file.FilesMode.OUTPUT_ONLY):
            kept = [fdp for fdp in field.file_database_paths if str(fdp.resource_id) != str(dataset.id)]
            if len(kept) != len(field.file_database_paths):
                field.file_database_paths = kept
                touched = True
        if touched:
            realization.input_file = input_file
            changed.append(realization)
    return changed


def delete_dataset(session, spatial_manager, dataset):
    """Delete one dataset the way the app's delete action does, plus the realization input file references."""
    try:
        dataset.remove_visualization(session, spatial_manager)
    except Exception as e:
        log.exception(f'Failed to remove visualization for dataset with ID: "{dataset.id}". {e}')
        print_warning(f'  Could not remove the visualization of {dataset.id} ({e}); deleting anyway.')

    try:
        dataset.file_collection_client.delete()
    except AttributeError as e:
        if "'NoneType' object has no attribute 'id'" not in str(e):
            raise
        print_warning(f'  File collection of {dataset.id} was already deleted.')

    unlink_from_realizations(dataset)
    session.delete(dataset)
    session.commit()


def delete_datasets(arguments):
    """Commandline interface for deleting datasets.

    Returns:
        int: 0 when every selected dataset was deleted (or nothing was selected), 1 otherwise.
    """
    print_header('Deleting tRIBS datasets...')
    if not arguments.dataset_types and not arguments.dataset_ids:
        print_error('Refusing to delete every dataset: give at least one --dataset-type or --dataset-id.')
        return 1
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
            print_warning('No datasets match.')
            return 0
        print_info(f'{len(datasets)} dataset(s) to delete:')
        for dataset in datasets:
            project = dataset.project.name if dataset.project is not None else '-'
            print(f'  {dataset.id}  {dataset.dataset_type:<28} {dataset.name}  (project: {project})')
        if arguments.dry_run:
            print_info('Dry run: nothing deleted.')
            return 0

        spatial_manager = make_spatial_manager(arguments.gsurl)
        for dataset in datasets:
            print_info(f'Deleting {dataset.name} ({dataset.id})...')
            try:
                delete_dataset(session, spatial_manager, dataset)
            except Exception as e:  # keep going; report at the end
                session.rollback()
                log.exception(f'Failed to delete dataset {dataset.id}')
                failures.append(dataset)
                print_error(f'  An error occurred while deleting {dataset.id}: {e}')
            else:
                print_success('  done')
    finally:
        session.close()

    done = len(datasets) - len(failures)
    if failures:
        print_error(
            f'Deleted {done} of {len(datasets)} dataset(s); {len(failures)} failed: ' +
            ', '.join(str(dataset.id) for dataset in failures)
        )
        return 1
    print_success(f'Successfully deleted {done} dataset(s).')
    return 0


def main(arguments):
    """Entry point used by the ``tribs`` CLI: exit with the command's status code."""
    sys.exit(delete_datasets(arguments))
