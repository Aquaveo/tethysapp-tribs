"""Tests for ``tribs delete-datasets`` (tethysapp/tribs/cli/delete_datasets_command.py)."""
import os
from argparse import Namespace
from unittest import mock

import pytest

from tethysapp.tribs.cli import delete_datasets_command as cmd
from tribs_adapter.io.input_file import FileDatabasePath, FileDatabasePathCollection
from tribs_adapter.resources import Dataset, Realization, Scenario
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

MISSING_ID = '00000000-0000-0000-0000-000000000000'
DELETED_ID = '11111111-1111-4111-8111-111111111111'
KEPT_ID = '22222222-2222-4222-8222-222222222222'
COLLECTION_ID = '33333333-3333-4333-8333-333333333333'


@pytest.fixture
def legacy_dataset(db_session, complete_project, test_files):
    """A time-dynamic output dataset linked to a realization the way realizations created before 2026-10-30 were."""
    realization = complete_project.scenarios[0].realizations[0]
    voronoi_dir = test_files / 'models' / 'salas' / 'Output' / 'voronoi'
    dataset = Dataset.new(
        session=db_session,
        name='Time-Dynamic Variable Output',
        description='Time-Dynamic Variable Output for test_realization.',
        created_by='_staff',
        project=realization.project,
        dataset_type=Dataset.DatasetTypes.TRIBS_OUT_TIME_DYNAMIC,
        srid=32613,
        link=realization,
        items=sorted(voronoi_dir.glob('salas.*_00d')),
        relative_to=voronoi_dir,
    )
    dataset.set_attribute('viz', {'type': 'gltf', 'url': [], 'legend': [], 'variables': []})
    input_file = realization.input_file
    input_file.files_and_pathnames.output_data.OUTFILENAME.file_database_paths.append(
        FileDatabasePath(
            resource_id=dataset.id,
            file_collection_id=dataset.file_collection.id,
            file_collection_paths=[f for f in dataset.file_collection_client.files if '__meta__' not in f],
        )
    )
    realization.input_file = input_file
    db_session.commit()
    dataset_id = dataset.id
    yield dataset
    db_session.expire_all()
    if db_session.query(Dataset).get(dataset_id) is not None:  # not deleted by the test
        db_session.delete(dataset)
        db_session.commit()


@pytest.fixture
def scenario_dataset(complete_project):
    """An input dataset that a scenario is linked to and refers to in its input file."""
    scenario = complete_project.scenarios[0]
    return next(d for d in scenario.linked_datasets if str(d.id) in _referenced_ids(scenario))


@pytest.fixture
def stale_input_dataset(db_session, complete_project):
    """An input dataset its scenario no longer uses, which the scenario's earlier realization still refers to.

    A realization keeps a copy of the scenario's input file, and realizations are never linked to input datasets.
    """
    scenario = complete_project.scenarios[0]
    realization = scenario.realizations[0]
    dataset = next(d for d in scenario.linked_datasets if str(d.id) in _referenced_ids(realization))
    card = next(
        card
        for card, field in scenario.input_file.files() if str(dataset.id) in _referenced_ids(scenario, only_card=card)
    )
    scenario.unlink_dataset(dataset, card)
    db_session.commit()
    assert not dataset.linked_scenarios and not dataset.linked_realizations
    assert str(dataset.id) not in _referenced_ids(scenario)
    assert str(dataset.id) in _referenced_ids(realization)
    return dataset


@pytest.fixture
def mock_services(session_maker, mocker):
    """Point the command at the test database (its own session, which it closes) and a mocked GeoServer."""
    mocker.patch.object(cmd, 'make_session', side_effect=lambda primary_db: session_maker())
    mocker.patch.object(
        cmd, 'make_spatial_manager', side_effect=lambda gsurl: TribsSpatialManager(geoserver_engine=mock.MagicMock())
    )


