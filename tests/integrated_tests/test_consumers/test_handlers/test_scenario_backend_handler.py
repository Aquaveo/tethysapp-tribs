import uuid
import json

import pytest

from tribs_adapter.resources import Dataset
from tethysapp.tribs.consumers.backend_actions import BackendActions


def _serialize(session, scenario):
    return json.loads(scenario.serialize(format='json'))


def _new_mesh_dataset(session, project, test_files, link_to_scenario=None):
    mesh_files = (test_files / 'backend' / 'datasets' / 'mesh').glob('salas.*')
    dataset = Dataset.new(
        session=session,
        name='salas',
        description='mesh for salas',
        created_by='_staff_user',
        project=project,
        dataset_type=Dataset.DatasetTypes.TRIBS_TIN,
        srid=32613,
        items=mesh_files,
    )
    if link_to_scenario:
        link_to_scenario.link_dataset(dataset, "INPUTDATAFILE")
        session.commit()
    return dataset


def _add_linked_dataset(session, project, scenario, test_files):
    cp_input_file = scenario.input_file.model_copy()
    point_files = [test_files / 'backend' / 'datasets' / 'points' / 'salas.points']
    points_dataset = Dataset.new(
        session=session,
        name='salas.points',
        description='points file for salas',
        created_by='_staff_user',
        project=project,
        dataset_type=Dataset.DatasetTypes.TRIBS_POINTS,
        srid=32613,
        items=point_files,
    )
    scenario.add_link(points_dataset)

    # Update the input file to include the points dataset
    cp_input_file.files_and_pathnames.mesh_generation.POINTFILENAME = {
        "resource_id": str(points_dataset.id),
        "file_collection_id": str(points_dataset.file_collection.id),
        "file_collection_paths": [f for f in points_dataset.file_collection_client.files if '__meta__' not in f],
        "path": "",
    }
    scenario.input_file = cp_input_file
    session.commit()
    session.refresh(scenario)
    return points_dataset


