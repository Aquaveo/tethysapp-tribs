import base64ArrayBuffer from "lib/base64ArrayBuffer";
import newUUID from "lib/uuid.js";

import { getTethysPortalHost } from "react-tethys/services/utilities";
import { toast } from "react-toastify";

export default class Backend {
  constructor(rootUrl) {
    const tethys_portal_host = getTethysPortalHost();
    const hostname = tethys_portal_host.hostname;
    const port = tethys_portal_host.port;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'; // Determine protocol based on current page's protocol

    if (port) {
      this.wsUrl = `${protocol}://${hostname}:${port}${window.location.pathname}ws/`;
    } else {
      this.wsUrl = `${protocol}://${hostname}${window.location.pathname}ws/`;
    }

    this.rootUrl = rootUrl;
    this.webSocket = null;
    this.messageHandlers = {};
    this.pendingActions = {};
    this.reconnectToastId = "toast-reconnect";
    this.couldNotReconnectToastId = "toast-disconnect";
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.reconnectInterval = 5000; // Time interval to attempt reconnection (5 seconds)
    this.isReconnecting = false;
    this.onConnectCallback = null;

    // Setup the file upload complete handlers
    this.on(this.actions.UPLOAD_FILE_COMPLETE, (data) => {
      this.handle_upload_complete(data);
    });
  }

  get actions() {
    return {
      UPLOAD_FILE: "UPLOAD_FILE",
      UPLOAD_FILE_PROGRESS: "UPLOAD_FILE_PROGRESS",
      UPLOAD_FILE_COMPLETE: "UPLOAD_FILE_COMPLETE",
      PROJECT_DATA: "PROJECT_DATA",
      PROJECT_UPDATE: "PROJECT_UPDATE",
      REALIZATION_DATA: "REALIZATION_DATA",
      REALIZATION_UPDATE: "REALIZATION_UPDATE",
      REALIZATION_DELETE: "REALIZATION_DELETE",
      SCENARIO_CREATE: "SCENARIO_CREATE",
      SCENARIO_DATA: "SCENARIO_DATA",
      SCENARIO_DELETE: "SCENARIO_DELETE",
      SCENARIO_UPDATE: "SCENARIO_UPDATE",
      SCENARIO_UPDATE_INPUTFILE: "SCENARIO_UPDATE_INPUTFILE",
      SCENARIO_DUPLICATE: "SCENARIO_DUPLICATE",
      MESSAGE_ERROR: "MESSAGE_ERROR",
      DATASET_CREATE: "DATASET_CREATE",
      DATASET_UPDATE: "DATASET_UPDATE",
      DATASET_DUPLICATE: "DATASET_DUPLICATE",
      DATASET_DATA: "DATASET_DATA",
      DATASET_DELETE: "DATASET_DELETE",
      DATASET_GET_PIXEL_TIMESERIES: "DATASET_GET_PIXEL_TIMESERIES",
      DATASET_GET_MRF_OR_RFT_TIMESERIES: "DATASET_GET_MRF_OR_RFT_TIMESERIES",
      DATASET_PROCESSING_PROGRESS: "DATASET_PROCESSING_PROGRESS",
      WORKFLOW_DATA_ALL: "WORKFLOW_DATA_ALL",
      WORKFLOW_DATA: "WORKFLOW_DATA",
      WORKFLOW_CREATE: "WORKFLOW_CREATE",
      WORKFLOW_UPDATE: "WORKFLOW_UPDATE",
      WORKFLOW_DELETE: "WORKFLOW_DELETE",
      WORKFLOW_DUPLICATE: "WORKFLOW_DUPLICATE",
    };
  }