def run(capsys, **options):
    defaults = dict(
        primary_db='postgresql://test',
        gsurl='http://admin:geoserver@test:8181/geoserver/rest/',
        dataset_types=[],
        dataset_ids=[],
        project_id=None,
        dry_run=False,
        force=False,
    )
    arguments = Namespace(**{**defaults, **options})
    status = cmd.delete_datasets(arguments)
    return status, capsys.readouterr().out


def _referenced_ids(resource, output_only=False, only_card=None):
    """The ids of the datasets the input file (or one card of it) of a scenario or realization refers to."""
    input_file = resource.input_file
    mode = input_file.FilesMode.OUTPUT_ONLY if output_only else input_file.FilesMode.ALL_FILES
    ids = []
    for card, field in input_file.files(mode=mode):
        if only_card is not None and card != only_card:
            continue
        for path in getattr(field, 'file_database_paths', [field]):
            resource_ids = path.resource_id if isinstance(path.resource_id, list) else [path.resource_id]
            ids.extend(str(resource_id) for resource_id in resource_ids if resource_id is not None)
    return ids


def _output_resource_ids(realization):
    return _referenced_ids(realization, output_only=True)


def test_delete_datasets_is_registered_on_the_tribs_cli():
    import argparse
    parser = argparse.ArgumentParser()
    cmd.add_delete_datasets_parser(parser.add_subparsers())
    args = parser.parse_args(
        [
            'delete-datasets', 'postgresql://db', 'http://gs', '--dataset-type', 'TRIBS_OUT_TIME_DYNAMIC',
            '--dataset-id', MISSING_ID, '--project-id', 'p1', '--dry-run'
        ]
    )
    assert args.func is cmd.main
    assert args.primary_db == 'postgresql://db' and args.gsurl == 'http://gs'
    assert args.dataset_types == ['TRIBS_OUT_TIME_DYNAMIC']
    assert args.dataset_ids == [MISSING_ID] and args.project_id == 'p1' and args.dry_run is True
    assert args.force is False

    args = parser.parse_args(['delete-datasets', 'postgresql://db', 'http://gs', '--dataset-id', MISSING_ID, '--force'])
    assert args.force is True


def test_deletes_the_legacy_datasets_of_a_type(db_session, legacy_dataset, mock_services, capsys):
    dataset_id = legacy_dataset.id
    files_dir = legacy_dataset.file_collection_client.path
    realization = legacy_dataset.linked_realizations[0]
    other_ids = [d.id for d in realization.linked_datasets if d.id != dataset_id]
    assert other_ids and str(dataset_id) in _output_resource_ids(realization)
    assert os.path.isdir(files_dir)

    status, out = run(capsys, dataset_types=['tribs_out_time_dynamic'])
    assert status == 0
    assert '1 dataset(s) to delete:' in out and str(dataset_id) in out
    assert 'Successfully deleted 1 dataset(s).' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(dataset_id) is None
    assert not os.path.exists(files_dir)
    realization = db_session.query(Realization).get(realization.id)
    assert str(dataset_id) not in _output_resource_ids(realization)
    # The other output datasets and their input file references are untouched
    assert sorted(d.id for d in realization.linked_datasets) == sorted(other_ids)
    assert all(str(i) in _output_resource_ids(realization) for i in other_ids)


def test_dry_run_and_filters_leave_datasets_alone(db_session, legacy_dataset, mock_services, capsys):
    status, out = run(capsys, dataset_types=['TRIBS_OUT_TIME_DYNAMIC'], dry_run=True)
    assert status == 0
    assert '1 dataset(s) to delete:' in out and str(legacy_dataset.id) in out
    assert 'Dry run: nothing deleted.' in out

    for options in [
        dict(dataset_types=['TRIBS_OUT_TIME_DYNAMIC'], project_id=MISSING_ID),
        dict(dataset_ids=[MISSING_ID]),
    ]:
        status, out = run(capsys, **options)
        assert status == 0
        assert 'No datasets match.' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(legacy_dataset.id) is not None
    assert os.path.isdir(legacy_dataset.file_collection_client.path)


