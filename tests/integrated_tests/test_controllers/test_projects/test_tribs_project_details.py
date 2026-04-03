# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.projects.tribs_project_details import TribsProjectDetails


def test_get_context(mock_request, mocker):
    mocker.patch('tethysapp.tribs.controllers.projects.tribs_project_details.log')

    context = {}

    mock_has_permission = mocker.patch('tethysapp.tribs.controllers.projects.tribs_project_details.has_permission')
    mock_has_permission.return_value = True

    mtpd_controller = TribsProjectDetails()
    mtpd_controller.get_context(
        request=mock_request,
        context=context,
    )

    mock_has_permission.assert_called_with(mock_request, "edit_resource")
