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

from tethysapp.tribs.controllers.scenarios.tabs.tribs_scenario_inputfile_tab import TribsScenarioInputfileTab
from tests.utilities.write_test_data import write_test_data_to_file

# def test_tribs_scenario_inputfile_tab(
#     db_session, mock_request, project_with_fdb, scenario_with_project_with_fdb, mocker, test_files, tmp_path
# ):
#     salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
#     scenario_with_project_with_fdb.init(project_with_fdb, salas_in_file)

#     mtsi_controller = TribsScenarioInputfileTab()
#     resource_inputfile = mtsi_controller.get_input_file(
#         request=mock_request,
#         resource=scenario_with_project_with_fdb,
#         session=db_session,
#     )

#     assert(scenario_with_project_with_fdb.input_file == resource_inputfile)


def test_input_file_tab(
    mocker,
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.tabs.input_file_tab.reverse')
    mock_reverse.return_value = "/apps/tribs/datasets/resource_id/details/summary/"
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    context = {}
    mtsi_controller = TribsScenarioInputfileTab()
    context = mtsi_controller.get_context(
        request=mock_request,
        resource=scenario_with_project_with_fdb,
        session=db_session,
        context=context,
    )

    inputfile_out = os.path.join(tmp_path, 'controllers', 'scenarios', 'tabs', 'input_file', 'out.txt')
    os.makedirs(os.path.dirname(inputfile_out))
    inputfile_base = os.path.join(test_files, 'controllers', 'scenarios', 'tabs', 'input_file', 'base.txt')
    with open(inputfile_out, 'w+') as fp:
        write_test_data_to_file(context, fp)

    with open(inputfile_out, 'r') as out:
        with open(inputfile_base, 'r') as base:
            import difflib
            import sys
            diff = difflib.unified_diff(
                out.readlines(),
                base.readlines(),
                fromfile='out',
                tofile='base',
            )
            for line in diff:
                sys.stdout.write(line)

    assert filecmp.cmp(inputfile_base, inputfile_out, shallow=False)
