from tethys_sdk.permissions import Permission, PermissionGroup
from tethysext.atcore.permissions.app_users import PermissionsGenerator
from tethysext.atcore.services.app_users.permissions_manager import AppPermissionsManager
from tribs_adapter.app_users import TribsRoles, TribsLicenses


class TribsPermissionsManager(AppPermissionsManager):
    ROLES = TribsRoles()
    LICENSES = TribsLicenses()

    # Standard License Permissions Groups
    STD_U_PERMS = 'standard_user_perms'
    STD_A_PERMS = 'standard_admin_perms'

    # Consultant License Permissions Groups
    CON_U_PERMS = 'consultant_user_perms'
    CON_A_PERMS = 'consultant_admin_perms'

    # Global Permissions Groups
    APP_A_PERMS = 'app_admin_perms'

    PERMISSIONS_GROUP_MAP = {
        LICENSES.STANDARD: {
            ROLES.ORG_USER: STD_U_PERMS,
            ROLES.ORG_ADMIN: STD_A_PERMS,
        },
        LICENSES.CONSULTANT: {
            ROLES.ORG_USER: CON_U_PERMS,
            ROLES.ORG_ADMIN: CON_A_PERMS,
        }
    }

    def __init__(self, app_namespace):
        """
        Manages custom_permissions for a given app.
        Args:
            app_namespace(str): Namespace of the app (e.g.: "my_first_app").
        """
        self.app_namespace = app_namespace

        # Namespaced Standard License Permissions Groups
        self.STANDARD_USER_PERMS = '{}:{}'.format(self.app_namespace, self.STD_U_PERMS)
        self.STANDARD_ADMIN_PERMS = '{}:{}'.format(self.app_namespace, self.STD_A_PERMS)

        # Namespaced Consultant License Permissions Groups
        self.CONSULTANT_USER_PERMS = '{}:{}'.format(self.app_namespace, self.CON_U_PERMS)
        self.CONSULTANT_ADMIN_PERMS = '{}:{}'.format(self.app_namespace, self.CON_A_PERMS)

        # Namespaced Global Permissions Groups
        self.APP_ADMIN_PERMS = '{}:{}'.format(self.app_namespace, self.APP_A_PERMS)

        self.NAMESPACED_PERMISSIONS_GROUP_MAP = {
            self.LICENSES.STANDARD:
                {
                    self.ROLES.ORG_USER: self.STANDARD_USER_PERMS,
                    self.ROLES.ORG_ADMIN: self.STANDARD_ADMIN_PERMS,
                },
            self.LICENSES.CONSULTANT:
                {
                    self.ROLES.ORG_USER: self.CONSULTANT_USER_PERMS,
                    self.ROLES.ORG_ADMIN: self.CONSULTANT_ADMIN_PERMS,
                }
        }

    def get_permissions_group_for(self, role, license=None, **kwargs):
        """
        Get the name of the custom_permissions group for the given role, license, and other criteria.
        Args:
            role(str): Role of user.
            license(str): License of organization to which user belongs.
            **kwargs: Used for additional criteria when extending functionality of this class.

        Returns:
            str: name of permission group.
        """
        # Handle all combinations
        if role == self.ROLES.ORG_USER:
            if license == self.LICENSES.STANDARD:
                return self.STANDARD_USER_PERMS
            elif license == self.LICENSES.CONSULTANT:
                return self.CONSULTANT_USER_PERMS

        elif role == self.ROLES.ORG_ADMIN:
            if license == self.LICENSES.STANDARD:
                return self.STANDARD_ADMIN_PERMS
            elif license == self.LICENSES.CONSULTANT:
                return self.CONSULTANT_ADMIN_PERMS

        elif role == self.ROLES.APP_ADMIN:
            return self.APP_ADMIN_PERMS

    def get_display_name_for(self, permissions_group):
        """
        Get the display name for the given permission group.
        Args:
            permissions_group(str): name of permission group.

        Returns:
            str: Display name for the given custom_permissions group.
        """
        display_name_map = {
            self.STANDARD_USER_PERMS: 'Standard User',
            self.STANDARD_ADMIN_PERMS: 'Standard Admin',
            self.CONSULTANT_USER_PERMS: 'Consultant User',
            self.CONSULTANT_ADMIN_PERMS: 'Consultant Admin',
            self.APP_ADMIN_PERMS: 'App Admin',
        }

        if permissions_group in display_name_map:
            return display_name_map[permissions_group]

        return ''

    def get_has_role_permission_for(self, role, license=None):
        """
        Get name of the permission that can be tested to see if a user has the given role.
        Args:
            role(str): Role of user.
            license(str): License of organization to which user belongs (optional).

        Returns:
            str: name of the "has role" permission.
        """
        has_role_permission = None

        if role == self.ROLES.ORG_USER:
            if license is not None:
                if license == self.LICENSES.STANDARD:
                    has_role_permission = 'has_standard_user_role'
                elif license == self.LICENSES.CONSULTANT:
                    has_role_permission = 'has_consultant_user_role'
            else:
                has_role_permission = 'has_org_user_role'

        elif role == self.ROLES.ORG_ADMIN:
            if license is not None:
                if license == self.LICENSES.STANDARD:
                    has_role_permission = 'has_standard_admin_role'
                elif license == self.LICENSES.CONSULTANT:
                    has_role_permission = 'has_consultant_admin_role'
            else:
                has_role_permission = 'has_org_admin_role'

        elif role == self.ROLES.APP_ADMIN:
            has_role_permission = 'has_app_admin_role'

        return has_role_permission

    def get_rank_for(self, permissions_group):
        """
        Get the rank for the given permission group.
        Args:
            permissions_group(str): name of permission group.

        Returns:
            int: Rank for given permission group.
        """
        rank_map = {
            self.STANDARD_USER_PERMS: 1100.0,
            self.STANDARD_ADMIN_PERMS: 1300.0,
            self.CONSULTANT_USER_PERMS: 4100.0,
            self.CONSULTANT_ADMIN_PERMS: 4300.0,
            self.APP_ADMIN_PERMS: 10000.0,
        }

        if permissions_group in rank_map:
            return rank_map[permissions_group]

        return -1.0


