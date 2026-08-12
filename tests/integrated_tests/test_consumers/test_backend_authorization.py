import uuid

import pytest
import pytest_asyncio
from channels.db import database_sync_to_async

from tribs_adapter.app_users import TribsAppUser, TribsOrganization

from tethysapp.tribs.consumers.backend import _user_can_access_project


def ws_path(project_id):
    return f"/apps/tribs/project/{project_id}/editor/ws/"


@pytest_asyncio.fixture
async def a_staff_django_user(transactional_db, django_user_model):
    _async_create_user = database_sync_to_async(django_user_model.objects.create_user)
    staff_user = await _async_create_user(username='staffy', password='password', is_staff=True)
    yield staff_user
    await database_sync_to_async(staff_user.delete)()


@pytest_asyncio.fixture
async def make_app_user(a_session):
    async def _make(username):
        def _sync(session, username):
            app_user = TribsAppUser(username=username, role=TribsAppUser.ROLES.ORG_USER)
            session.add(app_user)
            session.commit()
            return app_user

        return await a_session.run_sync(_sync, username)

    return _make


@pytest_asyncio.fixture
async def add_project_to_org(a_session):
    """Factory: create an organization containing the given project, optionally with a member app user."""
    async def _add(project, member_username=None):
        def _sync(session, project, member_username):
            org = TribsOrganization(
                name=f'test_org_{uuid.uuid4()}',
                license=TribsOrganization.LICENSES.STANDARD,
            )
            org.resources.append(project)
            if member_username:
                app_user = session.query(TribsAppUser).filter(TribsAppUser.username == member_username).one_or_none()
                if app_user is None:
                    app_user = TribsAppUser(username=member_username, role=TribsAppUser.ROLES.ORG_USER)
                    session.add(app_user)
                org.members.append(app_user)
            session.add(org)
            session.commit()
            return org

        return await a_session.run_sync(_sync, project, member_username)

    return _add


@pytest.fixture
def mock_has_permission(mocker):
    """Deny portal-wide permissions so organization membership alone decides access."""
    return mocker.patch('tethys_sdk.permissions.has_permission', return_value=False)


@pytest.mark.asyncio
async def test_org_member_can_access(
    a_empty_project, a_admin_user, add_project_to_org, mock_backend_app_get_ps_db, mock_has_permission
):
    await add_project_to_org(a_empty_project, member_username=a_admin_user.username)
    allowed = await _user_can_access_project(a_admin_user, str(a_empty_project.id), ws_path(a_empty_project.id))
    assert allowed


@pytest.mark.asyncio
async def test_non_member_cannot_access(
    a_empty_project, a_admin_user, make_app_user, add_project_to_org, mock_backend_app_get_ps_db, mock_has_permission
):
    # The project belongs to an organization the user is not a member of
    await make_app_user(a_admin_user.username)
    await add_project_to_org(a_empty_project)
    allowed = await _user_can_access_project(a_admin_user, str(a_empty_project.id), ws_path(a_empty_project.id))
    assert not allowed


@pytest.mark.asyncio
async def test_user_without_app_user_cannot_access(
    a_empty_project, a_admin_user, mock_backend_app_get_ps_db, mock_has_permission
):
    # Authenticated Django user with no corresponding app user record
    allowed = await _user_can_access_project(a_admin_user, str(a_empty_project.id), ws_path(a_empty_project.id))
    assert not allowed


@pytest.mark.asyncio
async def test_nonexistent_project_denied(a_admin_user, make_app_user, mock_backend_app_get_ps_db, mock_has_permission):
    await make_app_user(a_admin_user.username)
    project_id = '00000000-0000-0000-0000-000000000000'
    allowed = await _user_can_access_project(a_admin_user, project_id, ws_path(project_id))
    assert not allowed


@pytest.mark.asyncio
async def test_staff_user_can_access(
    a_empty_project, a_staff_django_user, add_project_to_org, mock_backend_app_get_ps_db, mock_has_permission
):
    # Staff users map to the _staff_user app user, which sees all organizations
    await add_project_to_org(a_empty_project)
    allowed = await _user_can_access_project(a_staff_django_user, str(a_empty_project.id), ws_path(a_empty_project.id))
    assert allowed


@pytest.mark.asyncio
async def test_check_error_fails_closed(
    a_empty_project, a_admin_user, add_project_to_org, mock_backend_app_get_ps_db, mocker
):
    await add_project_to_org(a_empty_project, member_username=a_admin_user.username)
    mocker.patch('tethys_sdk.permissions.has_permission', side_effect=RuntimeError('boom'))
    allowed = await _user_can_access_project(a_admin_user, str(a_empty_project.id), ws_path(a_empty_project.id))
    assert not allowed
