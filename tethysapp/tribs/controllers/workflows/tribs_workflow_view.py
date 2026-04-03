"""
********************************************************************************
* Name: tribs_workflow_view.py
* Author: EJones
* Created On: October 11, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from django.shortcuts import reverse
from tethysext.atcore.controllers.resource_workflows import ResourceWorkflowRouter


class TribsWorkflowRouter(ResourceWorkflowRouter):
    def default_back_url(self, request, resource_id, *args, **kwargs):
        """
        Get the url of the view to go back to.
        Args:
            request(HttpRequest): The request.
            resource_id(str): ID of the resource this workflow applies to.
            workflow_id(str): ID of the workflow.
            step_id(str): ID of the step to render.
            args, kwargs: Additional arguments passed to the controller.

        Returns:
            str: back url
        """
        referer = request.META.get('HTTP_REFERER', '')
        if referer.endswith('/details/workflows/'):
            return reverse(
                'tribs:tribs_project_details_tab', kwargs={
                    'resource_id': resource_id,
                    'tab_slug': 'workflows'
                }
            )
        return reverse('tribs:project_editor', kwargs={'resource_id': resource_id})
