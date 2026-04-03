"""
********************************************************************************
* Name: tribs_project_workflows_tab.py
* Created On: SEP 20, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from tethysext.atcore.controllers.resources import ResourceWorkflowsTab
from tribs_adapter.workflows import TRIBS_WORKFLOWS
from tribs_adapter.services.tribs_spatial_manager import TribsSpatialManager
from tethysapp.tribs.services.tribs_map_manager import TribsMapManager


class TribsProjectWorkflowsTab(ResourceWorkflowsTab):
    @classmethod
    def get_workflow_types(cls, request=None, context=None):
        return TRIBS_WORKFLOWS

    def get_map_manager(self):
        return TribsMapManager

    def get_spatial_manager(self):
        return TribsSpatialManager

    def get_sds_setting_name(self):
        return self.get_app().GEOSERVER_NAME
