# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
import unittest.mock as mock
import os
import filecmp

from tethysapp.tribs.controllers.projects.tabs.tribs_project_summary_tab import TribsProjectSummaryTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_get_summary_tab_info(db_session, mock_request, project, test_files, tmp_path):
    with mock.patch.dict('os.environ', {'FDB_ROOT_DIR': str(tmp_path)}, clear=True):
        project.init()

        mtpd_controller = TribsProjectSummaryTab()
        summary_columns = mtpd_controller.get_summary_tab_info(
            request=mock_request,
            session=db_session,
            resource=project,
        )

        summary_file_out = os.path.join(tmp_path, 'controllers', 'projects', 'tabs', 'get_summary_tab_info', 'out.txt')
        os.makedirs(os.path.dirname(summary_file_out))
        summary_file_base = os.path.join(
            test_files, 'controllers', 'projects', 'tabs', 'get_summary_tab_info', 'base.txt'
        )
        with open(summary_file_out, 'w+') as fp:
            write_test_data_to_file(summary_columns, fp)

        assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_summary_tab_info_salas(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    mtpd_controller = TribsProjectSummaryTab()
    summary_columns = mtpd_controller.get_summary_tab_info(
        request=mock_request,
        session=db_session,
        resource=project_with_fdb,
    )

    summary_file_out = os.path.join(
        tmp_path, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_salas', 'out.txt'
    )
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_salas', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_summary_tab_info_kb(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    # os.path.getsize
    mock_path_getsize = mock.MagicMock()
    mock_path_getsize.return_value = 10000

    mtpd_controller = TribsProjectSummaryTab()
    with mock.patch('os.path.getsize', mock_path_getsize):
        summary_columns = mtpd_controller.get_summary_tab_info(
            request=mock_request,
            session=db_session,
            resource=project_with_fdb,
        )

    summary_file_out = os.path.join(tmp_path, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_kb', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_kb', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_summary_tab_info_gb(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    mock_path_getsize = mock.MagicMock()
    mock_path_getsize.return_value = 10000000000

    mtpd_controller = TribsProjectSummaryTab()
    with mock.patch('os.path.getsize', mock_path_getsize):
        summary_columns = mtpd_controller.get_summary_tab_info(
            request=mock_request,
            session=db_session,
            resource=project_with_fdb,
        )

    summary_file_out = os.path.join(tmp_path, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_gb', 'out.txt')
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'projects', 'tabs', 'get_summary_tab_info_gb', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(summary_columns, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0
