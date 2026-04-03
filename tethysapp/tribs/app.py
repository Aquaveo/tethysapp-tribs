import os
import sys

from tethys_sdk.base import TethysAppBase, url_map_maker
from tethys_sdk.app_settings import (
    PersistentStoreDatabaseSetting, SpatialDatasetServiceSetting, SchedulerSetting, CustomSetting
)


class Tribs(TethysAppBase):
    """
    Tethys app class for Forest Hydrology Model Builder.
    """

    name = "Forest Hydrology Model Builder"
    description = ("An application for building new tRIBS models to assess forest health.")
    package = "tribs"  # WARNING: Do not change this value
    index = "projects_manage_resources"
    icon = f"{package}/images/fhmb-d-166.png"
    root_url = "tribs"
    color = "#1b663b"
    tags = ""
    enable_feedback = False
    feedback_emails = []

    # Services
    SCHEDULER_NAME = "remote_cluster"
    GEOSERVER_NAME = "primary_geoserver"
    DATABASE_NAME = "primary_db"

    def persistent_store_settings(self):
        """
        Define persistent store settings.
        """
        ps_settings = (
            PersistentStoreDatabaseSetting(
                name=self.DATABASE_NAME,
                description="Primary database for tRIBS Model Builder.",
                initializer="tribs.models.init_primary_db",
                required=True,
                spatial=True,
            ),
        )

        return ps_settings

    def spatial_dataset_service_settings(self):
        """
        Define spatial dataset services settings.
        """
        sds_settings = (
            SpatialDatasetServiceSetting(
                name=self.GEOSERVER_NAME,
                description="GeoServer used to host spatial visualizations for the app.",
                engine=SpatialDatasetServiceSetting.GEOSERVER,
                required=True,
            ),
        )
        return sds_settings

    def register_url_maps(self):
        """
        Add controllers
        """
        from tethysext.atcore.urls import (
            app_users,
            spatial_reference,
            resource_workflows,
        )
        from tethysapp.tribs.controllers.projects.manage_tribs_projects import (
            ManageTribsProjects,
        )
        from tethysapp.tribs.controllers.projects.modify_tribs_project import (
            ModifyTribsProject,
        )
        from tethysapp.tribs.controllers.projects.tribs_project_details import (
            TribsProjectDetails,
        )
        from tribs_adapter.resources.project import Project
        from tethysapp.tribs.controllers.scenarios.manage_tribs_scenarios import (
            ManageTribsScenarios,
        )
        from tethysapp.tribs.controllers.scenarios.modify_tribs_scenario import (
            ModifyTribsScenario,
        )
        from tethysapp.tribs.controllers.scenarios.tribs_scenario_details import (
            TribsScenarioDetails,
        )
        from tribs_adapter.resources.scenario import Scenario
        from tethysapp.tribs.controllers.datasets.manage_tribs_datasets import (
            ManageTribsDatasets,
        )
        from tethysapp.tribs.controllers.datasets.modify_tribs_dataset import (
            ModifyTribsDataset,
        )
        from tethysapp.tribs.controllers.datasets.tribs_dataset_details import (
            TribsDatasetDetails,
        )
        from tribs_adapter.resources.dataset import Dataset
        from tribs_adapter.app_users import TribsOrganization, TribsAppUser
        from tethysapp.tribs.controllers.realizations.manage_tribs_realizations import (
            ManageTribsRealizations,
        )
        from tethysapp.tribs.controllers.realizations.modify_tribs_realization import (
            ModifyTribsRealization,
        )
        from tethysapp.tribs.controllers.realizations.tribs_realization_details import (
            TribsRealizationDetails,
        )
        from tribs_adapter.resources.realization import Realization
        from tribs_adapter.resources.tutorial import Tutorial
        from tethysapp.tribs.controllers.tutorials.manage_tribs_tutorials import ManageTribsTutorials
        from tethysapp.tribs.controllers.tutorials.modify_tribs_tutorials import ModifyTribsTutorial
        from tethysapp.tribs.permissions import TribsPermissionsManager
        from tethysapp.tribs.controllers.workflows.tribs_workflow_view import TribsWorkflowRouter
        from tribs_adapter.workflows import (
            BulkDataRetrievalWorkflow, PrepareMetWorkflow, PrepareSoilsWorkflow, RunSimulationWorkflow
        )

        UrlMap = url_map_maker(self.root_url)
        # Get the urls for the app_users extension
        url_maps = super().register_url_maps(set_index=False)
        url_maps.extend(
            app_users.urls(
                url_map_maker=UrlMap,
                app=self,
                persistent_store_name="primary_db",
                base_template="tribs/base.html",
                custom_models=[TribsOrganization, TribsAppUser],
                custom_resources={
                    Project: [
                        ManageTribsProjects,
                        ModifyTribsProject,
                        TribsProjectDetails,
                    ],
                    Scenario: [
                        ManageTribsScenarios,
                        ModifyTribsScenario,
                        TribsScenarioDetails,
                    ],
                    Dataset: [
                        ManageTribsDatasets,
                        ModifyTribsDataset,
                        TribsDatasetDetails,
                    ],
                    Realization: [
                        ManageTribsRealizations,
                        ModifyTribsRealization,
                        TribsRealizationDetails,
                    ],
                    Tutorial: [ManageTribsTutorials, ModifyTribsTutorial]
                },
            )
        )

        url_maps.extend(
            [
                UrlMap(
                    name="tribs_project_details_tab",
                    url="tribs/projects/{resource_id}/details/{tab_slug}",
                    controller=TribsProjectDetails.as_controller(
                        _app=self,
                        _persistent_store_name="primary_db",
                        _Organization=TribsOrganization,
                        _AppUser=TribsAppUser,
                        _Resource=Project,
                        _PermissionsManager=TribsPermissionsManager,
                    ),
                    regex=["[0-9A-Za-z-_.]+", "[0-9A-Za-z-_.{}]+"],
                ),
                UrlMap(
                    name="tribs_scenario_details_tab",
                    url="tribs/scenarios/{resource_id}/details/{tab_slug}",
                    controller=TribsScenarioDetails.as_controller(
                        _app=self,
                        _persistent_store_name="primary_db",
                        _Organization=TribsOrganization,
                        _AppUser=TribsAppUser,
                        _Resource=Scenario,
                        _PermissionsManager=TribsPermissionsManager,
                    ),
                    regex=["[0-9A-Za-z-_.]+", "[0-9A-Za-z-_.{}]+"],
                ),
                UrlMap(
                    name="tribs_dataset_details_tab",
                    url="tribs/datasets/{resource_id}/details/{tab_slug}",
                    controller=TribsDatasetDetails.as_controller(
                        _app=self,
                        _persistent_store_name="primary_db",
                        _Organization=TribsOrganization,
                        _AppUser=TribsAppUser,
                        _Resource=Dataset,
                        _PermissionsManager=TribsPermissionsManager,
                    ),
                    regex=["[0-9A-Za-z-_.]+", "[0-9A-Za-z-_.{}]+"],
                ),
                UrlMap(
                    name="tribs_realization_details_tab",
                    url="tribs/realizations/{resource_id}/details/{tab_slug}",
                    controller=TribsRealizationDetails.as_controller(
                        _app=self,
                        _persistent_store_name="primary_db",
                        _Organization=TribsOrganization,
                        _AppUser=TribsAppUser,
                        _Resource=Realization,
                        _PermissionsManager=TribsPermissionsManager,
                    ),
                    regex=["[0-9A-Za-z-_.]+", "[0-9A-Za-z-_.{}]+"],
                ),
            ]
        )

        url_maps.extend(
            resource_workflows.urls(
                url_map_maker=UrlMap,
                app=self,
                persistent_store_name="primary_db",
                custom_models=[TribsOrganization, TribsAppUser],
                workflow_pairs=(
                    (BulkDataRetrievalWorkflow, TribsWorkflowRouter), (PrepareMetWorkflow, TribsWorkflowRouter),
                    (PrepareSoilsWorkflow, TribsWorkflowRouter), (RunSimulationWorkflow, TribsWorkflowRouter)
                ),
                custom_permissions_manager=TribsPermissionsManager,
                base_template="tribs/workflows_base.html",
            )
        )

        spatial_reference_urls = spatial_reference.urls(
            url_map_maker=UrlMap, app=self, persistent_store_name="primary_db"
        )
        url_maps.extend(spatial_reference_urls)
        return url_maps

    def permissions(self):
        from tethysapp.tribs.permissions import (
            TribsPermissionsGenerator,
            TribsPermissionsManager,
        )

        # Generate permissions for App Users
        pm = TribsPermissionsManager(self.url_namespace)
        group = TribsPermissionsGenerator(pm)

        permissions = group.generate()
        return permissions

    def scheduler_settings(self):
        """Settings for the scheduler."""
        scheduler_settings = (
            SchedulerSetting(
                name=self.SCHEDULER_NAME,
                description="Scheduler for HTCondor cluster.",
                engine=SchedulerSetting.HTCONDOR,
                required=True,
            ),
        )

        return scheduler_settings

    def custom_settings(self):
        """
        Example custom_settings method.
        """
        custom_settings = (
            CustomSetting(
                name="Cesium_API_Key",
                type=CustomSetting.TYPE_STRING,
                description="API key for accessing Cesium.",
                required=True,
                include_in_api=True,
            ),
        )

        return custom_settings

    @classmethod
    def get_job_executable_dir(cls):
        """
        Return:
             str: the path to the directory containing the job executables.
        """
        return os.path.join(os.path.dirname(sys.modules["tribs_adapter"].__file__), "job_scripts")
