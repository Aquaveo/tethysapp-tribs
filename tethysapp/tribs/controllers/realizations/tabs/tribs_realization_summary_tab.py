"""
********************************************************************************
* Name: tribs_dataset_details_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from collections import OrderedDict

from django.shortcuts import reverse

from tethysext.atcore.controllers.resources import ResourceSummaryTab


class TribsRealizationSummaryTab(ResourceSummaryTab):
    has_preview_image = False
    preview_image_title = 'Map Preview'

    def get_summary_tab_info(self, request, session, resource, *args, **kwargs):
        """Define tRIBS specific summary info.

        Args:
            request (django.http.HttpRequest): the Django request object.
            session (sqlalchemy.orm.Session): the SQLAlchemy session object.
            resource (Resource): the Resource.
        """
        summary_columns = [
            [],  # Place holder for the first column, which is auto-populated with default extent and description
        ]

        related_params = OrderedDict()

        # Summary of related resources
        if resource.children or resource.parents:
            if resource.parents:
                related_params['Parent Project'] = ""
                project = resource.project
                if project is not None:
                    url = reverse('tribs:tribs_project_details_tab', args=[project.id, 'summary'])
                    link = f'<a href="{url}">{project.name}</a>'
                    related_params[link] = project.description

                scenario = resource.scenario
                if scenario:
                    related_params['Parent Scenario'] = ""
                    url = reverse('tribs:tribs_scenario_details_tab', args=[scenario.id, 'summary'])
                    link = f'<a href="{url}">{scenario.name}</a>'
                    related_params[link] = scenario.description

                datasets = resource.linked_datasets
                related_params['Dataset Count'] = len(datasets)

                related_resources_name = 'Related Resources'
                related_resources_table = (related_resources_name, related_params)

                if len(summary_columns) > 1:
                    # Add to the last column
                    summary_columns[-1].append(related_resources_table)
                else:
                    # Add to new second column
                    summary_columns.append([related_resources_table])

        return summary_columns
