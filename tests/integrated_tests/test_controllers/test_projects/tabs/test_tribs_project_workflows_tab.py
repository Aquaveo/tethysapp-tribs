# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
from unittest.mock import MagicMock

from tethysapp.tribs.controllers.projects.tabs.tribs_project_workflows_tab import TribsProjectWorkflowsTab
from tribs_adapter.workflows import TRIBS_WORKFLOWS
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from tethysapp.tribs.services.tribs_map_manager import TribsMapManager


def test_tribs_project_workflows_tab(mocker):
    mtpw_controller = TribsProjectWorkflowsTab()
    mtpw_controller._app = MagicMock()
    mtpw_controller._app.GEOSERVER_NAME = "primary_geoserver"
    assert mtpw_controller.get_workflow_types(), TRIBS_WORKFLOWS

    assert mtpw_controller.get_map_manager(), TribsMapManager

    assert mtpw_controller.get_spatial_manager(), TribsSpatialManager

    assert mtpw_controller.get_sds_setting_name(), "primary_geoserver"
