"""
********************************************************************************
* Name: tribs_realization_summary_tab.py
* Created On: Oct 2, 2023
* Copyright: (c) Aquaveo 2023
********************************************************************************
"""
from tethysapp.tribs.controllers.tabs.input_file_tab import InputfileTab


class TribsRealizationInputfileTab(InputfileTab):
    def get_input_file(self, request, session, resource, *args, **kwargs):
        """Define tRIBS specific summary info.

        Args:
            request (django.http.HttpRequest): the Django request object.
            session (sqlalchemy.orm.Session): the SQLAlchemy session object.
            resource (Resource): the Resource.
        """

        return resource.input_file
