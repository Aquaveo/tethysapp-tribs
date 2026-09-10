# """
# ********************************************************************************
# * Name: test_tribs_project_details.py
# * Author: EJones
# * Created On: Nov 2, 2023
# * Copyright: (c) Aquaveo 2023
# ********************************************************************************
# """
import os
import filecmp
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from pytest_unordered import unordered

from tethysapp.tribs.controllers.realizations.tabs.tribs_realization_datasets_tab import TribsRealizationDatasetsTab
from tests.utilities.write_test_data import write_test_data_to_file


def test_datasets_get_resources(
    db_session,
    mock_request,
    project_with_fdb,
    scenario_with_project_with_fdb,
    test_files,
    tmp_path,
):
    salas_in_file = os.path.join(test_files, 'controllers', 'realizations', 'SALAS', 'salas.in')
    scenario_with_project_with_fdb.init(project_with_fdb, 26913, salas_in_file)

    mtpd_controller = TribsRealizationDatasetsTab()
    resource_datasets = mtpd_controller.get_resources(
        request=mock_request,
        resource=scenario_with_project_with_fdb,
        session=db_session,
    )

    # sort the list, to be sure that we have all the datasets accounted for in our test
    resource_datasets_sorted = sorted(resource_datasets, key=lambda obj: obj.name)

    summary_file_out = os.path.join(
        tmp_path, 'controllers', 'realizations', 'tabs', 'datasets_get_resources', 'out.txt'
    )
    os.makedirs(os.path.dirname(summary_file_out))
    summary_file_base = os.path.join(
        test_files, 'controllers', 'realizations', 'tabs', 'datasets_get_resources', 'base.txt'
    )
    with open(summary_file_out, 'w+') as fp:
        write_test_data_to_file(resource_datasets_sorted, fp)

    assert filecmp.cmp(summary_file_base, summary_file_out, shallow=False) != 0


def test_get_href_for_resource(
    project_with_fdb,
    mocker,
):
    mock_reverse = mocker.patch('tethysapp.tribs.controllers.tabs.datasets_tab.reverse')

    mtpd_controller = TribsRealizationDatasetsTab()
    mtpd_controller.get_href_for_resource(
        app_namespace='tribs',
        resource=project_with_fdb,
    )
    mock_reverse.assert_called_with('tribs:tribs_dataset_details_tab', args=[project_with_fdb.id, 'summary'])


def _exported_files(export_dir):
    """Relative paths of every file under export_dir, as they would appear in a zip."""
    return [
        os.path.relpath(os.path.join(root, name), export_dir) for root, _dirs, names in os.walk(export_dir)
        for name in names
    ]


def test_download_all(db_session, mock_request, complete_project, tmp_path):
    realization = complete_project.scenarios[0].realizations[0]

    # The adapter tests verify what export writes; here we verify the zip mirrors it
    export_dir = tmp_path / 'export'
    realization.export(export_dir)
    expected_files = _exported_files(export_dir)
    assert 'salas.in' in expected_files
    assert 'Output/hyd/salas.cntrl' in expected_files

    controller = TribsRealizationDatasetsTab()
    response = controller.download_all(request=mock_request, resource=realization, session=db_session)

    assert response.status_code == 200
    assert response['Content-Type'] == 'application/zip'
    assert response['Content-Disposition'] == f'attachment; filename="{realization.name}.zip"'

    with ZipFile(BytesIO(response.content)) as zf:
        assert zf.namelist() == unordered(expected_files)
        assert zf.testzip() is None


def test_download_all_excludes_visualization_dirs(db_session, mock_request, complete_project):
    realization = complete_project.scenarios[0].realizations[0]

    # Simulate generated visualization artifacts stored alongside an output dataset
    dataset = realization.linked_datasets[0]
    collection_dir = Path(dataset.file_collection_client.path)
    for excluded in TribsRealizationDatasetsTab.exclude_dirs:
        (collection_dir / excluded).mkdir()
        (collection_dir / excluded / f'layer.{excluded}').write_text('generated')

    controller = TribsRealizationDatasetsTab()
    response = controller.download_all(request=mock_request, resource=realization, session=db_session)

    with ZipFile(BytesIO(response.content)) as zf:
        names = zf.namelist()
    assert names
    for excluded in TribsRealizationDatasetsTab.exclude_dirs:
        assert not any(f'/{excluded}/' in name for name in names)


def test_download_all_calls_export(db_session, mock_request, mock_resource, mocker):
    mock_resource.name = 'Mock Realization'
    mock_zip_response = mocker.patch.object(TribsRealizationDatasetsTab, '_zip_response', return_value='response')

    controller = TribsRealizationDatasetsTab()

    def fake_export(directory, with_datasets):
        Path(directory, 'salas.in').write_text('fake input file')

    mock_resource.export.side_effect = fake_export

    response = controller.download_all(request=mock_request, resource=mock_resource, session=db_session)

    assert response == 'response'
    mock_resource.export.assert_called_once()
    assert mock_resource.export.call_args.kwargs == {'with_datasets': True}
    files, zip_name = mock_zip_response.call_args.args
    assert zip_name == 'Mock Realization.zip'
    assert [arcname for _abs_path, arcname in files] == ['salas.in']
