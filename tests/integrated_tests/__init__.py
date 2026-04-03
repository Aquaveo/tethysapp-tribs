import os
# NOTE: database user given must be a superuser to successfully execute all tests.
default_connection = 'postgresql://postgres:mysecretpassword@localhost:5435/tribsapp_tests'
TEST_DB_URL = os.environ.get('TRIBSAPP_TEST_DATABASE', default_connection)  # noqa: F401, F403
