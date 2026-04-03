import uuid
from pathlib import Path

import pytest

from tribs_adapter.resources import Dataset, Scenario, Realization
from tethysapp.tribs.consumers.backend_actions import BackendActions


def _get_project_file_collections(session, project):
    return project.file_database_client.instance.collections


def _get_project_file_database(session, project):
    return project.file_database_client


def _get_file_collection(session, dataset):
    return dataset.file_collection_client


def _delete_file_collection(session, dataset):
    dataset.file_collection_client.delete()


def _linked_scenarios(session, dataset):
    return dataset.linked_scenarios


def _linked_realizations(session, dataset):
    return dataset.linked_realizations


def _get_dataset(session, dataset_id):
    return session.query(Dataset).get(dataset_id)


def _get_project(session, dataset):
    return dataset.project


def _create_and_link_scenario(session, dataset):
    # Create a scenario and link it to test it prevents the dataset from being deleted
    scenario = Scenario(name="test-dataset-remove-link-scenario")
    scenario.project = dataset.project
    session.add(scenario)
    session.commit()
    dataset.add_link(scenario)
    session.commit()
    assert len(dataset.linked_scenarios) == 1
    assert scenario in dataset.linked_scenarios
    return scenario


def _create_and_link_realization(session, dataset, scenario):
    # Create a realization and link it to test it prevents the dataset from being deleted
    realization = Realization(name="test-dataset-remove-link-realization")
    realization.scenario = scenario
    session.add(realization)
    session.commit()
    dataset.add_link(realization)
    session.commit()
    assert len(dataset.linked_realizations) == 1
    assert realization in dataset.linked_realizations
    assert realization in scenario.realizations
    return realization


@pytest.mark.asyncio
async def test_dataset_receive_data(a_session, a_dataset_with_files, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DATA,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.DATASET_DATA
        payload = response["payload"]
        assert payload["id"] == str(dataset.id)
        assert payload["type"] == dataset.type
        assert payload == await tribsutils.a_expected_payload(a_session, dataset, from_action=action_id)


@pytest.mark.asyncio
async def test_dataset_receive_delete(
    a_session, a_dataset_with_files, make_communicator, mock_get_spatial_manager, tribsutils
):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)

    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == Dataset.STATUS_PROCESSING
        assert progress1["message"] == 'Deleting dataset "Test Dataset", please wait.'

        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == Dataset.STATUS_COMPLETE
        assert progress2["message"] == f'Deleted dataset "{dataset.name}".'

        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DELETE
        payload3 = response3["payload"]
        assert payload3 == {"id": str(dataset.id)}

    # Verify dataset and file collections were deleted
    q_dataset = await a_session.run_sync(_get_dataset, payload3["id"])
    assert q_dataset is None
    assert Path(fc_path).exists() is False


@pytest.mark.asyncio
async def test_dataset_receive_delete_linked_scenario(
    a_session, a_dataset_with_files, make_communicator, mock_get_spatial_manager, tribsutils
):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    dataset_id = str(dataset.id)
    project = await a_session.run_sync(_get_project, dataset)

    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    # Link a scenario to the dataset to test that it prevents the dataset from being deleted
    scenario = await a_session.run_sync(_create_and_link_scenario, dataset)
    scenario_id = str(scenario.id)

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload = response["payload"]
        assert payload == {
            'details': {
                'dataset_id': dataset_id,
                'linked_realizations': [],
                'linked_scenarios': [scenario_id],
            },
            'message':
                f'\'Dataset "{dataset.name}" cannot be deleted because it is linked '
                'to one or more scenarios or realizations.\'',
            'received': {
                'action': {
                    'id': action_id,
                    'type': 'DATASET_DELETE',
                },
                'payload': {
                    'id': dataset_id,
                },
            },
        }

    # Verify dataset and file collections were not deleted
    q_dataset = await a_session.run_sync(_get_dataset, payload["details"]["dataset_id"])
    assert q_dataset is not None
    assert Path(fc_path).exists() is True
    q_linked_datasets = await a_session.run_sync(_linked_scenarios, q_dataset)
    assert len(q_linked_datasets) == 1


