# """
# ********************************************************************************
# * Name: test_tribs_dataset_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.datasets.tribs_dataset_details import TribsDatasetDetails


def test_get_context(mock_request, mocker):
    mocker.patch('tethysapp.tribs.controllers.datasets.tribs_dataset_details.log')

    context = {}

    mock_has_permission = mocker.patch('tethysapp.tribs.controllers.datasets.tribs_dataset_details.has_permission')
    mock_has_permission.return_value = True

    mtpd_controller = TribsDatasetDetails()
    mtpd_controller.get_context(
        request=mock_request,
        context=context,
    )

    mock_has_permission.assert_called_with(mock_request, "edit_resource")
