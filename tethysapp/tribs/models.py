from tethysext.atcore.models.app_users import initialize_app_users_db


def init_primary_db(engine, first_time):
    """
    Initializer for the primary database.
    """
    from tribs_adapter.resources import Project, Scenario, Dataset, Realization  # noqa: F401, F403
    from tribs_adapter.app_users import TribsOrganization  # noqa: F401, F403

    # Initialize app users tables
    initialize_app_users_db(engine, first_time)