def test_refuses_to_run_without_a_filter_or_with_an_unknown_type(mock_services, capsys):
    status, out = run(capsys)
    assert status == 1
    assert 'Refusing to delete every dataset' in out

    status, out = run(capsys, dataset_types=['bogus'])
    assert status == 1
    assert 'Unknown dataset type "bogus"' in out
    assert cmd.make_session.call_count == 0


def test_reports_failures_and_keeps_going(db_session, legacy_dataset, mock_services, mocker, capsys):
    mocker.patch.object(cmd, 'unlink_references', side_effect=RuntimeError('boom'))
    status, out = run(capsys, dataset_ids=[str(legacy_dataset.id)])
    assert status == 1
    assert f'1 failed: {legacy_dataset.id}' in out and 'boom' in out
    db_session.expire_all()
    assert db_session.query(Dataset).get(legacy_dataset.id) is not None


def test_failure_summary_survives_a_later_commit(db_session, legacy_dataset, mock_services, mocker, capsys):
    """The ids of failed datasets are reported even though a later commit expired them before the session closed."""
    realization = legacy_dataset.linked_realizations[0]
    other = next(d for d in realization.linked_datasets if d.id != legacy_dataset.id)
    calls = []

    def fail_first_then_commit(session, spatial_manager, dataset, force=False):
        calls.append(str(dataset.id))
        if len(calls) == 1:
            raise RuntimeError('boom')
        session.commit()

    mocker.patch.object(cmd, 'delete_dataset', side_effect=fail_first_then_commit)
    status, out = run(capsys, dataset_ids=[str(legacy_dataset.id), str(other.id)])
    assert status == 1
    assert len(calls) == 2
    assert f'Deleted 1 of 2 dataset(s); 1 failed: {calls[0]}' in out


def test_skips_a_dataset_a_scenario_still_uses(db_session, scenario_dataset, mock_services, capsys):
    dataset_id = scenario_dataset.id
    files_dir = scenario_dataset.file_collection_client.path
    scenario = scenario_dataset.linked_scenarios[0]

    status, out = run(capsys, dataset_ids=[str(dataset_id)], dry_run=True)
    assert status == 0
    # The scenario and the realization that holds a copy of its input file are both named, with the card
    assert f'Skipped, still used by scenario "{scenario.name}" (' in out
    assert f'realization "{scenario.realizations[0].name}" (' in out
    assert 'Use --force to unlink and delete it.' in out

    status, out = run(capsys, dataset_ids=[str(dataset_id)])
    assert status == 1
    assert '1 dataset(s) were skipped because a scenario or a model input still uses them' in out
    assert str(dataset_id) in out and 'Deleted 0 of 1 dataset(s).' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(dataset_id) is not None
    assert os.path.isdir(files_dir)
    scenario = db_session.query(Scenario).get(scenario.id)
    assert dataset_id in [d.id for d in scenario.linked_datasets]
    assert str(dataset_id) in _referenced_ids(scenario)


def test_force_unlinks_and_deletes_a_dataset_a_scenario_still_uses(db_session, scenario_dataset, mock_services, capsys):
    dataset_id = scenario_dataset.id
    files_dir = scenario_dataset.file_collection_client.path
    scenario = scenario_dataset.linked_scenarios[0]
    other_ids = [str(d.id) for d in scenario.linked_datasets if d.id != dataset_id]
    assert other_ids

    status, out = run(capsys, dataset_ids=[str(dataset_id)], force=True)
    assert status == 0
    assert f'--force: will be unlinked from scenario "{scenario.name}" (' in out
    assert 'Successfully deleted 1 dataset(s).' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(dataset_id) is None
    assert not os.path.exists(files_dir)
    scenario = db_session.query(Scenario).get(scenario.id)
    assert sorted(str(d.id) for d in scenario.linked_datasets) == sorted(other_ids)
    assert str(dataset_id) not in _referenced_ids(scenario)
    assert all(str(dataset_id) not in _referenced_ids(realization) for realization in scenario.realizations)
    # The scenario's other inputs are untouched
    assert all(other_id in _referenced_ids(scenario) for other_id in other_ids)


