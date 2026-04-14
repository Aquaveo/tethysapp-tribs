import logging
from importlib.metadata import entry_points

log = logging.getLogger(__name__)

ENTRY_POINT_GROUP = 'tribs.workflows'


def discover_workflows() -> dict:
    """Discover all installed workflow plugins via entry points."""
    workflows = {}
    eps = entry_points(group=ENTRY_POINT_GROUP)
    for ep in eps:
        try:
            workflow_class = ep.load()
            workflows[workflow_class.TYPE] = workflow_class
            log.info(f'Loaded workflow plugin: {ep.name} -> {workflow_class.__name__}')
        except Exception:
            log.exception(f'Failed to load workflow plugin: {ep.name}')
    return workflows


# Module-level singleton, populated once at import time
TRIBS_WORKFLOWS = discover_workflows()
