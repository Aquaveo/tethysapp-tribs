FROM node:20 as node-builder

ARG TETHYS_PORTAL_HOST=""
ARG TETHYS_APP_ROOT_URL="/"
ARG TETHYS_LOADER_DELAY="500"
ARG TETHYS_DEBUG_MODE="false"

ENV APP_SRC_ROOT=/app
ENV DEV_REACT_CONFIG="${APP_SRC_ROOT}/reactapp/config/development.env"
ENV PROD_REACT_CONFIG="${APP_SRC_ROOT}/reactapp/config/production.env"
ENV EARTHDATA_USERNAME=""
ENV EARTHDATA_PASSWORD=""

ADD . ${APP_SRC_ROOT}

# Set the working directory
WORKDIR ${APP_SRC_ROOT}

###############
# REACT BUILD #
###############

# Setup .env rename the development.env to production.env and then set env properties from build args
RUN mv ${DEV_REACT_CONFIG} ${PROD_REACT_CONFIG} \
  && sed -i "s#TETHYS_DEBUG_MODE.*#TETHYS_DEBUG_MODE = ${TETHYS_DEBUG_MODE}#g" ${PROD_REACT_CONFIG} \
  && sed -i "s#TETHYS_LOADER_DELAY.*#TETHYS_LOADER_DELAY = ${TETHYS_LOADER_DELAY}#g" ${PROD_REACT_CONFIG} \
  && sed -i "s#TETHYS_PORTAL_HOST.*#TETHYS_PORTAL_HOST = ${TETHYS_PORTAL_HOST}#g" ${PROD_REACT_CONFIG} \
  && sed -i "s#TETHYS_APP_ROOT_URL.*#TETHYS_APP_ROOT_URL = ${TETHYS_APP_ROOT_URL}#g" ${PROD_REACT_CONFIG}

# Build React frontend
RUN npm install \
  && npm run build-low-mem

FROM aquaveollc/tethysext-atcore:1.15.1-ty4.4.3-py3.10-dj4.2

ARG DJANGO_VERSION=4.2.*

###############################
# DEFAULT ENVIRONMENT VARIABLES
###############################
ENV TETHYS_CLUSTER_IP=172.17.0.1
ENV TETHYS_CLUSTER_USERNAME=condor
ENV TETHYS_CLUSTER_PKEY_FILE=${TETHYS_PERSIST}/keys/condorkey
ENV TETHYS_CLUSTER_PKEY_PASSWORD=please_dont_use_default_passwords
ENV TETHYS_GS_PROTOCOL=http
ENV TETHYS_GS_HOST=172.17.0.1
ENV TETHYS_GS_PORT=8181
ENV TETHYS_GS_PROTOCOL_PUB=https
ENV TETHYS_GS_HOST_PUB=172.17.0.1
ENV TETHYS_GS_PORT_PUB=443
ENV PORT_SEPARATOR=":"
ENV TETHYS_GS_USERNAME=admin
ENV TETHYS_GS_PASSWORD=geoserver
ENV APP_DB_HOST=${TETHYS_DB_HOST}
ENV APP_DB_PORT=${TETHYS_DB_PORT}
ENV APP_DB_USERNAME=${TETHYS_DB_USERNAME}
ENV APP_DB_PASSWORD=${TETHYS_DB_PASSWORD}
ENV CONDORPY_HOME=${TETHYS_HOME}/tethys
ENV CONDOR_PROJ_LIB="/opt/conda/envs/tethys/share/proj/"
ENV NUMBA_CACHE_DIR=${TETHYS_HOME}/.numba
ENV FILE_UPLOAD_MAX_MEMORY_SIZE="1073741824"
ENV DATA_UPLOAD_MAX_MEMORY_SIZE="1073741824"
ENV CLIENT_MAX_BODY_SIZE="1G"
ENV NGINX_PORT=8080
ENV BING_API_KEY=""
ENV RECAPTCHA_PUBLIC_KEY=""
ENV RECAPTCHA_PRIVATE_KEY=""
ENV PDM="/root/.local/bin/pdm"
ENV OTHER_SETTINGS="--set ENABLE_CAPTCHA True --set DATA_UPLOAD_MAX_NUMBER_FIELD 10000"
ENV APP_SRC_ROOT=${TETHYSAPP_DIR}/tethysapp-tribs
ENV AQUAPI_URL="https://aquapi.aquaveo.com/aquaveo/stable/"
ENV PIP_CONFIG_FILE=$HOME/.config/pip/pip.conf
ENV FDB_ROOT_DIR="/fdbs"
ENV CONDOR_FDB_ROOT_DIR=${FDB_ROOT_DIR}

#########
# SETUP #
#########
# Speed up APT installs
RUN echo "force-unsafe-io" > /etc/dpkg/dpkg.cfg.d/02apt-speedup \
  && echo "Acquire::http {No-Cache=True;};" > /etc/apt/apt.conf.d/no-cache \
  && echo "Acquire::Check-Valid-Until false;" > /etc/apt/apt.conf.d/no-check-valid

# Install APT Package
RUN apt-get update -qq && apt-get upgrade -yqq > /dev/null && apt-get install -yqq --no-install-recommends \
  apt-transport-https build-essential ca-certificates curl git libssl-dev wget \
  && rm -rf /var/lib/apt/lists/*

# Quiet pip installs
RUN mkdir -p $HOME/.config/pip && echo "[global]\nquiet = True\nindex-url = $AQUAPI_URL" > $HOME/.config/pip/pip.conf

# Numba cache dir setup
RUN mkdir -p "${NUMBA_CACHE_DIR}" \
  && chown -R www: "${NUMBA_CACHE_DIR}" \
  && chmod -R 777 ${NUMBA_CACHE_DIR}

RUN micromamba remove -n tethys git -y

########################
# INSTALL DEPENDENCIES #
########################
ARG MAMBA_DOCKERFILE_ACTIVATE=1

RUN micromamba run -n ${CONDA_ENV_NAME} python --version

# Install pdm
RUN pip install --user pdm \
  && ${PDM} self update

# Install conda dependencies
ADD --chown=www:www conda-lock.yml /tmp/conda-lock.yml

# Remove the old version of tethys-dataset-services that is installed by Tethys (it will be reinstalled from conda-lock.yml)
# Note, this can probably be removed once there is a Tethys version that includes the updated tethys-dataset-services
RUN micromamba remove -y -n ${CONDA_ENV_NAME} tethys_dataset_services \
  && /bin/bash -c "cd /tmp/ && micromamba install -q -y -n ${CONDA_ENV_NAME} -f conda-lock.yml" \
  && micromamba install -c conda-forge 'numpy<2.0.0'

# TDS is 2.3.0 right here
RUN micromamba list -n ${CONDA_ENV_NAME} tethys_dataset_services && micromamba run -n ${CONDA_ENV_NAME} pip show tethys_dataset_services

##############
# ADD SOURCE #
##############

ADD --chown=www:www . ${APP_SRC_ROOT}

# Set the working directory
WORKDIR ${APP_SRC_ROOT}

# Mark git safe directory and ignore changes caused by .dockerignore
RUN git config --global --add safe.directory '*' \
  && git update-index --assume-unchanged ${APP_SRC_ROOT}/tribs-adapter

# Copy React build from node-builder stage
COPY --chown=www:www --from=node-builder /app/tethysapp/tribs/public/project-editor ${APP_SRC_ROOT}/tethysapp/tribs/public/project-editor
RUN ls -la ${APP_SRC_ROOT}/tethysapp/tribs/public/project-editor

###############
# APP INSTALL #
###############
# Install tribs-adapter and tethysapp-tribs
RUN /bin/bash -c "cd ${APP_SRC_ROOT} \
  && cd ${APP_SRC_ROOT}/tribs-adapter \
  && ${PDM} install --no-editable --production \
  && cd ${APP_SRC_ROOT} \
  && ${PDM} install --no-editable --production"

RUN pip install 'shapely>=2.0.0'

#########
# CHOWN #
#########
RUN export NGINX_USER=$(grep 'user .*;' /etc/nginx/nginx.conf | awk '{print $2}' | awk -F';' '{print $1}') && \
  find ${TETHYSAPP_DIR} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {} && \
  find ${TETHYSEXT_DIR} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {} && \
  find ${TETHYS_PERSIST} ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {} && \
  find ${TETHYS_HOME}/keys ! -user ${NGINX_USER} -print0 | xargs -0 -I{} chown ${NGINX_USER}: {} && \
  chown -R ${NGINX_USER}:${NGINX_USER} ${CONDA_HOME}/envs/${CONDA_ENV_NAME}

#########################
# CONFIGURE ENVIRONMENT #
#########################
EXPOSE 80

################
# COPY IN SALT #
################
ADD docker/salt/ /srv/salt/

# Changing workdir
WORKDIR ${TETHYS_HOME}

#######
# RUN #
#######
CMD bash run.sh
