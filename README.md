# tRIBS Tethys App

A Tethys app for building tRIBS models for SRP studies.

## Dev Installation

1. Install libmamba and make it your default solver (see: [A Faster Solver for Conda: Libmamba](https://www.anaconda.com/blog/a-faster-conda-for-a-growing-community)):

    ```bash
    conda update -n base conda
    conda install -n base conda-libmamba-solver
    conda config --set solver libmamba
    ```

2. Clone Tethys and create an environment with Python 3.10 and Django 4.2 using conda:

    ```bash
    git clone https://github.com/tethysplatform/tethys.git
    cd tethys
    # IMPORTNANT: edit the environment.yml to force python=3.10 and django>=4.2,<5
    conda env create -n <ENV_NAME> -f environment.yml
    pip install -e .
    ```

    > **_NOTE:_** replace <ENV_NAME> with the name you want the environment to be called (e.g. tethys, tethys310).

3. Activate the Tethys environment:

    ```bash
    conda activate <ENV_NAME>
    ```

    > **_NOTE:_** replace <ENV_NAME> with the name gave the environment in Step 2.

4. Install PostGIS, GeoServer, and Redis using Docker:

    ```bash
    sudo docker run --name=tribs_postgis --env=POSTGRES_PASSWORD=mysecretpassword -p 5437:5432 -d postgis/postgis:12-2.5
    sudo docker run --name=tribs_geoserver --env=ENABLED_NODES=4 --env=REST_NODES=1 --env=NUM_CORES=4 --env=MAX_TIMEOUT=60 --env=MAX_MEMORY=1024 --env=MIN_MEMORY=512 -p 8081:8081 -p 8082:8082 -p 8083:8083 -p 8084:8084 -p 8181:8181 -d tethysplatform/geoserver:latest
    sudo docker run --name=srp_redis -p 6379:6379 -d redis:7
    ```

    > **_NOTE:_** if you have another PostGIS database bound to port 5437, you can change the first port number to something else, like 5438.

    > **_NOTE:_** the MAX_MEMORY and MIN_MEMORY parameters are per-core allocations (x4 if you have 4 node enabled). Adjust to your machine's capabilities.

5. Create the Tethys portal_config.yml and :

    ```bash
    tethys gen portal_config
    ```

6. Open the portal_config.yml using the path printed in the output from the previous command. Change the database settings to the following so that Tethys will use the PostGIS database. Also take this time to setup your media url and root:

    ```yaml
    settings:
      DATABASES:
        default:
          ENGINE: django.db.backends.postgresql
          USER: tethys_super
          PASSWORD: pass
          HOST: localhost
          PORT: 5437
          NAME: tethys_platform
      MEDIA_URL: '/media/'
      MEDIA_ROOT: '<path_to_app_workspaces_dir_in_app>'
      CHANNEL_LAYERS:
        tribs:
          BACKEND: channels_redis.core.RedisChannelLayer
          CONFIG:
            hosts:
            - [127.0.0.1, 6379]
    ```

    > **_NOTE:_** If you changed the port when you created the PostGIS docker container in step 3, change the PORT database setting in the portal_config.yml to match.



7. Initialize the Tethys Platform database:

    ```bash
    PGPASSWORD=mysecretpassword tethys db configure
    ```

8. Clone ATCore and install into the Tethys environment in development mode:

    ```bash
    git clone https://github.com/Aquaveo/tethysext-atcore.git
    # edit install.yml to force django>=4.2,<5
    cd tethysext-atcore
    tethys install -d
    cd ../
    ```

9. Install the [PDM dependency manager](https://pdm.fming.dev/latest/):

    ```bash
    pip install --user pdm
    ```

    > **_NOTE:_** if you have previously installed pdm in another environment, uninstall pdm first (`pip uninstall pdm`), and then reinstall as shown above with the new environment active.

10. Install Node Version Manager and Node.js:

    a. Install Node Version Manager (nvm): https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script

    b. CLOSE ALL OF YOUR TERMINALS AND OPEN NEW ONES

    c. Use NVM to install Node.js 20:

    ```bash
    nvm install 20
    nvm use 20
    ```

11. If after installing pdm you see warning messages that say "WARNING: The script dotenv is installed in '<some_path>' which is not on PATH.", do the following to add <some_path> to your PATH:

    a. Open your `~/.bashrc` file in a text editor and add the following line to the end of the file (replace <some_path> with the path from the warning messages):

    ```bash
    export PATH=<some_path>:$PATH
    ```

    b. Deactivate your Tethys environment and run the `~/.bashrc` script:

    ```bash
    conda deactivate
    source ~/.bashrc
    ```

13. Install GDAL libraries and the C/C++ compilers with Conda from conda-forge:

    ```bash
    conda install -c conda-forge libgdal cxx-compiler
    ```

12. Clone tribs-adapter and install into the Tethys environment in development mode:

    ```bash
    git clone git@github.com:Aquaveo/tribs-adapter.git
    cd tribs-adapter
    pdm install
    cd ../
    ```

    > **_NOTE:_** `pdm install` installs the package as an editable package and installs dependencies AND dev dependencies but NOT optional dependencies.

15. Clone tethysapp-tribs and install into the Tethys environment in development mode:

    ```bash
    git clone git@github.com:Aquaveo/tethysapp-tribs.git
    cd tethysapp-tribs
    pdm install
    npm install --include=dev
    cd ../
    ```

    > **_NOTE:_** `pdm install` installs the package as an editable package and installs dependencies AND dev dependencies but NOT optional dependencies.

16. Install SSH server and create development ssh key for condor to use:

    a. Install and start ssh server

    ```bash
    sudo apt install openssh-server
    sudo systemctl start ssh
    ```

    b. Create condor key named "condorkey" with password "tribs"

    ```bash
    ssh-keygen -t rsa -N tribs -f ~/.ssh/condorkey
    ```

    c. Add the public key to the authorized keys

    ```bash
    # if you don't have an authorized_keys file yet
    cp ~/.ssh/condorkey.pub ~/.ssh/authorized_keys

    # if you do, just cat condorkey.pub and copy it to a new line in authorized_keys
    cat ~/.ssh/condorkey.pub
    vim ~/.ssh/authorized_keys
    ```

    d. Verify that you can log in with ssh using the key. You should be prompted for the passkey, but not your user password.

    ```bash
    ssh -i ~/.ssh/condorkey -p 22 <youruser>@localhost
    
    # don't forget to logout of your ssh session
    exit
    ```

17. Set up HTCondor

    a. Install HTCondor: see https://htcondor.readthedocs.io/en/latest/getting-htcondor/install-linux-as-root.html

    b. Start HTCondor: see https://htcondor.readthedocs.io/en/latest/admin-manual/installation-startup-shutdown-reconfiguration.html

    c. Verify that HTCondor is running: see "Verifying a Single-Machine Installation" here: https://htcondor.readthedocs.io/en/latest/getting-htcondor/install-linux-as-root.html

    d. Create a symbolic link to your tethys conda environment Python for condor jobs to use:

    ```bash
    conda activate <ENV_NAME>
    sudo ln -s $(which python) /opt/tethys-python
    ```

18. Create a Cesium-Ion account and get an API key: see https://cesium.com/learn/cesiumjs-learn/cesiumjs-quickstart/

19. Start Tethys and Navigate to Admin Pages. 

    a. Create a SpatialDatasetService pointing to the GeoServer container

        * Name: <whatever_you_want>
        * Engine: GeoServer
        * Endpoint: http://localhost:8181/geoserver/rest/
        * Public_endpoint: http://<ip_address>:8181/geoserver/rest/
        * Apikey: 
        * Username: admin
        * Password: geoserver

    b. Create a PersitentStoreService pointing to the PostGIS database container

        * Name: <whatever_you_want>
        * Engine: PostgreSQL
        * Host: <ip_address>
        * Port: 5435
        * Username: tethys_super
        * Password: pass <or_password_set_when_setting_up_tethys>

    c. Create an HTCondorScheduler pointing to the HTCondor scheduler

        * Name: <whatever_you_want>
        * Host: localhost
        * Username: <youruser>
        * Password: 
        * Private key path: /home/<youruser>/.ssh/condorkey
        * Private key pass: tribs

    d. Go to the app settings and link the appropriate services to the service settings of the app and fill in the cesium API key setting with the key from step 17.

20. Run syncstores to intialize the persistent store:

    ```bash
    tethys manage syncstores tribs
    ```

21. Run the init command for the tribs app:

    ```bash
    tribs init http://admin:geoserver@localhost:8181/geoserver/rest/ postgresql://tethys_super:pass@localhost:5435/tribs_primary_db
    ```

## Development

The webpack dev server is configured to proxy the Tethys development server (see `webpack.config.js`). The app endpoint will be handled by the webpack development server and all other endpoints will be handled by the Tethys (Django) development server. As such, you will need to start both in separate terminals.

1. Start Tethys development server

    ```
    tethys manage start
    ```

2. Start webpack development server (in separate terminal)

    ```
    npm start
    ```

## PDM Tips

See below for more PDM tips like how to manage dependencies, install dependencies, and run scripts.

### Install only dev dependencies

* Install all dev dependencies (test & lint)

    ```bash
    pdm install -G:all
    ```

* Install only test dependencies

    ```bash
    pdm install -G test
    ```

* Install only lint and formatter dependencies

    ```bash
    pdm install -G lint
    ```

### Managing dependencies

* Add a new dependency:

1. Add the package using `pdm`:

    ```bash
    pdm add <package-name>
    ```

2. Manually add the dependency to the `install.yml`.

    > **_IMPORTANT:_** Dependencies are not automatically added to the `install.yml` yet!

* Add a new dev dependency:

    ```bash
    pdm add -dG test <package-name>
    pdm add -dG lint <package-name>
    ```

    > **_NOTE:_** Just use `pdm` to install and manage dev dependencies. The `install.yml` does not support dev dependencies, but they shouldn't be needed in it anyway, right?

* Add a new optional dependeny:

    ```bash
    pdm add -G <group-name> <package-name>
    ```

    > **_NOTE:_** You'll need to decide whether or not to add the optional dependencies to the `install.yml` b/c it does not support optional dependencies. You may consider using `pdm` to manage the optional dependencies.

* Remove a dependency:

1. Remove it from the `pyproject.yaml` and lock file:

    ```bash
    pdm remove --no-sync <package-name>
    ```

2. Manually remove it from the `install.yml`

3. If you want to remove it from the environment, use `pip` or `conda` to remove the package.

    > **_IMPORTANT:_** TL;DR: Running `pdm remove` without the `--no-sync` will remove nearly all of the dependencies in your environment. While `pdm remove` is capable of removing the package from the environment, running `pdm remove` without the `--no-sync` option can break your Tethys environment. This is because `pdm` will attempt to get the environment to match the dependencies listed in your `pyproject.toml`, which usually does not include all of the dependencies of Tethys.

### PDM Scripts

The project is configured with several PDM convenience scripts:

    ```bash
    # Run linter
    pdm run lint

    # Run formatter
    pdm run format

    # Run tests
    pdm run test

    # Run all checks
    pdm run all
    ```

## Formatting and Linting Manually

This package is configured to use yapf code formatting

1. Install lint dependencies:

    ```bash
    pdm install -G lint
    ```

2. Run code formatting from the project directory:

    ```bash
    yapf --in-place --recursive --verbose .

    # Short version
    yapf -ir -vv .
    ```

3. Run linter from the project directory:

    ```bash
    flake8 .
    ```

    > **_NOTE:_** The configuration for yapf and flake8 is in the `pyproject.toml`.

## Testing Manually

This package is configured to use pytest for testing

1. Install test dependencies:

    ```bash
    pdm install -G test
    ```

2. Run tests from the project directory:

    ```bash
    pytest
    ```

    > **_NOTE:_** The configuration for pytest and coverage is in the `pyproject.toml`.


## Build Node Modules

Webpack is configured to bundle and build the React app into the `tethysapp/<app_package>/public/frontend` directory. Before building a Python distribution for release, you should build using this command:

```
npm run build
```

## Test Node Modules

Use the following commands to lint and test the React portion of the app.

```
npm run lint
npm run test
```

The linting capability is powered by [eslint](https://eslint.org/) and a number of plugins for React. The testing capabilities include [jest](https://jestjs.io/), [jsdom](https://github.com/jsdom/jsdom#readme), [testing-framework](https://testing-library.com/), [user-event](https://testing-library.com/docs/user-event/intro/), and a few other JavaScript testing utilties to make it easy to test the frontend of the React-Tethys app.

## Acknowledgements

The React + Django implementation is based on the excellent work done by @Jitensid that can be found on GitHub here: [Jitensid/django-webpack-dev-server](https://github.com/Jitensid/django-webpack-dev-server).