  connect(onConnectCallback) {
    this.onConnectCallback = onConnectCallback
    this.webSocket = new WebSocket(this.wsUrl);
    this.webSocket.addEventListener("open", () => {
      if (this.isReconnecting) {
        toast.dismiss(this.reconnectToastId);
        toast.success("Successfully reconnected to the backend!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
      this.isReconnecting = false;
      onConnectCallback();
    });
    /***************************************************************************/
    /* On message received, parse the message and call the appropriate handler */
    /***************************************************************************/
    this.webSocket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (!("action" in data) || !("type" in data.action) || !("payload" in data)) {
        console.error(
          `Error: malformed message received: ${JSON.stringify(data)}`
        );
        return;
      }

      if (data.action.type in this.messageHandlers) {
        this.messageHandlers[data.action.type](data.payload);
      } else {
        console.warn(
          `Warning: no handler found for message of type "${data.action.type}".`
        );
      }
    });

    if (!this.reconnectInterval <= 320000) {
      this.webSocket.addEventListener("close", this.reconnect);
      this.webSocket.addEventListener("error", this.reconnect);
    }
  }

  reconnect() {
    if (this.reconnectInterval >= 320000) {
      toast.dismiss(this.reconnectToastId);
      toast.error("Could not reconnect to the backend in time. Refresh the page to try again.", {
        position: "top-right",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: false,
        progress: undefined,
        toastId: this.couldNotReconnectToastId,
      })
      return;
    }
    if (!toast.isActive(this.reconnectToastId)) {
      toast.error(`WebSocket connection lost, attempting to reconnect...`, {
        position: "top-right",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: false,
        progress: undefined,
        toastId: this.reconnectToastId,
      });
    }
    this.isReconnecting = true;
    setTimeout(() => {
      this.connect(this.onConnectCallback);
    }, this.reconnectInterval);
    this.reconnectInterval *= 2;
  }

  on(type, func) {
    this.messageHandlers[type] = func;
  }

  do(action, data) {
    const actionId = newUUID();
    let actionMessage = {
      action: {
        id: actionId,
        type: action,
      },
      payload: data
    };

    if ('files' in actionMessage.payload) {
      // Upload files
      this.upload_files(actionMessage.payload.files, actionMessage.action.id);

      // Remove files from the action message
      delete actionMessage.payload.files;

      // Defer sending the action message until after files are uploaded
      this.pendingActions[actionMessage.action.id] = actionMessage;
    } else {
      // Send the message
      this.webSocket.send(this.serialize(actionMessage));
    }

    return actionId;
  }

  upload_files(files, forActionId) {
    const actionId = newUUID();
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const numFiles = files.length;
    const fileNames = Array.from(files).map((file) => file.name);

    for (let currFile = 0; currFile < files.length; currFile++) {
      const file = files[currFile];
      const reader = new FileReader();
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      const numChunks = Math.ceil(file.size / CHUNK_SIZE);
      let currChunk = 1;
      let offset = 0;
      reader.onload = (event) => {
        let base64 = base64ArrayBuffer(event.target.result);
        let actionMsg = this.serialize({
          action: {
            id: actionId,
            type: this.actions.UPLOAD_FILE,
          },
          payload: {
            forActionId: forActionId,
            fileNames: fileNames,
            currFileName: fileName,
            currFileSize: fileSize,
            currFileType: fileType,
            numChunks: numChunks,
            currChunk: currChunk,
            numFiles: numFiles,
            currFile: currFile + 1,
            chunk: base64,
          },
        });
        this.webSocket.send(actionMsg);
        offset += event.target.result.byteLength;
        currChunk += 1;
        if (offset < file.size) {
          reader.readAsArrayBuffer(file.slice(offset, offset + CHUNK_SIZE));
        }
      }
      // Trigger the first read
      reader.readAsArrayBuffer(file.slice(offset, offset + CHUNK_SIZE));
    }
    return actionId;
  }

  handle_upload_complete(data) {
    const actionId = data.forActionId;
    const actionMessage = this.pendingActions[actionId];
    if (actionMessage) {
      this.webSocket.send(this.serialize(actionMessage));
      delete this.pendingActions[actionId];
    }
  }

  serialize(obj) {
    return JSON.stringify(obj, this._jsonSerializer);
  }

  _jsonSerializer(key, value) {
    // Serialize name of file and send file separately
    if (value instanceof File) {
      return value.name;
    }
    // Don't serialize private members (i.e. start with "_")
    if (key.startsWith("_")) {
      return; // skip
    }
    // Everything else default serialization
    return value;
  }
}
