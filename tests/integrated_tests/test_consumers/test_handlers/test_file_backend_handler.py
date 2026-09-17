import zipfile

from aiopath import AsyncPath
import pytest


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
