{% set TETHYS_PERSIST = salt['environ.get']('TETHYS_PERSIST') %}
{% set HOME_ENV_ASGI_SUPERVISOR = salt['environ.get']('HOME_ENV_ASGI_SUPERVISOR') %}

#This line solves the error of asyncpg to be looking for the HOME path at /root. This causes ayncpg to try to do ssl verificatiion which will cause an error
PATCH_asgi_supervisord_env_variables:
  cmd.run:
    - name: >
        sed -i '/^environment=$/{N;s#\(^environment=\)\n[ \t]*\(TETHYS_HOME=.*\)#\1\2,HOME="{{ HOME_ENV_ASGI_SUPERVISOR }}"#}' ${TETHYS_PERSIST}/asgi_supervisord.conf
    - shell: /bin/bash
    - unless: >
        /bin/bash -c 'grep -q "HOME=\"{{ HOME_ENV_ASGI_SUPERVISOR }}\"" ${TETHYS_PERSIST}/asgi_supervisord.conf || [ -f "${TETHYS_PERSIST}/tribs_post_patches_setup_complete" ]'

Flag_Post_Patches_Complete_Setup:
  cmd.run:
    - name: touch ${TETHYS_PERSIST}/tribs_post_patches_setup_complete
    - shell: /bin/bash