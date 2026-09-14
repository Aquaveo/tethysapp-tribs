# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
import os
import filecmp
from io import BytesIO
from zipfile import ZipFile
from pytest_unordered import unordered

from tethysapp.tribs.controllers.tabs.datasets_tab import DatasetsTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_datasets_get_resources(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    mtpd_controller = DatasetsTab()
    resource_datasets = mtpd_controller.get_resources(
        request=mock_request,
        resource=scenario_with_project_with_fdb,
        session=db_session,
    )

    # sort the list, to be sure that we have all the datasets accounted for in our test
    resource_datasets_sorted = sorted(resource_datasets, key=lambda obj: obj.name)

    summary_file_out = os.path.join(tmp_path, 'controllers', 'scenarios', 'tabs', 'datasets_get_resources', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'scenarios', 'tabs', 'datasets_get_resources', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(resource_datasets_sorted, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_href_for_resource(
    project_with_fdb,
    mocker,
):
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.tabs.datasets_tab.reverse')

    mtpd_controller = DatasetsTab()
    mtpd_controller.get_href_for_resource(
        app_namespace='tribs',
        resource=project_with_fdb,
    )
    mock_reverse.assert_called_with('tribs:tribs_dataset_details_tab', args=[project_with_fdb.id, 'summary'])


def test_download_all(db_session, mock_request, complete_project, tmp_path):
    scenario = complete_project.scenarios[0]

    # The adapter tests verify what export writes; here we verify the zip mirrors it
    export_dir = tmp_path / 'export'
    scenario.export(export_dir)
    expected_files = [
        os.path.relpath(os.path.join(root, name), export_dir) for root, _dirs, names in os.walk(export_dir)
        for name in names
    ]
    assert 'salas.in' in expected_files
    assert 'Input/salas.soi' in expected_files
    # Realization outputs are not part of a scenario download
    assert 'Output/hyd/salas.cntrl' not in expected_files

    controller = DatasetsTab()
    response = controller.download_all(request=mock_request, resource=scenario, session=db_session)

    assert response.status_code == 200
    assert response['Content-Type'] == 'application/zip'
    assert response['Content-Disposition'] == f'attachment; filename="{scenario.name}.zip"'

    with ZipFile(BytesIO(response.content)) as zf:
        assert zf.namelist() == unordered(expected_files)
        assert zf.testzip() is None
