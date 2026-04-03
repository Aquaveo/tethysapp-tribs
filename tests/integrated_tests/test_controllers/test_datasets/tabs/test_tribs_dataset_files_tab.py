# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
import os

from tethysapp.tribs.controllers.datasets.tabs.tribs_dataset_files_tab import TribsDatasetFilesTab


def test_files_tab(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)
    resource_datasets = scenario_with_project_with_fdb.linked_datasets

    # sort the list, to be sure that we have all the datasets accounted for in our test
    resource_datasets_sorted = sorted(resource_datasets, key=lambda obj: obj.name)

    assert len(resource_datasets_sorted) > 0

    mtsi_controller = TribsDatasetFilesTab()
    file_collections = mtsi_controller.get_file_collections(
        request=mock_request,
        resource=resource_datasets_sorted[0],
        session=db_session,
    )

    assert file_collections, [resource_datasets_sorted[0].file_collection_client]
