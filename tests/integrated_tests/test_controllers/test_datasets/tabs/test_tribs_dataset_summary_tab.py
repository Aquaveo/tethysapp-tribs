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

from tethysapp.tribs.controllers.datasets.tabs.tribs_dataset_summary_tab import TribsDatasetSummaryTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_get_summary_tab_info(
    db_session, mock_request, project_with_fdb, scenario_with_project, mocker, test_files, tmp_path
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project.init(project_with_fdb, 26913, salas_in_file)
    mocker.patch('tethysapp.tribs.controllers.datasets.tabs.tribs_dataset_summary_tab.reverse')
    resource_datasets = scenario_with_project.linked_datasets

    # sort the list, to be sure that we have all the datasets accounted for in our test
    resource_datasets_sorted = sorted(resource_datasets, key=lambda obj: obj.name)

    assert len(resource_datasets_sorted) > 0

    mtdd_controller = TribsDatasetSummaryTab()
    summary_columns = mtdd_controller.get_summary_tab_info(
        request=mock_request,
        session=db_session,
        resource=resource_datasets_sorted[0],
    )

    summary_file_out = os.path.join(tmp_path, 'controllers', 'datasets', 'tabs', 'get_summary_tab_info', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(test_files, 'controllers', 'datasets', 'tabs', 'get_summary_tab_info', 'base.txt')
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0
