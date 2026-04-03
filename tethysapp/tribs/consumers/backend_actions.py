from enum import auto, unique

from strenum import StrEnum  # TODO: Replace with built-in StrEnum when upgrade to >= Python 3.11


@unique
class BackendActions(StrEnum):
    DATASET_DATA = auto()
    DATASET_DUPLICATE = auto()
    DATASET_CREATE = auto()
    DATASET_UPDATE = auto()
    DATASET_DELETE = auto()
    DATASET_GET_PIXEL_TIMESERIES = auto()
    DATASET_GET_MRF_OR_RFT_TIMESERIES = auto()
    DATASET_PROCESSING_PROGRESS = auto()
    MESSAGE_AKNOWLEDGE = auto()
    MESSAGE_ERROR = auto()
    PROJECT_DATA = auto()
    PROJECT_UPDATE = auto()
    REALIZATION_DATA = auto()
    REALIZATION_UPDATE = auto()
    REALIZATION_DELETE = auto()
    SCENARIO_DATA = auto()
    SCENARIO_CREATE = auto()
    SCENARIO_UPDATE = auto()
    SCENARIO_DELETE = auto()
    SCENARIO_DUPLICATE = auto()
    SCENARIO_UPDATE_INPUTFILE = auto()
    SCENARIO_LINK_DATASET = auto()
    SCENARIO_UNLINK_DATASET = auto()
    UPLOAD_FILE = auto()
    UPLOAD_FILE_PROGRESS = auto()
    UPLOAD_FILE_COMPLETE = auto()
    WORKFLOW_DATA = auto()
    WORKFLOW_DATA_ALL = auto()
    WORKFLOW_CREATE = auto()
    WORKFLOW_UPDATE = auto()
    WORKFLOW_DELETE = auto()
    WORKFLOW_DUPLICATE = auto()
