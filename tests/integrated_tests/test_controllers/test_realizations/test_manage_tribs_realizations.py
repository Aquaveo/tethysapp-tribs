# """
# ********************************************************************************
# * Name: manage_tribs_realizations.py
# * Author: EJones
# * Created On: Oct 19, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.realizations.manage_tribs_realizations import ManageTribsRealizations


def test_get_launch_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.realizations.manage_tribs_realizations.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.realizations.manage_tribs_realizations.reverse')

    mtp_controller = ManageTribsRealizations()
    mtp_controller.get_launch_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_realization_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )


def test_get_error_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.realizations.manage_tribs_realizations.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.realizations.manage_tribs_realizations.reverse')

    mtp_controller = ManageTribsRealizations()
    mtp_controller.get_error_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_realization_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )
