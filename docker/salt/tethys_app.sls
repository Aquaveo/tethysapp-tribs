{% set ALLOWED_HOST = salt['environ.get']('ALLOWED_HOST') %}
{% set CONDA_ENV_NAME = salt['environ.get']('CONDA_ENV_NAME') %}
{% set TETHYS_HOME = salt['environ.get']('TETHYS_HOME') %}
{% set TETHYS_PERSIST = salt['environ.get']('TETHYS_PERSIST') %}
{% set TETHYSAPP_DIR = salt['environ.get']('TETHYSAPP_DIR') %}
{% set APP_DB_HOST = salt['environ.get']('APP_DB_HOST') %}
{% set APP_DB_PORT = salt['environ.get']('APP_DB_PORT') %}
{% set APP_DB_USERNAME = salt['environ.get']('APP_DB_USERNAME') %}
{% set APP_DB_PASSWORD = salt['environ.get']('APP_DB_PASSWORD') %}

{% set TETHYS_GS_HOST = salt['environ.get']('TETHYS_GS_HOST') %}
{% set TETHYS_GS_PASSWORD = salt['environ.get']('TETHYS_GS_PASSWORD') %}
{% set TETHYS_GS_PORT = salt['environ.get']('TETHYS_GS_PORT') %}
{% set TETHYS_GS_USERNAME = salt['environ.get']('TETHYS_GS_USERNAME') %}
{% set TETHYS_GS_PROTOCOL = salt['environ.get']('TETHYS_GS_PROTOCOL') %}

{% set TETHYS_GS_HOST_PUB = salt['environ.get']('TETHYS_GS_HOST_PUB') %}
{% set TETHYS_GS_PORT_PUB = salt['environ.get']('TETHYS_GS_PORT_PUB') %}
{% set TETHYS_GS_PROTOCOL_PUB = salt['environ.get']('TETHYS_GS_PROTOCOL_PUB') %}
{% set TETHYS_GS_HOST_PUB = salt['environ.get']('TETHYS_GS_HOST_PUB') %}

# Using this for the production spatial service, so the port will not be included in the public endpoint
{% set PORT_SEPARATOR = salt['environ.get']('PORT_SEPARATOR') %}

{% set TETHYS_CLUSTER_IP = salt['environ.get']('TETHYS_CLUSTER_IP') %}
{% set TETHYS_CLUSTER_USERNAME = salt['environ.get']('TETHYS_CLUSTER_USERNAME') %}
{% set TETHYS_CLUSTER_PKEY_FILE = salt['environ.get']('TETHYS_CLUSTER_PKEY_FILE') %}
{% set TETHYS_CLUSTER_PKEY_PASSWORD = salt['environ.get']('TETHYS_CLUSTER_PKEY_PASSWORD') %}
{% set CLIENT_MAX_BODY_SIZE = salt['environ.get']('CLIENT_MAX_BODY_SIZE') %}
{% set DATA_UPLOAD_MAX_MEMORY_SIZE = salt['environ.get']('DATA_UPLOAD_MAX_MEMORY_SIZE') %}
{% set FILE_UPLOAD_MAX_MEMORY_SIZE = salt['environ.get']('FILE_UPLOAD_MAX_MEMORY_SIZE') %}
{% set NGINX_PORT = salt['environ.get']('NGINX_PORT') %}
{% set TETHYS_PORT = salt['environ.get']('TETHYS_PORT') %}
{% set CESIUM_API_KEY = salt['environ.get']('CESIUM_API_KEY') %}
{% set MEDIA_ROOT = salt['environ.get']('MEDIA_ROOT') %}
{% set MULTIPLE_APP_MODE = salt['environ.get']('MULTIPLE_APP_MODE') %}
{% set STANDALONE_APP = salt['environ.get']('STANDALONE_APP') %}

{% set PS_SERVICE_NAME = 'tethys_postgis' %}
{% set GS_SERVICE_NAME = 'tethys_geoserver' %}

Pre_tRIBS_Settings:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys settings --get
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Set_Portal_Config_Settings:
  cmd.run:
    - name: > 
        micromamba run -n {{ CONDA_ENV_NAME }} tethys settings
        --set FILE_UPLOAD_MAX_MEMORY_SIZE {{ FILE_UPLOAD_MAX_MEMORY_SIZE }}
        --set DATA_UPLOAD_MAX_MEMORY_SIZE {{ DATA_UPLOAD_MAX_MEMORY_SIZE }}
        --set MEDIA_ROOT {{ MEDIA_ROOT }}
        --set MULTIPLE_APP_MODE {{ MULTIPLE_APP_MODE }}
        --set STANDALONE_APP {{ STANDALONE_APP }}
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Sync_Apps:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys db sync
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Remove_Persistent_Stores_Database:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys services remove persistent {{ PS_SERVICE_NAME }} -f
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Create_Persistent_Stores_Database:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys services create persistent -n {{ PS_SERVICE_NAME }} -c {{ APP_DB_USERNAME }}:{{ APP_DB_PASSWORD }}@{{ APP_DB_HOST }}:{{ APP_DB_PORT }}"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Remove_Schedulers:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys schedulers remove -f remote_cluster"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Create_Schedulers:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys schedulers create-condor -n remote_cluster -e ${TETHYS_CLUSTER_IP} -u ${TETHYS_CLUSTER_USERNAME} -f ${TETHYS_CLUSTER_PKEY_FILE} -k ${TETHYS_CLUSTER_PKEY_PASSWORD}"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Remove_Spatial_Dataset_Service:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys services remove spatial {{ GS_SERVICE_NAME }} -f
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Create_Spatial_Dataset_Service:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys services create spatial -n {{ GS_SERVICE_NAME }} -c {{ TETHYS_GS_USERNAME }}:{{ TETHYS_GS_PASSWORD }}@{{ TETHYS_GS_PROTOCOL }}://{{ TETHYS_GS_HOST }}:{{ TETHYS_GS_PORT }} -p {{ TETHYS_GS_PROTOCOL_PUB }}://{{ TETHYS_GS_HOST_PUB }}{{ PORT_SEPARATOR }}{{ TETHYS_GS_PORT_PUB }}"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Link_Persistent_Stores_Database:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys link persistent:{{ PS_SERVICE_NAME }} tribs:ps_database:primary_db"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Link_Schedulers:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys link condor:remote_cluster tribs:ss_scheduler:remote_cluster"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Link_Spatial_Dataset_Service:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tethys link spatial:{{ GS_SERVICE_NAME }} tribs:ds_spatial:primary_geoserver"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Sync_App_Persistent_Stores:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys syncstores all
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Set_Cesium_Api_Key_Setting:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys app_settings set tribs Cesium_API_Key {{ CESIUM_API_KEY }}
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Init_tRIBS:
  cmd.run:
    - name: "micromamba run -n {{ CONDA_ENV_NAME }} tribs init {{ TETHYS_GS_PROTOCOL }}://{{ TETHYS_GS_USERNAME }}:{{ TETHYS_GS_PASSWORD }}@{{ TETHYS_GS_HOST }}:{{ TETHYS_GS_PORT }}/geoserver/rest postgresql://{{ APP_DB_USERNAME }}:{{ APP_DB_PASSWORD }}@{{ APP_DB_HOST }}:{{ APP_DB_PORT }}/tribs_primary_db"
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Make_Key_Directory:
  cmd.run:
    - name: mkdir -p {{ TETHYS_PERSIST }}/keys
    - shell: /bin/bash
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tribs_setup_complete" ];"

Copy_Condor_Key:
  cmd.run:
    - name: ls /tmp/keys && cp /tmp/keys/condorkey-root ${TETHYS_CLUSTER_PKEY_FILE} && chown www-data ${TETHYS_CLUSTER_PKEY_FILE}
    - shell: /bin/bash
    - onlyif: /bin/bash -c "[ -f "/tmp/keys/condorkey-root" ];"
    - unless: /bin/bash -c "[ -f "${TETHYS_CLUSTER_PKEY_FILE}" ];"

PATCH_Generate_NGINX_Settings_TethysCore:
  cmd.run:
    - name: >
        micromamba run -n {{ CONDA_ENV_NAME }} tethys gen nginx
        --tethys-port {{ TETHYS_PORT }}
        --client-max-body-size {{ CLIENT_MAX_BODY_SIZE }}
        --web-server-port {{ NGINX_PORT }}
        --overwrite
    - unless: /bin/bash -c "[ -f "{{ TETHYS_PERSIST }}/tribs_setup_complete" ];"


PATCH_Site_Settings_Appearance_ATcore:
  cmd.run:
    - name: >
        micromamba run -n {{ CONDA_ENV_NAME }} tethys site -d &&
        micromamba run -n {{ CONDA_ENV_NAME }} tethys site --copyright "Copyright © 2024 Aquaveo, LLC"
    - unless: /bin/bash -c "[ -f "{{ TETHYS_PERSIST }}/tribs_setup_complete" ];"

Post_tRIBS_Settings:
  cmd.run:
    - name: micromamba run -n {{ CONDA_ENV_NAME }} tethys settings --get
    - shell: /bin/bash

Post_tRIBS_Environment_Check:
  cmd.run:
    - name: micromamba list -n {{ CONDA_ENV_NAME }} ; micromamba run -n {{ CONDA_ENV_NAME }} python -m pip list
    - shell: /bin/bash

Flag_Complete_Setup:
  cmd.run:
    - name: touch ${TETHYS_PERSIST}/tribs_setup_complete
    - shell: /bin/bash