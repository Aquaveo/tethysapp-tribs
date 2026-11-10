"""Tests for ``tribs regenerate-viz`` (tethysapp/tribs/cli/regenerate_viz_command.py)."""
import os
from argparse import Namespace
from unittest import mock

import pytest
from sqlalchemy import event, text
from sqlalchemy.orm import Session

from tethysapp.tribs.cli import regenerate_viz_command as cmd
from tribs_adapter.common.dataset_types import DatasetTypes
from tribs_adapter.resources import Dataset
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager

MISSING_ID = '00000000-0000-0000-0000-000000000000'


@pytest.fixture
def tin_dataset(db_session, project_with_fdb, test_files):
    """A TRIBS_TIN dataset whose viz predates the per-variable value range (no min/max)."""
    dataset = Dataset.new(
        session=db_session,
        name='Old TIN',
        description='TIN visualized before min/max were recorded.',
        created_by='_staff',
        project=project_with_fdb,
        dataset_type=Dataset.DatasetTypes.TRIBS_TIN,
        srid=32613,
        items=(test_files / 'backend' / 'datasets' / 'mesh').glob('salas.*'),
    )
    dataset.set_attribute(
        'viz', {
            'type':
                'gltf',
            'url': ['fdb/fc/gltf/old.glb'],
            'legend': ['fdb/fc/gltf/old_legend.png'],
            'origin': [-106.58, 34.31, 1960.0],
            'extent': [-106.60, 34.29, -106.57, 34.33],
            'variables':
                [
                    {
                        'name': 'Elevation',
                        'start': None,
                        'end': None,
                        'step_hours': None,
                        'timesteps': [{
                            'hours': None,
                            'time': None,
                            'url': 'fdb/fc/gltf/old.glb',
                            'legend': None
                        }],
                    }
                ],
        }
    )
    db_session.commit()
    yield dataset
    db_session.delete(dataset)
    db_session.commit()


@pytest.fixture
def second_viz_dataset(db_session):
    """A second dataset that has a visualization, so a run covers more than one dataset."""
    dataset = Dataset(name='Second', description='Another dataset with a visualization.')
    dataset.dataset_type = Dataset.DatasetTypes.TRIBS_TIN
    dataset.set_attribute('viz', {'type': 'gltf', 'url': [], 'legend': []})
    db_session.add(dataset)
    db_session.commit()
    yield dataset
    db_session.delete(dataset)
    db_session.commit()


class CommandSession(Session):
    """A session for the command whose commits and rollbacks end at a savepoint.

    The test sessions share one connection inside an outer transaction, and a session on such a connection commits
    or rolls back whatever transaction is innermost. Without a savepoint of its own for every transaction, a
    rollback in the command after one of its commits would undo the rows the fixtures created, which a rollback
    never does in production. See "Joining a Session into an External Transaction" in the SQLAlchemy docs.
    """
    def __init__(self, connection):
        super().__init__(connection)
        self._connection = connection
        self._closing = False
        self._savepoint = connection.begin_nested()
        event.listen(self, 'after_transaction_end', self._restart_savepoint)

    def _restart_savepoint(self, _session, _transaction):
        if not self._closing and not self._savepoint.is_active:
            self._savepoint = self._connection.begin_nested()

    def close(self):
        self._closing = True
        super().close()
        if self._savepoint.is_active:
            self._savepoint.commit()


@pytest.fixture
def mock_services(db_connection, mocker):
    """Point the command at the test database (its own session, which it closes) and a mocked GeoServer."""
    mocker.patch.object(cmd, 'make_session', side_effect=lambda primary_db: CommandSession(db_connection))
    mocker.patch.object(
        cmd, 'make_spatial_manager', side_effect=lambda gsurl: TribsSpatialManager(geoserver_engine=mock.MagicMock())
    )
    mocker.patch.object(TribsSpatialManager, 'get_extent_for_dataset', return_value=[-107.0, 38.0, -106.0, 39.0])


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
    status = cmd.regenerate_viz(arguments)
    return status, capsys.readouterr().out


def test_parse_dataset_type():
    assert cmd.parse_dataset_type('tribs_tin') is DatasetTypes.TRIBS_TIN
    assert cmd.parse_dataset_type('TRIBS_OUT_TIME_INTEGRATED') is DatasetTypes.TRIBS_OUT_TIME_INTEGRATED
    with pytest.raises(ValueError, match='Unknown dataset type "bogus"'):
        cmd.parse_dataset_type('bogus')


def test_regenerate_viz_is_registered_on_the_tribs_cli():
    import argparse
    parser = argparse.ArgumentParser()
    cmd.add_regenerate_viz_parser(parser.add_subparsers())
    args = parser.parse_args(
        [
            'regenerate-viz', 'postgresql://db', 'http://gs', '--dataset-type', 'TRIBS_TIN', '--dataset-type',
            'TRIBS_OUT_TIME_INTEGRATED', '--dataset-id', MISSING_ID, '--project-id', 'p1', '--dry-run'
        ]
    )
    assert args.func is cmd.main
    assert args.primary_db == 'postgresql://db' and args.gsurl == 'http://gs'
    assert args.dataset_types == ['TRIBS_TIN', 'TRIBS_OUT_TIME_INTEGRATED']
    assert args.dataset_ids == [MISSING_ID] and args.project_id == 'p1' and args.dry_run is True


def test_regenerates_viz_of_a_tin_dataset(db_session, tin_dataset, mock_services, capsys):
    status, out = run(capsys)
    assert status == 0
    assert 'Successfully regenerated 1 dataset(s).' in out

    db_session.refresh(tin_dataset)
    viz = tin_dataset.get_attribute('viz')
    elevation = viz['variables'][0]
    assert elevation['name'] == 'Elevation'
    assert elevation['min'] == pytest.approx(1868.0003662109375)
    assert elevation['max'] == pytest.approx(2167.0)
    assert viz['url'] == [elevation['timesteps'][0]['url']]
    assert viz['url'][0].endswith(f'{tin_dataset.id}-salas.glb')
    gltf_dir = os.path.join(tin_dataset.file_collection_client.path, 'gltf')
    assert sorted(os.listdir(gltf_dir)) == [f'{tin_dataset.id}-salas.glb', f'{tin_dataset.id}-salas_legend.png']
    assert tin_dataset.get_status() == tin_dataset.STATUS_COMPLETE


def test_dry_run_and_filters_leave_datasets_alone(db_session, tin_dataset, mock_services, capsys):
    before = tin_dataset.get_attribute('viz')

    status, out = run(capsys, dry_run=True)
    assert status == 0
    assert '1 dataset(s) to regenerate:' in out and str(tin_dataset.id) in out
    assert 'Dry run: nothing regenerated.' in out

    for options in [
        dict(dataset_types=['TRIBS_OUT_TIME_INTEGRATED']),
        dict(dataset_ids=[MISSING_ID]),
        dict(project_id=MISSING_ID),
    ]:
        status, out = run(capsys, **options)
        assert status == 0
        assert 'No datasets with a visualization match.' in out

    db_session.refresh(tin_dataset)
    assert tin_dataset.get_attribute('viz') == before
    assert not os.path.exists(os.path.join(tin_dataset.file_collection_client.path, 'gltf'))


def test_unknown_dataset_type_fails_before_touching_the_database(mock_services, capsys):
    status, out = run(capsys, dataset_types=['bogus'])
    assert status == 1
    assert 'Unknown dataset type "bogus"' in out
    assert cmd.make_session.call_count == 0


def test_skips_datasets_without_viz(db_session, mock_services, capsys):
    dataset = Dataset(name='No viz', description='Never visualized.')
    db_session.add(dataset)
    db_session.commit()
    try:
        status, out = run(capsys, dataset_ids=[str(dataset.id)])
        assert status == 0
        assert 'No datasets with a visualization match.' in out
    finally:
        db_session.delete(dataset)
        db_session.commit()


def test_reports_failures_and_keeps_going(db_session, tin_dataset, mock_services, mocker, capsys):
    mocker.patch.object(Dataset, 'generate_visualization', side_effect=RuntimeError('boom'))
    status, out = run(capsys)
    assert status == 1
    assert f'1 failed: {tin_dataset.id}' in out
    assert 'boom' in out
    db_session.refresh(tin_dataset)
    assert tin_dataset.get_status() == tin_dataset.STATUS_ERROR


def test_failure_summary_survives_a_later_commit(
    db_session, tin_dataset, second_viz_dataset, mock_services, mocker, capsys
):
    """The ids of failed datasets are reported even though a later commit expired them before the session closed."""
    calls = []

    def fail_first_then_commit(session, spatial_manager, dataset):
        calls.append(str(dataset.id))
        if len(calls) == 1:
            raise RuntimeError('boom')
        session.commit()

    mocker.patch.object(cmd, 'regenerate_dataset', side_effect=fail_first_then_commit)
    status, out = run(capsys)
    assert status == 1
    assert len(calls) == 2
    assert f'Regenerated 1 of 2 dataset(s); 1 failed: {calls[0]}' in out


def test_database_failure_is_rolled_back_so_later_datasets_still_run(
    db_session, tin_dataset, second_viz_dataset, mock_services, mocker, capsys
):
    """A failure inside the database is recorded as Error on that dataset only; the next dataset is regenerated."""
    calls = []

    def fail_in_the_database_once(session, spatial_manager):
        calls.append(1)
        if len(calls) == 1:
            session.execute(text('SELECT 1/0'))  # aborts the transaction

    mocker.patch.object(Dataset, 'remove_visualization')
    mocker.patch.object(Dataset, 'generate_visualization', side_effect=fail_in_the_database_once)
    status, out = run(capsys)
    assert status == 1
    assert 'Regenerated 1 of 2 dataset(s); 1 failed' in out
    assert 'division by zero' in out

    db_session.refresh(tin_dataset)
    db_session.refresh(second_viz_dataset)
    statuses = sorted([tin_dataset.get_status(), second_viz_dataset.get_status()])
    assert statuses == sorted([Dataset.STATUS_ERROR, Dataset.STATUS_COMPLETE])


def test_project_filter_skips_datasets_without_a_project(
    db_session, tin_dataset, second_viz_dataset, mock_services, capsys
):
    assert second_viz_dataset.project is None

    status, out = run(capsys, project_id=str(tin_dataset.project.id), dry_run=True)
    assert status == 0
    assert '1 dataset(s) to regenerate:' in out
    assert str(tin_dataset.id) in out and str(second_viz_dataset.id) not in out