class TribsPermissionsGenerator(PermissionsGenerator):
    def generate(self):
        """
        Generate list of permission groups.
        Returns:
            list<PermissionGroups>: all permission groups with permissions.
        """
        # 1. Define All Permissions -----------------------------------------------------------------------------------#

        # Resource Management Permissions
        view_all_resources = Permission(name='view_all_resources', description='View all resources')
        self.all_permissions.append(view_all_resources)

        view_resources = Permission(name='view_resources', description='View resources')
        self.all_permissions.append(view_resources)

        view_resource_details = Permission(name='view_resource_details', description='View details for resources')
        self.all_permissions.append(view_resource_details)

        create_resource = Permission(name='create_resource', description='Create resources')
        self.all_permissions.append(create_resource)

        edit_resource = Permission(name='edit_resource', description='Edit resources')
        self.all_permissions.append(edit_resource)

        delete_resource = Permission(name='delete_resource', description='Delete resources')
        self.all_permissions.append(delete_resource)

        always_delete_resource = Permission(
            name='always_delete_resource', description='Delete resource even if not editable'
        )
        self.all_permissions.append(always_delete_resource)

        # User management permissions
        modify_user_manager = Permission(name='modify_user_manager', description='Modify the manager of a user')
        self.all_permissions.append(modify_user_manager)

        modify_users = Permission(name='modify_users', description='Edit, delete, and create app users')
        self.all_permissions.append(modify_users)

        view_users = Permission(name='view_users', description='View app users')
        self.all_permissions.append(view_users)

        view_all_users = Permission(name='view_all_users', description='View all users')
        self.all_permissions.append(view_all_users)

        assign_org_user_role = Permission(name='assign_org_user_role', description='Assign organization user role')
        self.all_permissions.append(assign_org_user_role)

        assign_org_reviewer_role = Permission(
            name='assign_org_reviewer_role', description='Assign organization reviewer role'
        )
        self.all_permissions.append(assign_org_reviewer_role)

        assign_org_admin_role = Permission(name='assign_org_admin_role', description='Assign organization admin role')
        self.all_permissions.append(assign_org_admin_role)

        assign_app_admin_role = Permission(name='assign_app_admin_role', description='Assign app admin role')
        self.all_permissions.append(assign_app_admin_role)

        assign_developer_role = Permission(name='assign_developer_role', description='Assign developer role')
        self.all_permissions.append(assign_developer_role)

        # Organization permissions
        view_all_organizations = Permission(name='view_all_organizations', description='View any organization')
        self.all_permissions.append(view_all_organizations)

        create_organizations = Permission(
            name='create_organizations', description='Edit, delete, and create organizations'
        )
        self.all_permissions.append(create_organizations)

        edit_organizations = Permission(name='edit_organizations', description='Edit organizations')
        self.all_permissions.append(edit_organizations)

        delete_organizations = Permission(name='delete_organizations', description='Delete organizations')
        self.all_permissions.append(delete_organizations)

        modify_organization_members = Permission(
            name='modify_organization_members', description='Assign and remove members from organizations'
        )
        self.all_permissions.append(modify_organization_members)

        view_organizations = Permission(name='view_organizations', description='View organizations')
        self.all_permissions.append(view_organizations)

        # Assignment permissions
        assign_any_resource = Permission(name='assign_any_resource', description='Assign any resource to organizations')
        self.all_permissions.append(assign_any_resource)

        assign_any_user = Permission(name='assign_any_user', description='Assign any user to organizations')
        self.all_permissions.append(assign_any_user)

        assign_any_organization = Permission(
            name='assign_any_organization', description='Assign any organization to resources'
        )
        self.all_permissions.append(assign_any_organization)

        # Assign license permissions
        assign_standard_license = Permission(name='assign_standard_license', description='Assign standard license')
        self.all_permissions.append(assign_standard_license)

        assign_advanced_license = Permission(name='assign_advanced_license', description='Assign advanced license')
        self.all_permissions.append(assign_advanced_license)

        assign_professional_license = Permission(
            name='assign_professional_license', description='Assign professional license'
        )
        self.all_permissions.append(assign_professional_license)

        assign_consultant_license = Permission(
            name='assign_consultant_license', description='Assign consultant license'
        )
        self.all_permissions.append(assign_consultant_license)

        assign_any_license = Permission(name='assign_any_license', description='Assign any license')
        self.all_permissions.append(assign_any_license)

        # Map View Permissions
        remove_layers = Permission(name='remove_layers', description='Remove layers from map views')
        self.all_permissions.append(remove_layers)

        rename_layers = Permission(name='rename_layers', description='Rename layers from map views')
        self.all_permissions.append(rename_layers)

        toggle_public_layers = Permission(
            name='toggle_public_layers', description='Toggle layers from map views for public viewing'
        )
        self.all_permissions.append(toggle_public_layers)

        use_map_plot = Permission(name='use_map_plot', description='Can use the plotting feature on map views.')
        self.all_permissions.append(use_map_plot)

        use_map_geocode = Permission(name='use_map_geocode', description='Can use the geocoding feature on map views.')
        self.all_permissions.append(use_map_geocode)

        # Lock permissions
        can_override_user_locks = Permission(
            name='can_override_user_locks', description='Can override user locks on workflows.'
        )
        self.all_permissions.append(can_override_user_locks)

        # Download layer permissions
        can_download = Permission(name='can_download', description='Can download layer in map view.')
        self.all_permissions.append(can_download)

        # Download layer permissions
        can_export_datatable = Permission(name='can_export_datatable', description='Can export data in datatable.')
        self.all_permissions.append(can_export_datatable)

        # Only add enabled permissions groups
        enabled_permissions_groups = self.permission_manager.list()

        # 2. Collect Permissions --------------------------------------------------------------------------------------#

        # Standard User -----------------------------------------------------------------------------------------------#
        standard_user_perms = [
            view_resource_details,
            view_organizations,
            view_resources,
            use_map_plot,
            use_map_geocode,
            create_resource,
            edit_resource,
            delete_resource,
        ]

        if self.permission_manager.STD_U_PERMS in self.custom_permissions:
            standard_user_perms += self.custom_permissions[self.permission_manager.STD_U_PERMS]

        # Standard Admin ----------------------------------------------------------------------------------------------#
        standard_admin_perms = standard_user_perms + [
            view_users, modify_users, modify_organization_members, assign_org_user_role, assign_org_reviewer_role,
            assign_org_admin_role, remove_layers, rename_layers, toggle_public_layers, can_override_user_locks,
            can_download, can_export_datatable
        ]

        if self.permission_manager.STD_A_PERMS in self.custom_permissions:
            standard_admin_perms += self.custom_permissions[self.permission_manager.STD_A_PERMS]

        # Consultant User ---------------------------------------------------------------------------------------------#
        consultant_user_perms = standard_user_perms

        if self.permission_manager.CON_U_PERMS in self.custom_permissions:
            consultant_user_perms += self.custom_permissions[self.permission_manager.CON_U_PERMS]

        # Consultant Admin --------------------------------------------------------------------------------------------#
        consultant_admin_perms = standard_admin_perms + consultant_user_perms + [
            create_organizations, edit_organizations, assign_advanced_license, assign_standard_license,
            assign_professional_license, can_download, can_export_datatable
        ]

        if self.permission_manager.CON_A_PERMS in self.custom_permissions:
            consultant_admin_perms += self.custom_permissions[self.permission_manager.CON_A_PERMS]

        # App Admin ---------------------------------------------------------------------------------------------------#
        app_admin_perms = self.all_permissions

        if self.permission_manager.APP_A_PERMS in self.custom_permissions:
            app_admin_perms += self.custom_permissions[self.permission_manager.APP_A_PERMS]

        # 3. Create Permission Groups/Roles ---------------------------------------------------------------------------#
        has_org_user_role = Permission(
            name=self.permission_manager.get_has_role_permission_for(role=self.permission_manager.ROLES.ORG_USER),
            description='Has Organization User role.'
        )

        has_org_admin_role = Permission(
            name=self.permission_manager.get_has_role_permission_for(role=self.permission_manager.ROLES.ORG_ADMIN),
            description='Has Organization Admin role.'
        )

        # Standard User Role ------------------------------------------------------------------------------------------#
        if self.permission_manager.STD_U_PERMS in enabled_permissions_groups:
            # Define role/permissions group
            has_standard_user_role = Permission(
                name=self.permission_manager.get_has_role_permission_for(
                    role=self.permission_manager.ROLES.ORG_USER, license=self.permission_manager.LICENSES.STANDARD
                ),
                description='Has Standard User role'
            )

            standard_user_role = PermissionGroup(
                name=self.permission_manager.STD_U_PERMS,
                permissions=standard_user_perms + [has_standard_user_role, has_org_user_role]
            )

            # Save for later use
            self.permissions[self.permission_manager.STD_U_PERMS] = standard_user_perms
            self.permissions_groups[self.permission_manager.STD_U_PERMS] = standard_user_role
            self.all_permissions_groups.append(standard_user_role)

        # Standard Admin Role -----------------------------------------------------------------------------------------#
        if self.permission_manager.STD_A_PERMS in enabled_permissions_groups:
            # Define role/permissions group
            has_standard_admin_role = Permission(
                name=self.permission_manager.get_has_role_permission_for(
                    role=self.permission_manager.ROLES.ORG_ADMIN, license=self.permission_manager.LICENSES.STANDARD
                ),
                description='Has Standard Admin role'
            )

            standard_admin_role = PermissionGroup(
                name=self.permission_manager.STD_A_PERMS,
                permissions=standard_admin_perms + [has_standard_admin_role, has_org_admin_role]
            )

            # Save for later use
            self.permissions[self.permission_manager.STD_A_PERMS] = standard_admin_perms
            self.permissions_groups[self.permission_manager.STD_A_PERMS] = standard_admin_role
            self.all_permissions_groups.append(standard_admin_role)

        # Consultant User Role ----------------------------------------------------------------------------------------#
        if self.permission_manager.CON_U_PERMS in enabled_permissions_groups:
            # Define role/permissions group
            has_consultant_user_role = Permission(
                name=self.permission_manager.get_has_role_permission_for(
                    role=self.permission_manager.ROLES.ORG_USER, license=self.permission_manager.LICENSES.CONSULTANT
                ),
                description='Has Consultant User role'
            )

            consultant_user_role = PermissionGroup(
                name=self.permission_manager.CON_U_PERMS,
                permissions=consultant_user_perms + [has_consultant_user_role, has_org_user_role]
            )

            # Save for later use
            self.permissions[self.permission_manager.CON_U_PERMS] = consultant_user_perms
            self.permissions_groups[self.permission_manager.CON_U_PERMS] = consultant_user_role
            self.all_permissions_groups.append(consultant_user_role)

        # Consultant Admin Role ---------------------------------------------------------------------------------------#
        if self.permission_manager.CON_A_PERMS in enabled_permissions_groups:
            # Define role/permissions group
            has_consultant_admin_role = Permission(
                name=self.permission_manager.get_has_role_permission_for(
                    role=self.permission_manager.ROLES.ORG_ADMIN, license=self.permission_manager.LICENSES.CONSULTANT
                ),
                description='Has Consultant Admin role'
            )

            consultant_admin_role = PermissionGroup(
                name=self.permission_manager.CON_A_PERMS,
                permissions=consultant_admin_perms + [has_consultant_admin_role, has_org_admin_role]
            )

            # Save for later use
            self.permissions[self.permission_manager.CON_A_PERMS] = consultant_admin_perms
            self.permissions_groups[self.permission_manager.CON_A_PERMS] = consultant_admin_role
            self.all_permissions_groups.append(consultant_admin_role)

        # App Admin Role ----------------------------------------------------------------------------------------------#
        if self.permission_manager.APP_A_PERMS in enabled_permissions_groups:
            # Define role/permissions group
            has_app_admin_role = Permission(
                name=self.permission_manager.get_has_role_permission_for(role=self.permission_manager.ROLES.APP_ADMIN),
                description='Has App Admin role'
            )

            app_admin_role = PermissionGroup(
                name=self.permission_manager.APP_A_PERMS, permissions=app_admin_perms + [has_app_admin_role]
            )

            # Save for later use
            self.permissions[self.permission_manager.APP_A_PERMS] = app_admin_perms
            self.permissions_groups[self.permission_manager.APP_A_PERMS] = app_admin_role
            self.all_permissions_groups.append(app_admin_role)

        return self.all_permissions_groups
