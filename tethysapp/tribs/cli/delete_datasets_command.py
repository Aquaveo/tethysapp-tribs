"""``tribs delete-datasets``: delete existing datasets of a type, with their visualizations, files and links.

For dataset types the app no longer creates, such as the time-dynamic spatial output (TRIBS_OUT_TIME_DYNAMIC) that
was dropped from realizations on 2026-10-30. Deleting a dataset does what the app's delete action does (remove the
visualization, delete the file collection, delete the resource) and also drops the dataset from the output file
paths recorded in the input file of the realizations it was linked to.

The command does not delete a dataset that a model still needs: one that is linked to a scenario, or that an input
card of a scenario or realization of its project refers to. A realization keeps a copy of its scenario's input file,
so it can still refer to an input that the scenario has since dropped. ``--force`` deletes those datasets as well,
after removing every reference to them from the input files of the scenarios and realizations concerned.
"""
import logging
import sys

from tribs_adapter.io.input_file import FileDatabasePathCollection, tRIBSInput
from tribs_adapter.resources import Scenario
from tethysapp.tribs.cli.cli_helpers import (
    add_dataset_filter_arguments, make_session, make_spatial_manager, parse_dataset_type, print_error, print_header,
    print_info, print_success, print_warning, select_datasets
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
        'longer creates, e.g. --dataset-type TRIBS_OUT_TIME_DYNAMIC. Datasets that are linked to a scenario or used '
        'as model input by a realization are skipped unless --force is given.',
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
    parser.add_argument(
        '--force',
        action='store_true',
        help='Also delete datasets that are linked to a scenario or used as model input by a realization. Their '
        'references are removed from the input files first, which leaves those scenarios and realizations without '
        'that input.',
    )
    parser.set_defaults(func=main)
    return parser


def _references(field, dataset_id):
    """Whether an input file field (a file path or a collection of them) refers to the dataset with this id."""
    if isinstance(field, FileDatabasePathCollection):
        return any(_references(path, dataset_id) for path in field.file_database_paths)
    resource_ids = field.resource_id if isinstance(field.resource_id, list) else [field.resource_id]
    return dataset_id in [str(resource_id) for resource_id in resource_ids]


def _drop_references(field, dataset_id):
    """Remove the references to a dataset from one input file field.

    Returns:
        bool: True when the field was changed.
    """
    if not _references(field, dataset_id):
        return False
    if isinstance(field, FileDatabasePathCollection):
        field.file_database_paths = [path for path in field.file_database_paths if not _references(path, dataset_id)]
        return True
    if isinstance(field.resource_id, list):
        keep = [i for i, resource_id in enumerate(field.resource_id) if str(resource_id) != dataset_id]
        if keep:
            field.resource_id = [field.resource_id[i] for i in keep]
            field.file_collection_id = [field.file_collection_id[i] for i in keep]
            field.file_collection_paths = [field.file_collection_paths[i] for i in keep]
            return True
    # The only dataset of the card: leave it empty, as Scenario.unlink_dataset does
    field.resource_id = None
    field.file_collection_id = None
    field.file_collection_paths = []
    field.path = ''
    return True


def _referring_cards(resource, dataset, mode):
    """The cards of a scenario's or realization's input file that refer to the dataset."""
    input_file = resource.input_file
    if input_file is None:
        return []
    return [card for card, field in input_file.files(mode=mode) if _references(field, str(dataset.id))]


def _models_that_may_refer_to(dataset):
    """The scenarios and realizations whose input file may refer to the dataset.

    Links do not find them all: a realization keeps a copy of its scenario's input file but is only linked to the
    output datasets it created, and a scenario that has dropped an input leaves its earlier realizations referring
    to it. So this is every scenario and realization of the dataset's project, plus the ones it is linked to.
    """
    models = list(dataset.linked_scenarios) + list(dataset.linked_realizations)
    project = dataset.project
    if project is not None:
        for scenario in project.scenarios:
            models.append(scenario)
            models.extend(scenario.realizations)
    unique = {}
    for model in models:
        unique.setdefault(model.id, model)
    return list(unique.values())


def _describe(model, cards=()):
    """How a scenario or realization is named in the messages: ``realization "Run 1" (GRIDDATA)``."""
    kind = 'scenario' if isinstance(model, Scenario) else 'realization'
    return f'{kind} "{model.name}"' + (f' ({", ".join(cards)})' if cards else '')


def blocking_links(dataset):
    """What still needs a dataset, so that it is only deleted with ``--force``.

    Returns:
        list: A description of every scenario or realization of the dataset's project that refers to it in an input
            card, and of every scenario it is linked to. Empty for a dataset that only output cards refer to.
    """
    linked_scenario_ids = {scenario.id for scenario in dataset.linked_scenarios}
    reasons = []
    for model in _models_that_may_refer_to(dataset):
        cards = _referring_cards(model, dataset, tRIBSInput.FilesMode.INPUT_ONLY)
        if cards or model.id in linked_scenario_ids:
            reasons.append(_describe(model, cards))
    return reasons


def unlink_references(dataset, force=False):
    """Drop the dataset from the input files that refer to it.

    Args:
        dataset (Dataset): The dataset that is about to be deleted.
        force (bool): False drops it from the output cards of the realizations it is linked to. True drops it from
            every card of every scenario and realization that may refer to it (see ``_models_that_may_refer_to``).

    Returns:
        list: The scenarios and realizations whose input file was changed.
    """
    if force:
        models = _models_that_may_refer_to(dataset)
        mode = tRIBSInput.FilesMode.ALL_FILES
    else:
        models = dataset.linked_realizations
        mode = tRIBSInput.FilesMode.OUTPUT_ONLY

    changed = []
    for model in models:
        input_file = model.input_file
        if input_file is None:
            continue
        touched = [_drop_references(field, str(dataset.id)) for _card, field in input_file.files(mode=mode)]
        if any(touched):
            model.input_file = input_file
            changed.append(model)
    return changed


def delete_dataset(session, spatial_manager, dataset, force=False):
    """Delete one dataset the way the app's delete action does, plus the input file references to it.

    Args:
        session (Session): SQLAlchemy session the dataset belongs to.
        spatial_manager (TribsSpatialManager): Used to remove the visualization.
        dataset (Dataset): The dataset to delete.
        force (bool): Also remove the references that scenarios and input cards hold (see ``unlink_references``).
    """
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

    unlink_references(dataset, force=force)
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
    refused = []
    try:
        datasets = select_datasets(session, dataset_types, arguments.dataset_ids, arguments.project_id)
        if not datasets:
            print_warning('No datasets match.')
            return 0
        # Datasets a model still needs are only deleted with --force
        links = {dataset.id: blocking_links(dataset) for dataset in datasets}
        print_info(f'{len(datasets)} dataset(s) to delete:')
        for dataset in datasets:
            project = dataset.project.name if dataset.project is not None else '-'
            print(f'  {dataset.id}  {dataset.dataset_type:<28} {dataset.name}  (project: {project})')
            if links[dataset.id] and arguments.force:
                print_warning(f'    --force: will be unlinked from {"; ".join(links[dataset.id])}.')
            elif links[dataset.id]:
                print_warning(
                    f'    Skipped, still used by {"; ".join(links[dataset.id])}. Use --force to unlink and delete it.'
                )
        if arguments.dry_run:
            print_info('Dry run: nothing deleted.')
            return 0

        refused = [str(dataset.id) for dataset in datasets if links[dataset.id] and not arguments.force]
        spatial_manager = make_spatial_manager(arguments.gsurl)
        for dataset in datasets:
            # Kept as a string: the instance is expired by later commits and detached once the session closes.
            dataset_id = str(dataset.id)
            if dataset_id in refused:
                continue
            print_info(f'Deleting {dataset.name} ({dataset_id})...')
            try:
                delete_dataset(session, spatial_manager, dataset, force=arguments.force)
            except Exception as e:  # keep going; report at the end
                session.rollback()
                log.exception(f'Failed to delete dataset {dataset_id}')
                failures.append(dataset_id)
                print_error(f'  An error occurred while deleting {dataset_id}: {e}')
            else:
                print_success('  done')
    finally:
        session.close()

    done = len(datasets) - len(refused) - len(failures)
    if refused:
        print_error(
            f'{len(refused)} dataset(s) were skipped because a scenario or a model input still uses them '
            f'(use --force to unlink and delete them): {", ".join(refused)}'
        )
    if failures:
        print_error(f'Deleted {done} of {len(datasets)} dataset(s); {len(failures)} failed: ' + ', '.join(failures))
        return 1
    if refused:
        print_info(f'Deleted {done} of {len(datasets)} dataset(s).')
        return 1
    print_success(f'Successfully deleted {done} dataset(s).')
    return 0


def main(arguments):
    """Entry point used by the ``tribs`` CLI: exit with the command's status code."""
    sys.exit(delete_datasets(arguments))
