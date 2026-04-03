#!/opt/tethys-python
import sys
import traceback
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tribs_adapter.resources import Scenario, Realization


def run(workflow, resource_db_url, resource_id, resource_type):
    resource_db_session = None

    try:
        # Get resource
        resource_db_engine = create_engine(resource_db_url)
        make_resource_db_session = sessionmaker(bind=resource_db_engine)
        resource_db_session = make_resource_db_session()
        _Resource = Scenario if resource_type == Scenario.TYPE else Realization
        resource = resource_db_session.query(_Resource).get(resource_id)

        status_success = False

        # Get status for upload keys
        if workflow == 'upload':
            upload_status = resource.get_status(_Resource.UPLOAD_STATUS_KEY, None)

            upload_status_ok = upload_status in _Resource.OK_STATUSES

            status_success = upload_status_ok

        # Set root status accordingly
        if status_success:
            resource.set_status(_Resource.ROOT_STATUS_KEY, _Resource.STATUS_SUCCESS)
        else:
            resource.set_status(_Resource.ROOT_STATUS_KEY, _Resource.STATUS_FAILED)

        resource_db_session.commit()
    except Exception as e:
        sys.stderr.write('Error processing {0}'.format(resource_id))
        sys.stderr.write(str(e))
        traceback.print_exc(file=sys.stderr)
    finally:
        resource_db_session and resource_db_session.close()


if __name__ == '__main__':
    args = sys.argv
    args.pop(0)
    sys.stdout.write(f'Args: {args}\n')
    run(*args)
