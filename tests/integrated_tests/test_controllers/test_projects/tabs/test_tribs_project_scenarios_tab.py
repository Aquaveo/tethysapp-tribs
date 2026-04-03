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

from tethysapp.tribs.controllers.projects.tabs.tribs_project_scenarios_tab import TribsProjectScenariosTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_scenarios_get_resources(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, salas_in_file)

    mtpd_controller = TribsProjectScenariosTab()
    resource_datasets = mtpd_controller.get_resources(
        request=mock_request,
        resource=project_with_fdb,
        session=db_session,
    )

    # sort the list, to be sure that we have all the datasets accounted for in our test
    resource_datasets_sorted = sorted(resource_datasets, key=lambda obj: obj.name)

    summary_file_out = os.path.join(tmp_path, 'controllers', 'projects', 'tabs', 'scenarios_get_resources', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'projects', 'tabs', 'scenarios_get_resources', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(resource_datasets_sorted, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_href_for_resource(
    project_with_fdb,
    mocker,
):
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.projects.tabs.tribs_project_scenarios_tab.reverse')

    mtpd_controller = TribsProjectScenariosTab()
    mtpd_controller.get_href_for_resource(
        app_namespace='tribs',
        resource=project_with_fdb,
    )
    mock_reverse.assert_called_with('tribs:tribs_scenario_details_tab', args=[project_with_fdb.id, 'summary'])