@pytest.mark.asyncio
async def test_dataset_receive_delete_linked_realization(
    a_session, a_dataset_with_files, make_communicator, tribsutils, mock_get_spatial_manager
):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    dataset_id = str(dataset.id)
    project = await a_session.run_sync(_get_project, dataset)

    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    # Link a scenario to the dataset to test that it prevents the dataset from being deleted
    scenario = await a_session.run_sync(_create_and_link_scenario, dataset)
    scenario_id = str(scenario.id)

    # Link a realization to the dataset to test that it prevents the dataset from being deleted
    realization = await a_session.run_sync(_create_and_link_realization, dataset, scenario)
    realization_id = str(realization.id)

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload = response["payload"]
        assert payload == {
            'details':
                {
                    'dataset_id': dataset_id,
                    'linked_realizations': [realization_id],
                    'linked_scenarios': [scenario_id],
                },
            'message':
                f'\'Dataset "{dataset.name}" cannot be deleted because it is linked to one or more scenarios or realizations.\'',  # noqa: E501
            'received': {
                'action': {
                    'id': action_id,
                    'type': 'DATASET_DELETE',
                },
                'payload': {
                    'id': dataset_id,
                },
            },  # noqa: E122
        }

    # Verify dataset and file collections were not deleted
    q_dataset = await a_session.run_sync(_get_dataset, payload["details"]["dataset_id"])
    assert q_dataset is not None
    assert Path(fc_path).exists() is True
    q_linked_scenarios = await a_session.run_sync(_linked_realizations, q_dataset)
    q_linked_realizations = await a_session.run_sync(_linked_realizations, q_dataset)
    assert len(q_linked_scenarios) == 1
    assert len(q_linked_realizations) == 1


@pytest.mark.asyncio
async def test_dataset_receive_delete_viz_exception(
    a_session, a_dataset_with_files, make_communicator, mock_get_spatial_manager, mocker, tribsutils
):
    mocker.patch(
        'tethysapp.tribs.consumers.handlers.dataset_backend_handler.Dataset.remove_visualization',
        side_effect=Exception('Test Exception')
    )
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.dataset_backend_handler.log')

    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == Dataset.STATUS_PROCESSING
        assert progress1["message"] == 'Deleting dataset "Test Dataset", please wait.'

        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == Dataset.STATUS_COMPLETE
        assert progress2["message"] == f'Deleted dataset "{dataset.name}".'

        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DELETE
        payload3 = response3["payload"]
        assert payload3 == {"id": str(dataset.id)}

    # Verify dataset and file collections were deleted
    q_dataset = await a_session.run_sync(_get_dataset, payload3["id"])
    assert q_dataset is None
    assert Path(fc_path).exists() is False
    mock_log.exception.assert_called_once_with(
        f'Failed to remove visualization for dataset with ID: "{payload3["id"]}". Test Exception'
    )


@pytest.mark.asyncio
async def test_dataset_receive_delete_no_file_collection(
    a_session, a_dataset_with_files, make_communicator, mock_get_spatial_manager, mocker, tribsutils
):
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.dataset_backend_handler.log')
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    # delete the file collection before deleting the dataset
    await a_session.run_sync(_delete_file_collection, dataset)

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": str(dataset.id)
                }
            }
        )
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == Dataset.STATUS_PROCESSING
        assert progress1["message"] == 'Deleting dataset "Test Dataset", please wait.'

        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == Dataset.STATUS_COMPLETE
        assert progress2["message"] == f'Deleted dataset "{dataset.name}".'

        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DELETE
        payload3 = response3["payload"]
        assert payload3 == {"id": str(dataset.id)}

    # Verify dataset and file collections were deleted
    q_dataset = await a_session.run_sync(_get_dataset, payload3["id"])
    assert q_dataset is None
    assert Path(fc_path).exists() is False
    mock_log.warning.assert_called_once_with(
        f"File collection for dataset with ID: '{payload3['id']}' was already deleted. Skipping..."
    )


@pytest.mark.asyncio
async def test_dataset_receive_delete_other_file_collection_error(
    a_session, a_dataset_with_files, make_communicator, mock_get_spatial_manager, mocker, tribsutils
):
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    dataset_id = str(dataset.id)
    fc = await a_session.run_sync(_get_file_collection, dataset)
    fc_path = fc.path
    fc_id = fc.instance.id
    assert fc_id is not None
    assert Path(fc_path).exists() is True

    mock_fcc = mocker.patch('tribs_adapter.resources.dataset.Dataset.file_collection_client')
    mock_fcc.delete.side_effect = AttributeError('Test Exception')
    mock_fcc.path = fc_path
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DELETE,
                },
                "payload": {
                    "id": dataset_id
                }
            }
        )
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == Dataset.STATUS_PROCESSING
        assert progress1["message"] == 'Deleting dataset "Test Dataset", please wait.'

        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload2 = response2["payload"]
        expected_message = (
            "An unexpected error occurred while handling action: "
            f"{{'id': '{action_id}', 'type': 'DATASET_DELETE'}}"
        )
        assert payload2["message"] == expected_message

    mock_log.exception.assert_called_once_with(expected_message)


@pytest.mark.asyncio
async def test_dataset_receive_create_wms(
    a_session, a_empty_project, make_communicator, tribsutils, mock_get_spatial_manager, mock_get_uploads_dir, mocker,
    tmp_path, test_files
):
    action_id = str(uuid.uuid4())
    project = a_empty_project
    dataset_files = (test_files / 'backend' / 'datasets' / 'ascii_raster' / 'p0531200418.txt', )
    await mock_get_uploads_dir(project.id, action_id, dataset_files)

    async with make_communicator(project.id) as communicator:
        datasets = await tribsutils.a_get_datasets(a_session, project)
        assert len(datasets) == 0
        data = {
            "name": "This is a new raster dataset",
            "description": "Look how new the raster dataset is.",
            "dataset_type": Dataset.DatasetTypes.RASTER_CONT_ASCII,
            "srid": "32613",
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_CREATE,
                },
                "payload": data,
            }
        )
        # Processing update: processing
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == "Processing"
        assert progress1["message"] == 'Generating visualization for "This is a new raster dataset", please wait.'

        # Processing update: complete
        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == "Complete"
        assert progress2["message"] == 'Finished generating visualization for "This is a new raster dataset".'

        # Dataset data
        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DATA
        payload3 = response3["payload"]
        assert payload3["name"] == data["name"]
        assert payload3["description"] == data["description"]
        assert tribsutils.is_uuid4(payload3["id"])
        assert payload3["created_by"] == "unknown"
        post_datasets = await tribsutils.a_get_datasets(a_session, project)
        assert len(post_datasets) == 1
        assert payload3 == await tribsutils.a_expected_payload(a_session, post_datasets[0], from_action=action_id)
        assert payload3["viz"] is not None
        print(payload3["viz"])
        assert payload3["viz"] == {
            'type': 'wms',
            'url': 'http://test.mock:8080/geoserver/wms/',
            'layer': f'tribs:{payload3["id"]}',
            'legend':
                [
                    f'http://test.mock:8080/geoserver/wms/?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT'
                    f'=image/png&WIDTH=20&HEIGHT=20&LAYER=tribs:{payload3["id"]}',
                ],
            'extent': [-107.0, 38.0, -106.0, 39.0],
            'origin': None,
            'env_str':
                'val_no_data:-9999.0;val0:0.0;val1:0.0;val2:0.0;val3:0.0;val4:0.0;'
                'val5:0.0;val6:1.0;val7:1.0;val8:1.0;val9:1.0;val10:1.0',
        }


@pytest.mark.asyncio
async def test_dataset_receive_create_tin(
    a_session, a_empty_project, make_communicator, tribsutils, mock_get_spatial_manager, mock_get_uploads_dir, mocker,
    tmp_path, test_files
):
    action_id = str(uuid.uuid4())
    project = a_empty_project
    dataset_files = (test_files / 'backend' / 'datasets' / 'mesh').glob('salas.*')
    await mock_get_uploads_dir(project.id, action_id, dataset_files)

    async with make_communicator(project.id) as communicator:
        datasets = await tribsutils.a_get_datasets(a_session, project)
        assert len(datasets) == 0
        data = {
            "name": "This is a new tin dataset",
            "description": "Look how new the tin dataset is.",
            "dataset_type": Dataset.DatasetTypes.TRIBS_TIN,
            "srid": "32613",
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_CREATE,
                },
                "payload": data,
            }
        )
        # Processing update: processing
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == "Processing"
        assert progress1["message"] == 'Generating visualization for "This is a new tin dataset", please wait.'

        # Processing update: complete
        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == "Complete"
        assert progress2["message"] == 'Finished generating visualization for "This is a new tin dataset".'

        # Dataset data
        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DATA
        payload3 = response3["payload"]
        assert payload3["name"] == data["name"]
        assert payload3["description"] == data["description"]
        assert tribsutils.is_uuid4(payload3["id"])
        assert payload3["created_by"] == "unknown"
        post_datasets = await tribsutils.a_get_datasets(a_session, project)
        assert len(post_datasets) == 1
        assert payload3 == await tribsutils.a_expected_payload(a_session, post_datasets[0], from_action=action_id)
        assert payload3["viz"] is not None
        print(payload3["viz"])
        fdb = await a_session.run_sync(_get_project_file_database, project)
        fdb_id = str(fdb.instance.id)
        fc = await a_session.run_sync(_get_file_collection, post_datasets[0])
        fc_id = str(fc.instance.id)
        f_id = str(post_datasets[0].id)
        assert payload3["viz"] == {
            'type': 'gltf',
            'url': [f'{fdb_id}/{fc_id}/gltf/{f_id}-salas.gltf'],
            'extent': pytest.approx([-106.60003268693941, 34.29129978075136, -106.56766128437329, 34.331757077410224]),
            'legend': [f'{fdb_id}/{fc_id}/gltf/{f_id}-salas_legend.png'],
            'origin': pytest.approx([-106.58421362030992, 34.309707781406104, 1960.196533203125]),
        }


@pytest.mark.asyncio
async def test_dataset_receive_create_generate_viz_error(
    a_session, a_empty_project, make_communicator, tribsutils, mock_get_spatial_manager, mock_get_uploads_dir, mocker,
    tmp_path, test_files
):
    action_id = str(uuid.uuid4())
    project = a_empty_project
    datasets = await tribsutils.a_get_datasets(a_session, project)
    num_dataset = len(datasets)
    project_fcs = await a_session.run_sync(_get_project_file_collections, project)
    num_fcs = len(project_fcs)
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.resource_backend_handler.log')
    dataset_files = (test_files / 'backend' / 'datasets' / 'ascii_raster' / 'p0531200418.txt', )
    await mock_get_uploads_dir(project.id, action_id, dataset_files)

    # Mock dataset.generate_visualization() to raise an exception
    mocker.patch(
        'tribs_adapter.resources.dataset.Dataset.generate_visualization',
        side_effect=Exception('Generate Visualization Test Exception')
    )

    async with make_communicator(project.id) as communicator:
        assert num_dataset == 0
        data = {
            "name": "This is a new dataset",
            "description": "Look how new the dataset is.",
            "dataset_type": Dataset.DatasetTypes.RASTER_CONT_ASCII,
            "srid": "32613",
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_CREATE,
                },
                "payload": data,
            }
        )
        # Processing update: processing
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == "Processing"
        assert progress1["message"] == 'Generating visualization for "This is a new dataset", please wait.'

        # Processing update: error
        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == "Error"
        assert progress2["message"] == 'Failed to generate visualization for "This is a new dataset".'
        assert progress2["details"] == 'Generate Visualization Test Exception'

        # Error message
        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload3 = response3["payload"]
        expected_message = (
            "An unexpected error occurred while handling action: "
            f"{{'id': '{action_id}', 'type': 'DATASET_CREATE'}}"
        )
        assert payload3["message"] == expected_message

    mock_log.exception.assert_called_once_with(expected_message)
    post_datasets = await tribsutils.a_get_datasets(a_session, project)
    assert len(post_datasets) == num_dataset  # New dataset was deleted
    post_project_fcs = await a_session.run_sync(_get_project_file_collections, project)
    assert len(post_project_fcs) == num_fcs  # new fc was deleted