def _path(resource_id, files):
    return FileDatabasePath(resource_id=resource_id, file_collection_id=COLLECTION_ID, file_collection_paths=files)


@pytest.mark.parametrize(
    'field, expected', [
        pytest.param(
            _path(DELETED_ID, ['a.txt']),
            dict(resource_id=None, file_collection_id=None, file_collection_paths=[], path=''),
            id='only dataset of a card: card left empty',
        ),
        pytest.param(
            FileDatabasePath(
                resource_id=[KEPT_ID, DELETED_ID],
                file_collection_id=[COLLECTION_ID, COLLECTION_ID],
                file_collection_paths=[['kept.txt'], ['deleted.txt']],
            ),
            dict(resource_id=[KEPT_ID], file_collection_id=[COLLECTION_ID], file_collection_paths=[['kept.txt']]),
            id='one of several datasets of a card: the others stay',
        ),
        pytest.param(
            FileDatabasePathCollection(
                file_database_paths=[_path(KEPT_ID, ['kept.txt']),
                                     _path(DELETED_ID, ['d.txt'])]
            ),
            dict(file_database_paths=[dict(resource_id=KEPT_ID, file_collection_paths=['kept.txt'])]),
            id='collection: only its entry is removed',
        ),
    ]
)
def test_drop_references_removes_only_the_deleted_dataset(field, expected):
    assert cmd._drop_references(field, DELETED_ID) is True
    assert cmd._references(field, DELETED_ID) is False

    def subset(actual, wanted):
        """``actual`` as plain data, limited to the keys ``wanted`` names."""
        if isinstance(wanted, dict):
            return {key: subset(actual[key], value) for key, value in wanted.items()}
        if isinstance(wanted, list) and wanted and isinstance(wanted[0], dict):
            return [subset(a, w) for a, w in zip(actual, wanted)] + actual[len(wanted):]
        return actual

    assert subset(field.model_dump(mode='json'), expected) == expected


def test_drop_references_leaves_other_fields_alone():
    field = _path(KEPT_ID, ['kept.txt'])
    assert cmd._drop_references(field, DELETED_ID) is False
    assert str(field.resource_id) == KEPT_ID and field.file_collection_paths == ['kept.txt']


def test_skips_a_dataset_only_an_earlier_realization_still_uses(db_session, stale_input_dataset, mock_services, capsys):
    dataset_id = stale_input_dataset.id
    realization = stale_input_dataset.project.scenarios[0].realizations[0]

    status, out = run(capsys, dataset_ids=[str(dataset_id)])
    assert status == 1
    assert f'Skipped, still used by realization "{realization.name}"' in out
    assert 'Deleted 0 of 1 dataset(s).' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(dataset_id) is not None
    assert str(dataset_id) in _referenced_ids(db_session.query(Realization).get(realization.id))


def test_force_removes_the_references_of_an_earlier_realization(db_session, stale_input_dataset, mock_services, capsys):
    dataset_id = stale_input_dataset.id
    realization = stale_input_dataset.project.scenarios[0].realizations[0]
    other_ids = [i for i in _referenced_ids(realization) if i != str(dataset_id)]
    assert other_ids

    status, out = run(capsys, dataset_ids=[str(dataset_id)], force=True)
    assert status == 0
    assert f'--force: will be unlinked from realization "{realization.name}"' in out

    db_session.expire_all()
    assert db_session.query(Dataset).get(dataset_id) is None
    realization = db_session.query(Realization).get(realization.id)
    assert str(dataset_id) not in _referenced_ids(realization)
    assert sorted(_referenced_ids(realization)) == sorted(other_ids)
