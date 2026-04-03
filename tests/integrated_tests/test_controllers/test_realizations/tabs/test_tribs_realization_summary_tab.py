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

from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_summary_tab import TribsRealizationSummaryTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_get_summary_tab_info_salas(
    db_session, mock_request, project_with_fdb, scenario_with_project_with_fdb, realization_with_scenario_and_project,
    mocker, test_files, tmp_path
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, salas_in_file)
    _ = mocker.patch('tethysapp.tribs.controllers.realizations.tabs.tribs_realization_summary_tab.reverse')

    mtsd_controller = TribsRealizationSummaryTab()
    summary_columns = mtsd_controller.get_summary_tab_info(
        request=mock_request,
        session=db_session,
        resource=realization_with_scenario_and_project,
    )

    summary_file_out = os.path.join(tmp_path, 'controllers', 'realizations', 'tabs', 'get_summary_tab_info', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'realizations', 'tabs', 'get_summary_tab_info', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0
