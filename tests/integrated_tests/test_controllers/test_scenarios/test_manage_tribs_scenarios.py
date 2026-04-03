# """
# ********************************************************************************
# * Name: manage_tribs_scenarios.py
# * Author: EJones
# * Created On: Oct 18, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios import ManageTribsScenarios


def test_get_launch_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios.reverse')

    mtp_controller = ManageTribsScenarios()
    mtp_controller.get_launch_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_scenario_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )


def test_get_error_url(mock_request, realization_with_scenario_and_project, mocker):
    mocker.patch('tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios.reverse')

    mtp_controller = ManageTribsScenarios()
    mtp_controller.get_error_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_scenario_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )
