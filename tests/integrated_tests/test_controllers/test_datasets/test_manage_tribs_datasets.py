# """
# ********************************************************************************
# * Name: manage_tribs_datasets.py
# * Author: EJones
# * Created On: Oct 18, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.datasets.manage_tribs_datasets import ManageTribsDatasets


def test_get_launch_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.datasets.manage_tribs_datasets.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.datasets.manage_tribs_datasets.reverse')

    mtp_controller = ManageTribsDatasets()
    mtp_controller.get_launch_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_dataset_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )


def test_get_error_url(
    mock_request,
    realization_with_scenario_and_project,
    mocker,
):
    mocker.patch('tethysapp.tribs.controllers.datasets.manage_tribs_datasets.log')
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.datasets.manage_tribs_datasets.reverse')

    mtp_controller = ManageTribsDatasets()
    mtp_controller.get_error_url(
        request=mock_request,
        resource=realization_with_scenario_and_project,
    )

    mock_reverse.assert_called_with(
        'tribs:tribs_dataset_details_tab', args=[realization_with_scenario_and_project.id, 'summary']
    )