@pytest.mark.asyncio  # scenario_with_project_with_fdb
async def test_scenario_receive_data(a_session, a_project_with_scenario, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_DATA,
                },
                "payload": {
                    "id": str(scenario.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert payload["id"] == str(scenario.id)
        assert payload["type"] == scenario.type
        assert payload == await tribsutils.a_expected_payload(a_session, scenario, from_action=action_id)


@pytest.mark.asyncio  # scenario_with_project_with_fdb
async def test_scenario_receive_delete(a_session, a_project_with_scenario, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_DELETE,
                },
                "payload": {
                    "id": str(scenario.id)
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DELETE
        payload = response["payload"]
        assert payload == {"id": str(scenario.id)}


@pytest.mark.asyncio  # project_with_fdb
async def test_scenario_receive_create(a_session, a_empty_project, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_empty_project
    async with make_communicator(project.id) as communicator:
        assert len(await tribsutils.a_get_scenarios(a_session, project)) == 0
        data = {
            "name": "This is a new scenario",
            "description": "Look how new the scenario is.",
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_CREATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert tribsutils.is_uuid4(payload["id"])
        assert payload["created_by"] == "unknown"
        post_scenarios = await tribsutils.a_get_scenarios(a_session, project)
        assert len(post_scenarios) == 1
        assert payload == await tribsutils.a_expected_payload(a_session, post_scenarios[0], from_action=action_id)


@pytest.mark.asyncio  # scenario_with_project_with_fdb
async def test_scenario_receive_update(a_session, a_project_with_scenario, make_communicator, tribsutils):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]
    async with make_communicator(project.id) as communicator:
        assert scenario.name == 'Test Salas'
        assert scenario.description == 'A scenario for testing.'
        data = {
            "id": str(scenario.id),
            "name": "updated name",
            "description": "changed description",
            "attributes": {
                "foo": "bar",
                "input_file": {
                    "garbage": "data"
                },
            },
            'status': 'Dirty',
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_UPDATE,
                },
                "payload": data,
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert payload["id"] == data["id"]
        assert payload["name"] == data["name"]
        assert payload["description"] == data["description"]
        assert payload["status"] == data["status"]
        assert payload["attributes"]["foo"] == data["attributes"]["foo"]
        assert "input_file" not in payload["attributes"]  # input_file should be moved out of attributes
        assert payload["input_file"] != data["attributes"]["input_file"]


@pytest.mark.asyncio  # scenario_with_input_file
async def test_scenario_receive_link_dataset(
    a_session, a_project_with_scenario, make_communicator, test_files, tribsutils
):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]
    dataset = await a_session.run_sync(_new_mesh_dataset, project, test_files, link_to_scenario=None)
    assert len(await tribsutils.a_get_linked_datasets(a_session, scenario)) == 0
    assert scenario.input_file.files_and_pathnames.mesh_generation.INPUTDATAFILE.resource_id is None
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_LINK_DATASET,
                },
                "payload": {
                    "scenario_id": str(scenario.id),
                    "dataset_id": str(dataset.id),
                    "card": "INPUTDATAFILE"
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert payload["id"] == str(scenario.id)
        assert payload["type"] == scenario.type
        assert len(payload["linked_datasets"]) == 1
        assert payload["linked_datasets"][0]["id"] == str(dataset.id)
        fp = payload["input_file"]["files_and_pathnames"]
        assert fp["mesh_generation"]["INPUTDATAFILE"]["resource_id"] == str(dataset.id)


@pytest.mark.asyncio  # scenario_with_input_file
async def test_scenario_receive_unlink_dataset(
    a_session, a_project_with_scenario, make_communicator, test_files, tribsutils
):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]
    dataset = await a_session.run_sync(_new_mesh_dataset, project, test_files, link_to_scenario=scenario)
    assert len(await tribsutils.a_get_linked_datasets(a_session, scenario)) == 1
    assert scenario.input_file.files_and_pathnames.mesh_generation.INPUTDATAFILE.resource_id == dataset.id
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_UNLINK_DATASET,
                },
                "payload": {
                    "scenario_id": str(scenario.id),
                    "dataset_id": str(dataset.id),
                    "card": "INPUTDATAFILE"
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert payload["id"] == str(scenario.id)
        assert payload["type"] == scenario.type
        assert len(payload["linked_datasets"]) == 0
        fp = payload["input_file"]["files_and_pathnames"]
        assert fp["mesh_generation"]["INPUTDATAFILE"]["resource_id"] is None


structured_payload = {
    "id": "SCENARIO_ID_PLACEHOLDER",
    "input_file":
        {
            "file_name": "foo.in",
            "run_parameters":
                {
                    "time_variables":
                        {
                            "STARTDATE": "2020-01-01T00:00:00.000",
                            "RUNTIME": 720,
                            "IDONTEXIST": "don't save me",  # Invalid key
                        },
                },
            "run_options":
                {
                    "OPTMESHINPUT": 7,
                    # "OPTEVAPOTRANS": 5,  # Invalid value
                    # "OPTINTERCEPT": 5,  # Invalid value
                },
            "files_and_pathnames":
                {
                    "mesh_generation":
                        {
                            "INPUTDATAFILE": {
                                "resource_id": "MESH_DATASET_ID_PLACEHOLDER"
                            },  # Existing dataset
                            "POINTFILENAME": {
                                "resource_id": None
                            },  # Remove points dataset
                        },
                    "output_data": {
                        "OUTHYDROEXTENSION": "out",
                        "RIBSHYDOUTPUT": 1,
                    },  # noqa: E122
                    "resampling_grids":
                        {
                            "SOILTABLENAME": {
                                "resource_id": "",
                            },  # Empty string alternative for removing dataset/no dataset selected
                        }
                },
        }
}

flat_payload = {
    "id": "SCENARIO_ID_PLACEHOLDER",
    "input_file":
        {
            "file_name": "foo.in",
            "STARTDATE": "2020-01-01T00:00:00.000",
            "RUNTIME": 720,
            "IDONTEXIST": "don't save me",  # Invalid key
            "OPTMESHINPUT": 7,
            "INPUTDATAFILE": {
                "resource_id": "MESH_DATASET_ID_PLACEHOLDER"
            },  # Existing dataset
            "POINTFILENAME": {
                "resource_id": None
            },  # Remove points dataset
            "SOILTABLENAME": {
                "resource_id": "",
            },  # Empty string alternative for removing dataset/no dataset selected
            "OUTHYDROEXTENSION": "out",
            "RIBSHYDOUTPUT": 1,
        }
}


@pytest.mark.parametrize('send_payload', [structured_payload, flat_payload])
@pytest.mark.asyncio  # scenario_with_input_file
async def test_scenario_receive_update_inputfile(
    a_session, a_project_with_scenario, make_communicator, test_files, send_payload, tribsutils
):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]

    # Prep dataset that will be added with update request (not linked yet)
    mesh_dataset = await a_session.run_sync(_new_mesh_dataset, project, test_files, link_to_scenario=None)

    # Prep dataset that will be removed with update request
    points_dataset = await a_session.run_sync(_add_linked_dataset, project, scenario, test_files)
    assert len(await tribsutils.a_get_linked_datasets(a_session, scenario)) == 1
    assert scenario.input_file.files_and_pathnames.mesh_generation.POINTFILENAME.resource_id == points_dataset.id

    scenario_json_obj = await a_session.run_sync(_serialize, scenario)
    input_file_obj = scenario_json_obj['input_file']

    # Replace placeholders in send payload with IDs
    send_payload["id"] = str(scenario.id)
    if "INPUTDATAFILE" in send_payload["input_file"]:
        send_payload["input_file"]["INPUTDATAFILE"]["resource_id"] = str(mesh_dataset.id)
    else:
        send_payload["input_file"]["files_and_pathnames"]["mesh_generation"]["INPUTDATAFILE"]["resource_id"] = str(
            mesh_dataset.id
        )

    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_UPDATE_INPUTFILE,
                },
                "payload": send_payload,
            }
        )

        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        fp = payload["input_file"]["files_and_pathnames"]
        rp = payload["input_file"]["run_parameters"]
        ro = payload["input_file"]["run_options"]
        assert payload["id"] == str(scenario.id)
        assert payload["type"] == scenario.type
        assert payload["input_file"] != input_file_obj
        assert payload["input_file"]["file_name"] == "foo.in"
        assert rp["time_variables"]["STARTDATE"] == "2020-01-01T00:00:00"
        assert rp["time_variables"]["RUNTIME"] == 720
        assert "IDONTEXIST" not in rp["time_variables"]  # Invalid key should not be added
        assert ro["OPTMESHINPUT"] == 7
        assert fp["output_data"]["OUTHYDROEXTENSION"] == "out"
        assert fp["output_data"]["RIBSHYDOUTPUT"] == 1
        assert len(payload["linked_datasets"]) == 1
        assert payload["linked_datasets"][0]["id"] == str(mesh_dataset.id)
        assert fp["mesh_generation"]["INPUTDATAFILE"]["resource_id"] == str(mesh_dataset.id)
        assert fp["mesh_generation"]["POINTFILENAME"]["resource_id"] is None


@pytest.mark.asyncio  # scenario_with_input_file
async def test_scenario_receive_update_inputfile_validation_error(
    a_session, a_project_with_scenario, make_communicator, tribsutils
):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]

    async with make_communicator(project.id) as communicator:
        payload = {
            "id": str(scenario.id),
            "input_file":
                {
                    "file_name": "foo.in",
                    "STARTDATE": "2020-01-01T00:00:00.000",
                    "RUNTIME": 720,
                    "OPTMESHINPUT": 10,  # Invalid value
                    "OUTHYDROEXTENSION": "out",
                    "RIBSHYDOUTPUT": 1,
                }
        }
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_UPDATE_INPUTFILE,
                },
                "payload": payload,
            }
        )

        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.MESSAGE_ERROR
        r_payload = response["payload"]
        assert r_payload["received"]["action"]["type"] == BackendActions.SCENARIO_UPDATE_INPUTFILE
        assert r_payload["received"]["action"]["id"] == action_id
        assert r_payload[
            "message"
        ] == f'Validation error occurred while handling {BackendActions.SCENARIO_UPDATE_INPUTFILE} ' \
             f'action "{action_id}".'
        assert r_payload["received"]["payload"] == payload
        print(r_payload['details'])
        errs = r_payload["details"]["errors"]
        assert len(errs) == 1
        errs[0]['url'] = ''  # Remove URL for testing
        assert r_payload["details"] == {
            'errors':
                [
                    {
                        'ctx': {
                            'expected': '1, 2, 3, 4, 5, 6, 7, 8 or 9',
                        },
                        'input': 10,
                        'loc': ['OPTMESHINPUT', ],
                        'msg': 'Input should be 1, 2, 3, 4, 5, 6, 7, 8 or 9',
                        'type': 'enum',
                        'url': '',
                    }
                ]
        }


@pytest.mark.asyncio  # scenario_with_input_file
async def test_scenario_receive_duplicate(
    a_session, a_project_with_scenario, make_communicator, test_files, tribsutils
):
    action_id = str(uuid.uuid4())
    project = a_project_with_scenario
    scenario = (await tribsutils.a_get_scenarios(a_session, project))[0]
    dataset = await a_session.run_sync(_new_mesh_dataset, project, test_files, link_to_scenario=scenario)
    assert len(await tribsutils.a_get_linked_datasets(a_session, scenario)) == 1
    assert scenario.input_file.files_and_pathnames.mesh_generation.INPUTDATAFILE.resource_id == dataset.id
    async with make_communicator(project.id) as communicator:
        await communicator.send_json_to(
            {
                "action": {
                    "id": action_id,
                    "type": BackendActions.SCENARIO_DUPLICATE,
                },
                "payload": {
                    "id": str(scenario.id),
                }
            }
        )
        response = await communicator.receive_json_from()
        assert response["action"]["type"] == BackendActions.SCENARIO_DATA
        payload = response["payload"]
        assert tribsutils.is_uuid4(payload["id"])
        assert payload["id"] != str(scenario.id)
        assert payload["type"] == scenario.type
        assert payload["date_created"] != scenario.date_created.isoformat()
        assert payload["name"] == f"{scenario.name} (1)"
        assert payload["description"] == scenario.description
        og_scenario_json = await a_session.run_sync(_serialize, scenario)
        og_input_file = og_scenario_json['input_file']
        cp_input_file = payload["input_file"]
        assert cp_input_file == og_input_file
        linked_datasets = await tribsutils.a_get_linked_datasets(a_session, scenario)
        assert len(payload["linked_datasets"]) == len(linked_datasets)
        assert payload["linked_datasets"][0]["id"] == str(linked_datasets[0].id)
