import logging
from importlib.metadata import entry_points

log = logging.getLogger(__name__)

ENTRY_POINT_GROUP = 'tribs.input_file_defaults'


def _deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base, returning base."""
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def discover_input_file_defaults() -> dict:
    """Discover input file default overrides from all installed plugins via entry points.

    Returns:
        Sparse dict mirroring the structure of tRIBSInput, suitable for Scenario.update_input_file.
    """
    defaults = {}
    eps = entry_points(group=ENTRY_POINT_GROUP)
    for ep in eps:
        try:
            plugin_defaults = ep.load()
            _deep_merge(defaults, plugin_defaults)
            log.info(f'Loaded input file defaults plugin: {ep.name} -> {plugin_defaults}')
        except Exception:
            log.exception(f'Failed to load input file defaults plugin: {ep.name}')
    return defaults


# Module-level singleton, populated once at import time
INPUT_FILE_DEFAULTS = discover_input_file_defaults()
