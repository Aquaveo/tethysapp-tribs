# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_inputfile_tab import TribsRealizationInputfileTab


def test_tribs_scenario_inputfile_tab(
    db_session,
    mock_request,
    realization_with_scenario_and_project,
):
    mtsi_controller = TribsRealizationInputfileTab()
    resource_inputfile = mtsi_controller.get_input_file(
        request=mock_request,
        resource=realization_with_scenario_and_project,
        session=db_session,
    )

    assert realization_with_scenario_and_project.input_file == resource_inputfile