@pytest.mark.asyncio
async def test_dataset_receive_update(a_session, a_dataset_with_files, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    async with make_communicator(project.id) as communicator:
        assert dataset.name == 'Test Dataset'
        assert dataset.description == 'Initialized Dataset with Files.'
        data = {
            "id": str(dataset.id),
            "name": "updated name",
            "description": "changed description",
            "attributes": {
                "foo": "bar",
                "dataset_type": "garbage",  # dataset_type is handled separately
            },
            "dataset_type": Dataset.DatasetTypes.TRIBS_POINTS,
            'status': 'Dirty',
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.DATASET_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] == data["status"]
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]
        assert "dataset_type" not in payload["attributes"]  # dataset_type should be moved out of attributes
        assert payload["dataset_type"] == data["dataset_type"]


@pytest.mark.asyncio
async def test_dataset_receive_update_invalid_status(
    a_session, a_dataset_with_files, make_communicator, mocker, tribsutils
):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    mock_log = mocker.patch('tethysapp.tribs.consumers.handlers.dataset_backend_handler.log')
    async with make_communicator(project.id) as communicator:
        assert dataset.name == 'Test Dataset'
        assert dataset.description == 'Initialized Dataset with Files.'
        data = {
            "id": str(dataset.id),
            "name": "updated name",
            "description": "changed description",
            "attributes": {
                "foo": "bar",
                "dataset_type": "garbage",  # readonly attr dataset_type is handled separately
            },
            "dataset_type": Dataset.DatasetTypes.TRIBS_POINTS,
            'status': 'Not A Real Status',  # Status DNE
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.DATASET_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] is None
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]
        assert "dataset_type" not in payload["attributes"]  # dataset_type should be moved out of attributes
        assert payload["dataset_type"] == data["dataset_type"]
        mock_log.warning.assert_called_with(
            f'Invalid status "{data["status"]}" for Dataset with ID: "{data["id"]}", skipping...'
        )


@pytest.mark.asyncio
async def test_dataset_receive_duplicate(
    a_session, a_dataset_with_files, make_communicator, test_files, tribsutils, mock_get_spatial_manager
):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    og_fcc = await a_session.run_sync(_get_file_collection, dataset)
    og_fc_id = og_fcc.instance.id

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_DUPLICATE,
                },
                "payload": {
                    "id": str(dataset.id),
                }
            }
        )
        # Processing update: processing
        response1 = await communicator.receive_json_from()
        assert response1["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload1 = response1["payload"]
        progress1 = payload1["progress"]
        assert progress1["forActionId"] == action_id
        assert progress1["status"] == "Processing"
        assert progress1["message"] == 'Generating visualization for "Test Dataset (1)", please wait.'

        # Processing update: complete
        response2 = await communicator.receive_json_from()
        assert response2["action"]["type"] == BackendActions.DATASET_PROCESSING_PROGRESS
        payload2 = response2["payload"]
        progress2 = payload2["progress"]
        assert progress2["forActionId"] == action_id
        assert progress2["status"] == "Complete"
        assert progress2["message"] == 'Finished generating visualization for "Test Dataset (1)".'

        # Dataset data
        response3 = await communicator.receive_json_from()
        assert response3["action"]["type"] == BackendActions.DATASET_DATA
        payload3 = response3["payload"]
        assert tribsutils.is_uuid4(payload3["id"])
        assert payload3["id"] != str(dataset.id)
        assert payload3["date_created"] != dataset.date_created.isoformat()
        assert payload3["type"] == dataset.type
        assert payload3["name"] == f"{dataset.name} (1)"
        assert payload3["description"] == dataset.description
        assert payload3["dataset_type"] == dataset.dataset_type
        # TODO: Verify file collections have the same contents but are different
        dup_dataset = await a_session.run_sync(_get_dataset, payload3["id"])
        assert isinstance(dup_dataset, Dataset)
        dup_fcc = await a_session.run_sync(_get_file_collection, dup_dataset)
        assert dup_fcc.instance is not None
        assert dup_fcc.instance.id is not None
        assert dup_fcc.instance.id != og_fc_id
        assert Path(dup_fcc.path).exists() is True
        assert og_fcc.path != dup_fcc.path


@pytest.mark.asyncio
async def test_dataset_receive_timeseries_not_pixel(a_session, a_dataset_with_files, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    dataset = a_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_GET_PIXEL_TIMESERIES,
                },
                "payload": {
                    "id": str(dataset.id),
                    "point_id": 72,
                    "variable": "Nf_mm",
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload = response["payload"]
        assert payload == {
            'message': f'Dataset with ID: "{dataset.id}" is not a TRIBS_OUT_PIXEL dataset.',
            'received':
                {
                    'action': {
                        'id': action_id,
                        'type': 'DATASET_GET_PIXEL_TIMESERIES',
                    },
                    'payload': {
                        'id': str(dataset.id),
                        'point_id': 72,
                        'variable': 'Nf_mm',
                    },
                },
            'details': None,
        }


@pytest.mark.asyncio
async def test_dataset_receive_timeseries_bad_point_id(
    a_session, a_pixel_dataset_with_files, make_communicator
):  # TODO
    action_id = str(uuid.uuid4())
    dataset = a_pixel_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_GET_PIXEL_TIMESERIES,
                },
                "payload": {
                    "id": str(dataset.id),
                    "point_id": 999999,
                    "variable": "Nf_mm",
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        payload = response["payload"]
        assert payload == {
            'message': f'Point file for point ID: "999999" not found in dataset with ID: "{dataset.id}".',
            'received':
                {
                    'action': {
                        'id': action_id,
                        'type': 'DATASET_GET_PIXEL_TIMESERIES',
                    },
                    'payload': {
                        'id': str(dataset.id),
                        'point_id': 999999,
                        'variable': 'Nf_mm',
                    },
                },
            'details': None,
        }


@pytest.mark.asyncio
async def test_dataset_receive_timeseries(a_session, a_pixel_dataset_with_files, make_communicator):  # TODO
    action_id = str(uuid.uuid4())
    dataset = a_pixel_dataset_with_files
    project = await a_session.run_sync(_get_project, dataset)
    point_id = 72
    variable = 'Nf_mm'

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.DATASET_GET_PIXEL_TIMESERIES,
                },
                "payload": {
                    "id": str(dataset.id),
                    "point_id": point_id,
                    "variable": variable,
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.DATASET_GET_PIXEL_TIMESERIES
        payload = response["payload"]
        assert payload == {
            'x': [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
            'y': [0.0, 0.0, 0.0, 0.0, 18.3, 57.7, 88.2, 106.9, 118.7, 127.5, 134.6]
        }
