{% set CONDA_ENV_NAME = salt['environ.get']('CONDA_ENV_NAME') %}
{% set TETHYS_PERSIST = salt['environ.get']('TETHYS_PERSIST') %}
{% set CHANNEL_LAYERS_BACKEND = salt['environ.get']('CHANNEL_LAYERS_BACKEND') %}
{% set CHANNEL_LAYERS_CONFIG = salt['environ.get']('CHANNEL_LAYERS_CONFIG') %}

Set_Portal_Channels_Settings:
  cmd.run:
    - name: > 
        micromamba run -n {{ CONDA_ENV_NAME }} tethys settings
        --set CHANNEL_LAYERS.tribs.BACKEND {{ CHANNEL_LAYERS_BACKEND }}
        --set CHANNEL_LAYERS.tribs.CONFIG {{ CHANNEL_LAYERS_CONFIG }}
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_channels_setup_complete" ];"


Flag_Complete_Portal_Channels_Settings_Setup:
  cmd.run:
    - name: touch ${TETHYS_PERSIST}/tribs_channels_setup_complete
    - shell: /bin/bash