"""Tests for ``tribs delete-datasets`` (tethysapp/tribs/cli/delete_datasets_command.py)."""
import os
from argparse import Namespace
from unittest import mock

import pytest

from tethysapp.tribs.cli import delete_datasets_command as cmd
from tribs_adapter.io.input_file import FileDatabasePath
from tribs_adapter.resources import Dataset, Realization
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

MISSING_ID = '00000000-0000-0000-0000-000000000000'


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
    )
    arguments = Namespace(**{**defaults, **options})
    status = cmd.delete_datasets(arguments)
    return status, capsys.readouterr().out


def _output_resource_ids(realization):
    ids = []
    for _card, field in realization.input_file.files(mode=realization.input_file.FilesMode.OUTPUT_ONLY):
        ids.extend(str(fdp.resource_id) for fdp in field.file_database_paths)
    return ids


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
    mocker.patch.object(cmd, 'unlink_from_realizations', side_effect=RuntimeError('boom'))
    status, out = run(capsys, dataset_ids=[str(legacy_dataset.id)])
    assert status == 1
    assert f'1 failed: {legacy_dataset.id}' in out and 'boom' in out
    db_session.expire_all()
    assert db_session.query(Dataset).get(legacy_dataset.id) is not None
