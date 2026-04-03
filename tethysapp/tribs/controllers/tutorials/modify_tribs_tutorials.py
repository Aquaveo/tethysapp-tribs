"""
********************************************************************************
* Name: modify_tribs_dataset.py
* Author: EJones
* Created On: Aug 29, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""

import logging

from tethysext.atcore.controllers.app_users import ModifyResource
from tethys_sdk.gizmos import TextInput

__all__ = ['ModifyTribsTutorial']
log = logging.getLogger('tribs')


class ModifyTribsTutorial(ModifyResource):
    """
    Controller that handles the new and edit pages for tRibs tutorial resources.
    """
    template_name = 'tribs/modify_tutorial.html'

    def initialize_custom_fields(self, session, request, resource, editing, context=None):
        """
        Hook to allow for initializing custom fields
        """
        link = ''
        if editing and resource:
            link = resource.get_attribute('link', '')

        link_text_input = TextInput(display_text='Link', name='link', initial=link)

        return {'link_text_input': link_text_input}

    def handle_resource_finished_processing(self, session, request, request_app_user, resource, editing, context):
        """
        Hook to allow for post processing after the resource has finished being created or updated.
        Args:
            session(sqlalchemy.session): open sqlalchemy session.
            request(django.request): the Django request.
            request_app_user(AppUser): app user that is making the request.
            resource(Resource): The resource being edited or newly created.
            editing(bool): True if editing, False if creating a new resource.
            contex(dict): Template context variables for the view.
        """
        link = request.POST.get('link')
        resource.set_attribute('link', link)
        session.commit()
