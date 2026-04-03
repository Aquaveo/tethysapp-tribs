import os
import logging
from contextlib import contextmanager


def print_error(statement):
    print('{}{}{}'.format('\033[91m', statement, '\033[0m'))


def print_success(statement):
    print('{}{}{}'.format('\033[92m', statement, '\033[0m'))


def print_warning(statement):
    print('{}{}{}'.format('\033[93m', statement, '\033[0m'))


def print_info(statement):
    print('{}{}{}'.format('\033[94m', statement, '\033[0m'))


def print_header(statement):
    print('{}{}{}'.format('\033[95m', statement, '\033[0m'))


class PGPassManager(object):
    def __init__(self):
        self.path = self.get_path()
        self.content = self.get_content()

    @staticmethod
    def get_path():
        this_usr_dir = os.path.expanduser('~/')
        return os.path.join(this_usr_dir, '.pgpass')

    def get_content(self):
        pg_pass_content = ''

        if os.path.exists(self.path):
            with open(self.path, 'r') as f:
                pg_pass_content = f.read()

        return pg_pass_content

    def restore_content(self):
        with open(self.path, 'w+') as f:
            f.write(self.content)

    def add_entry_if_not_exists(self, host, port, db_name, username, password):
        entry = '{}:{}:{}:{}:{}'.format(host, port, db_name, username, password)
        if entry not in self.content:
            with open(self.path, 'a') as f:
                f.write(entry)
                f.write('\n')


@contextmanager
def all_logging_disabled(highest_level=logging.CRITICAL):
    """
    A context manager that will prevent any logging messages
    triggered during the body from being processed.
    :param highest_level: the maximum logging level in use.
      This would only need to be changed if a custom level greater than CRITICAL
      is defined.
    """
    # two kind-of hacks here:
    #    * can't get the highest logging level in effect => delegate to the user
    #    * can't get the current module-level override => use an undocumented
    #       (but non-private!) interface

    previous_level = logging.root.manager.disable

    logging.disable(highest_level)

    try:
        yield
    finally:
        logging.disable(previous_level)
