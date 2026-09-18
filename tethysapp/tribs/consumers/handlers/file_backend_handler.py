import asyncio
import base64
import logging
import os
import zipfile
import aioshutil
import uuid
from aiopath import AsyncPath
from asgiref.sync import sync_to_async

from ..backend_actions import BackendActions
from .resource_backend_handler import ResourceBackendHandler as RBH

log = logging.getLogger(__name__)


class FileBackendHandler(RBH):
    CHUNK_FILE_TEMPLATE = "_{file_name}.chunk.{curr_chunk}"

    @property
    def receiving_actions(self) -> dict[BackendActions, callable]:
        return {
            BackendActions.UPLOAD_FILE: self.receive_upload_file,
        }

    @RBH.action_handler
    async def receive_upload_file(self, event, action, data, session):
        """Handle received file upload messages."""
        for_action_id = data.get('forActionId')
        curr_file = data.get('currFile')
        num_files = data.get('numFiles')
        curr_chunk = data.get('currChunk')
        num_chunks = data.get('numChunks')
        file_name = data.get('currFileName')
        file_names = data.get('fileNames', [])
        chunk_base64 = data.get('chunk').encode()
        chunk = base64.b64decode(chunk_base64)

        # Reject path traversal: forActionId must be a UUID; filenames must be bare basenames
        try:
            uuid.UUID(for_action_id)
        except (ValueError, TypeError, AttributeError):
            raise ValueError(f'Invalid forActionId: {for_action_id}')

        def _safe_basename(value, label):
            if not isinstance(value, str) or value in ('', '.', '..') or value != os.path.basename(value):
                raise ValueError(f'Unsafe {label}: "{value}"')
            return value

        file_name = _safe_basename(file_name, 'currFileName')
        file_names = [_safe_basename(f, 'fileNames entry') for f in file_names]

        # Prepare directory
        uploads_dir = await self.get_uploads_dir()
        curr_upload_dir = uploads_dir / for_action_id
        await curr_upload_dir.mkdir(parents=True, exist_ok=True)

        # Write current chunk
        curr_upload_file = curr_upload_dir / self.CHUNK_FILE_TEMPLATE.format(file_name=file_name, curr_chunk=curr_chunk)
        async with curr_upload_file.open('wb') as f:
            await f.write(chunk)

        # Combine chunks if all written
        written_chunks = [f async for f in curr_upload_dir.glob(f"_{file_name}.chunk.*")]
        log.debug(f'Num written chunks for "{file_name}": {len(written_chunks)} / {num_chunks}')
        if len(written_chunks) == num_chunks:
            await self.combine_chunks(curr_upload_dir, file_name, num_chunks)

        # Send progress update
        progress = {
            'forActionId': for_action_id,
            'currFile': curr_file,
            'numFiles': num_files,
            'currChunk': curr_chunk,
            'numChunks': num_chunks,
            'currFileName': file_name,
        }

        await self.send_action(BackendActions.UPLOAD_FILE_PROGRESS, progress)

        # Send upload complete after last file and last chunk written
        written_files = {f: await (curr_upload_dir / f).exists() for f in file_names}
        log.debug(f'Written files: {written_files}')
        if all(written_files.values()) and len(written_chunks) == num_chunks:
            await self.extract_zip_files(
                uploaded_files=[curr_upload_dir / f for f in file_names],
                target_dir=curr_upload_dir,
            )
            await self.flatten_directory(target_dir=curr_upload_dir)
            uploaded_filenames = [f.name async for f in AsyncPath(curr_upload_dir).glob('*')]
            joined_file_names = '", "'.join(uploaded_filenames)
            log.debug(f'Upload complete: "{joined_file_names}"')
            await self.send_action(
                BackendActions.UPLOAD_FILE_COMPLETE, {
                    'forActionId': for_action_id,
                    'fileNames': file_names
                }
            )

    async def combine_chunks(self, curr_upload_dir, file_name, num_chunks):
        """Combine all chunk files into a single file."""
        combined_file = curr_upload_dir / file_name
        async with combined_file.open('wb') as c:
            for i in range(1, num_chunks + 1):
                chunk_file = curr_upload_dir / self.CHUNK_FILE_TEMPLATE.format(file_name=file_name, curr_chunk=i)
                async with chunk_file.open('rb') as chunk_f:
                    await c.write(await chunk_f.read())
                await chunk_file.unlink()

    async def extract_zip_files(self, uploaded_files, target_dir):
        """Check for zip files in the list of uploaded files and extract them.

        Args:
            uploaded_files: List of Path objects for uploaded files.
            target_dir: Path object for the directory to extract the files to.
        """
        def _extract_if_zip(z, target_dir):
            target_path = os.path.abspath(target_dir)
            if zipfile.is_zipfile(z):
                log.debug(f'Extracting zipfile: "{z}"')
                with zipfile.ZipFile(z, 'r') as zf:
                    for member in zf.namelist():
                        member_path = os.path.abspath(os.path.join(target_path, member))
                        if os.path.commonpath([target_path, member_path]) != target_path:
                            raise ValueError(f'Attempted Path Traversal in Zip File: {member}')

                    zf.extractall(target_path)
                return True

        for u in uploaded_files:
            is_zip = await sync_to_async(_extract_if_zip)(u, target_dir)
            # Remove only zip files that have been extracted, leave other files in place
            if is_zip:
                await u.unlink()

    async def flatten_directory(self, target_dir):
        """Flatten the directory structure of the target directory.

        Args:
            target_dir: Path object for the directory to flatten.
        """
        target_path = AsyncPath(target_dir)

        async def move_file(file_path, target_path):
            target_file_path = target_path / file_path.name
            # If a file with the same name already exists in the root, skip it
            if await target_file_path.exists():
                log.warning(f'File "{file_path.name}" already exists in the root, skipping...')
                return
            await aioshutil.move(str(file_path), target_file_path)

        # Iterate over all files in the directory and its subdirectories
        tasks = []
        async for file_path in target_path.glob('**/*'):
            if file_path.is_file():
                tasks.append(move_file(file_path, target_path))

        await asyncio.gather(*tasks)
