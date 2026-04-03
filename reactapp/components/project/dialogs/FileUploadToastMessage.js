import PropTypes from "prop-types";
import { useEffect } from "react";
import { toast } from "react-toastify";

const FileUploadToastMessage = ({ fileProgress, removeFileProgress, updateToast, setUpdateToast }) => {
  useEffect(() => {
    if (updateToast) {
      const currentToastId = fileProgress.forActionId;
      if (!toast.isActive(currentToastId) && fileProgress.progress !== 1) {
        toast(`Upload in Progress for ${fileProgress.currFileName}`, {
          position: "top-right",
          hideProgressBar: false,
          pauseOnHover: false,
          autoClose: false,
          toastId: currentToastId,
          progress: fileProgress.progress
        });
      } else if (fileProgress.progress === 1) {
        if (!toast.isActive(currentToastId)) {
          toast.success(`File Upload successful for ${fileProgress.currFileName}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            toastId: currentToastId,
          });
        } else {
          toast.update(currentToastId, {
            render: `File Upload successful for ${fileProgress.currFileName}`,
            type: "success",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined
          });
        }
        removeFileProgress(currentToastId);
      } else {
        toast.update(currentToastId, { progress: fileProgress.progress });
      }
      setUpdateToast(false);
    }
  }, [updateToast, fileProgress, setUpdateToast, removeFileProgress]);

  return null;
}

FileUploadToastMessage.propTypes = {
  fileProgress: PropTypes.shape({
    forActionId: PropTypes.string, // action_id
    currFile: PropTypes.number,
    numFiles: PropTypes.number,
    currChunk: PropTypes.number,
    numChunks: PropTypes.number,
    currFileName: PropTypes.string,
    progress: PropTypes.number,
  }),
  removeFileProgress: PropTypes.func,
  updateToast: PropTypes.bool,
  setUpdateToast: PropTypes.func,
}

export default FileUploadToastMessage;