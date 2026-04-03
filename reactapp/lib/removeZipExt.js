function removeZipExtension(filename) {
  if (filename.endsWith('.zip')) {
    return filename.slice(0, -4);
  }
  return filename;
}

export default removeZipExtension;