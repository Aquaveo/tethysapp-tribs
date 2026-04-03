import { render } from "@testing-library/react";
import { toast } from "react-toastify";
import FileUploadToastMessage from "./FileUploadToastMessage";

describe("FileUploadToastMessage", () => {
  let fileProgress, removeFileProgress, updateToast, setUpdateToast;

  beforeEach(() => {
    fileProgress = {
      forActionId: "action_id",
      currFileName: "file.txt",
      progress: 0.5,
    };
    removeFileProgress = jest.fn();
    updateToast = true;
    setUpdateToast = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays upload progress toast", () => {
    render(
      <FileUploadToastMessage
        fileProgress={fileProgress}
        removeFileProgress={removeFileProgress}
        updateToast={updateToast}
        setUpdateToast={setUpdateToast}
      />
    );

    expect(toast).toHaveBeenCalledWith(`Upload in Progress for ${fileProgress.currFileName}`, {
      position: "top-right",
      hideProgressBar: false,
      pauseOnHover: false,
      autoClose: false,
      toastId: fileProgress.forActionId,
      progress: fileProgress.progress,
    });
  });

  it("displays success toast when upload is complete", () => {
    fileProgress.progress = 1;

    render(
      <FileUploadToastMessage
        fileProgress={fileProgress}
        removeFileProgress={removeFileProgress}
        updateToast={updateToast}
        setUpdateToast={setUpdateToast}
      />
    );

    expect(toast.success).toHaveBeenCalledWith(`File Upload successful for ${fileProgress.currFileName}`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      toastId: fileProgress.forActionId,
    });

    expect(removeFileProgress).toHaveBeenCalledWith(fileProgress.forActionId);
  });

  it("does not display toast if updateToast is false", () => {
    updateToast = false;

    render(
      <FileUploadToastMessage
        fileProgress={fileProgress}
        removeFileProgress={removeFileProgress}
        updateToast={updateToast}
        setUpdateToast={setUpdateToast}
      />
    );

    expect(toast).not.toHaveBeenCalled();
  });

  // Could not find anything on how to use toast.update in a test
});
