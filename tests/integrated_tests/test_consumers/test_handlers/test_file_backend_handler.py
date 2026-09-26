import base64
import uuid
import zipfile
from unittest import mock
from aiopath import AsyncPath
import pytest

from tethysapp.tribs.consumers.backend_actions import BackendActions


def _upload_data(**overrides):
    """Build a single-chunk UPLOAD_FILE payload, overridable per test."""
    data = {
        'forActionId': str(uuid.uuid4()),
        'currFile': 1,
        'numFiles': 1,
        'currChunk': 1,
        'numChunks': 1,
        'currFileName': 'hello.txt',
        'fileNames': ['hello.txt'],
        'chunk': base64.b64encode(b'hello world').decode(),
    }
    data.update(overrides)
    return data


def _make_zip(zip_path, entries):
    """Create a zip file at ``zip_path`` with the given {arcname: content} entries."""
    with zipfile.ZipFile(zip_path, 'w') as zf:
        for arcname, content in entries.items():
            zf.writestr(arcname, content)
    return zip_path


@pytest.mark.asyncio
async def test_extract_zip_files_benign(fbh, tmp_path):
    """A well-formed zip extracts its members inside the target directory."""
    target_dir = tmp_path / 'target'
    target_dir.mkdir()
    zip_path = _make_zip(target_dir / 'good.zip', {'salas/input.txt': 'ok', 'notes.txt': 'ok'})

    await fbh.extract_zip_files(uploaded_files=[AsyncPath(zip_path)], target_dir=AsyncPath(target_dir))

    assert (target_dir / 'salas' / 'input.txt').read_text() == 'ok'
    assert (target_dir / 'notes.txt').read_text() == 'ok'
    # The extracted zip itself is removed
    assert not zip_path.exists()


@pytest.mark.asyncio
async def test_extract_zip_files_traversal_blocked(fbh, tmp_path):
    """A zip with a ../ entry is rejected and nothing is written outside the target."""
    target_dir = tmp_path / 'target'
    target_dir.mkdir()
    zip_path = _make_zip(target_dir / 'evil.zip', {'../../evil.txt': 'pwned'})

    with pytest.raises(ValueError) as exc:
        await fbh.extract_zip_files(uploaded_files=[AsyncPath(zip_path)], target_dir=AsyncPath(target_dir))

    assert 'Path Traversal' in str(exc.value)
    # The traversal target must not have been created anywhere outside the target dir
    assert not (tmp_path / 'evil.txt').exists()


@pytest.mark.asyncio
async def test_extract_zip_files_absolute_member_blocked(fbh, tmp_path):
    """A zip with an absolute-path entry is rejected."""
    target_dir = tmp_path / 'target'
    target_dir.mkdir()
    abs_target = tmp_path / 'abs_evil.txt'
    zip_path = _make_zip(target_dir / 'abs.zip', {str(abs_target): 'pwned'})

    with pytest.raises(ValueError) as exc:
        await fbh.extract_zip_files(uploaded_files=[AsyncPath(zip_path)], target_dir=AsyncPath(target_dir))

    assert 'Path Traversal' in str(exc.value)
    assert not abs_target.exists()


@pytest.mark.asyncio
async def test_extract_zip_files_traversal_extracts_nothing(fbh, tmp_path):
    """A benign member ahead of a malicious one must not be written (validate-then-extract)."""
    target_dir = tmp_path / 'target'
    target_dir.mkdir()
    zip_path = _make_zip(
        target_dir / 'mixed.zip',
        {
            'safe.txt': 'ok',
            '../../escape.txt': 'pwned'
        },
    )

    with pytest.raises(ValueError):
        await fbh.extract_zip_files(uploaded_files=[AsyncPath(zip_path)], target_dir=AsyncPath(target_dir))

    # Nothing extracted: the safe member listed before the malicious one is not written either
    assert not (target_dir / 'safe.txt').exists()
    assert not (tmp_path / 'escape.txt').exists()


@pytest.mark.asyncio
async def test_extract_zip_files_non_zip_left_in_place(fbh, tmp_path):
    """Non-zip uploads are left untouched."""
    target_dir = tmp_path / 'target'
    target_dir.mkdir()
    plain = target_dir / 'plain.txt'
    plain.write_text('just a file')

    await fbh.extract_zip_files(uploaded_files=[AsyncPath(plain)], target_dir=AsyncPath(target_dir))

    assert plain.exists()
    assert plain.read_text() == 'just a file'


@pytest.mark.asyncio
async def test_upload_rejects_traversal_action_id(fbh):
    """A forActionId that is not a UUID is rejected before any path is built."""
    fbh.send_error = mock.AsyncMock()
    data = _upload_data(forActionId='../../../../tmp/evil')

    await fbh.receive_upload_file(event={}, action={'id': '1', 'type': BackendActions.UPLOAD_FILE}, data=data)

    fbh.send_error.assert_called_once()
    assert 'Invalid forActionId' in fbh.send_error.call_args.args[0]


@pytest.mark.asyncio
async def test_upload_rejects_traversal_filename(fbh):
    """A currFileName containing path structure is rejected."""
    fbh.send_error = mock.AsyncMock()
    data = _upload_data(currFileName='../../../../tmp/evil.txt')

    await fbh.receive_upload_file(event={}, action={'id': '1', 'type': BackendActions.UPLOAD_FILE}, data=data)

    fbh.send_error.assert_called_once()
    assert 'Unsafe currFileName' in fbh.send_error.call_args.args[0]


@pytest.mark.asyncio
async def test_upload_rejects_traversal_in_filenames_list(fbh):
    """A fileNames entry containing path structure is rejected."""
    fbh.send_error = mock.AsyncMock()
    data = _upload_data(fileNames=['hello.txt', '../../escape.txt'])

    await fbh.receive_upload_file(event={}, action={'id': '1', 'type': BackendActions.UPLOAD_FILE}, data=data)

    fbh.send_error.assert_called_once()
    assert 'Unsafe fileNames entry' in fbh.send_error.call_args.args[0]


@pytest.mark.asyncio
async def test_upload_accepts_valid_upload(fbh, tmp_path, mocker):
    """A valid single-chunk upload passes validation and is written inside the uploads dir."""
    uploads_root = AsyncPath(tmp_path / 'uploads' / 'proj')
    mocker.patch.object(fbh, 'get_uploads_dir', new=mock.AsyncMock(return_value=uploads_root))
    fbh.send_error = mock.AsyncMock()
    data = _upload_data()

    await fbh.receive_upload_file(event={}, action={'id': '1', 'type': BackendActions.UPLOAD_FILE}, data=data)

    fbh.send_error.assert_not_called()
    combined = tmp_path / 'uploads' / 'proj' / data['forActionId'] / 'hello.txt'
    assert combined.exists()
    assert combined.read_text() == 'hello world'
    sent_types = [c.args[0] for c in fbh.backend_consumer.send_action.call_args_list]
    assert BackendActions.UPLOAD_FILE_COMPLETE in sent_types
