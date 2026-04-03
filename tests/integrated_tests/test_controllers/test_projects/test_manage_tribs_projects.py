# """
# ********************************************************************************
# * Name: manage_tribs_projects.py
# * Author: EJones
# * Created On: Oct 18, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.projects.manage_tribs_projects import ManageTribsProjects


def test_get_launch_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.reverse')

    mtp_controller = ManageTribsProjects()
    mtp_controller.get_launch_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with('tribs:project_editor', args=[realization_with_scenario_and_project.id])


def test_get_info_url(mock_request, realization_with_scenario_and_project, mocker):
    mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.reverse')

    mtp_controller = ManageTribsProjects()
    mtp_controller.get_info_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_project_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )


def test_get_error_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.projects.manage_tribs_projects.reverse')

    mtp_controller = ManageTribsProjects()
    mtp_controller.get_error_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_project_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )
