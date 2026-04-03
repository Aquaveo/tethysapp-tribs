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

from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_summary_tab import TribsScenarioSummaryTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_get_summary_tab_info_salas(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    mocker,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)
    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_summary_tab.reverse')

    mtsd_controller = TribsScenarioSummaryTab()
    summary_columns = mtsd_controller.get_summary_tab_info(
        request=mock_request,
        session=db_session,
        resource=scenario_with_project_with_fdb,
    )

    summary_file_out = os.path.join(
        tmp_path, 'controllers', 'scenarios', 'tabs', 'get_summary_tab_info_salas', 'out.txt'
    )
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'scenarios', 'tabs', 'get_summary_tab_info_salas', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_summary_tab_info_realization(
    db_session,
    mock_request,
    realization_with_scenario_and_project,
    mocker,
    test_files,
    tmp_path,
):
    _ = mocker.patch('tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_summary_tab.reverse')

    mtsd_controller = TribsScenarioSummaryTab()
    summary_columns = mtsd_controller.get_summary_tab_info(
        request=mock_request,
        session=db_session,
        resource=realization_with_scenario_and_project.scenario,
    )

    summary_file_out = os.path.join(
        tmp_path, 'controllers', 'scenarios', 'tabs', 'get_summary_tab_info_realization', 'out.txt'
    )
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'scenarios', 'tabs', 'get_summary_tab_info_realization', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0
