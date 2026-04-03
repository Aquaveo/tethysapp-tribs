import { act, render, screen } from "@testing-library/react";
import { toast } from "react-toastify";
import userEvent from "@testing-library/user-event";
import { AppContext } from 'react-tethys/context';

import { mockBackend, mockBackendAfterEach } from "config/tests/mocks/backend";
import WorkflowsModal from "./WorkflowsModal";
import newUUID from "lib/uuid";

afterEach(() => {
  mockBackendAfterEach();
});

jest.setTimeout(10000);

const pauseFor = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// TODO Update tests since some workflows are removed
const workflows = {
  "available": [
    {
      "name": "tRIBS",
      "workflows": [
        {
          "type": "bulk_data_retrieval_workflow",
          "name": "Bulk Data Retrieval Workflow",
          "description": ""
        },
        {
          "type": "generate_graph_file_workflow",
          "name": "Generate Graph File Workflow",
          "description": ""
        },
        {
          "type": "prepare_met_forcings_workflow",
          "name": "Prepare Meteorological Forcings Workflow",
          "description": ""
        },
        {
          "type": "prepare_soils_workflow",
          "name": "Prepare Soils Workflow",
          "description": ""
        },
        {
          "type": "run_simulation_workflow",
          "name": "Run Simulation Workflow",
          "description": ""
        },
        {
          "type": "select_trees_workflow",
          "name": "Select Trees Workflow",
          "description": ""
        }
      ]
    }
  ],
  "history": [
    {
      "id": "30d10fbd-04c3-41a7-94b0-af5e8156261e",
      "date_created": new Date("2024-06-12T21:42:26.107876"),
      "name": "Generate Graph File Workflow 2024-06-12 21:42:26",
      "type": "generate_graph_file_workflow",
      "locked": false,
      "attributes": {},
      "created_by": "_staff_user",
      "display_type_plural": "Generate Graph File Workflows",
      "display_type_singular": "Generate Graph File Workflow",
      "results": [],
      "status": "Pending",
      "steps": [
        {
          "resource_workflow_id": "30d10fbd-04c3-41a7-94b0-af5e8156261e",
          "type": "spatial_input_workflow_step",
          "name": "Generic Spatial Input Step",
          "help": "Use the point tool to define a location. [CHANGE THIS HELP TEXT]",
          "id": "27da1b7c-fefb-45db-a8f4-9b3180561106",
          "parameters": {
            "geometry": null,
            "imagery": null
          }
        },
        {
          "resource_workflow_id": "30d10fbd-04c3-41a7-94b0-af5e8156261e",
          "type": "spatial_condor_job_workflow_step",
          "name": "Generic Run Step",
          "help": "Review input and then press the Run button to run the workflow. Press Next after the execution completes to continue. [CHANGE THIS HELP TEXT]",
          "id": "e4b812d3-072c-4d4f-a2fd-b147453a81de",
          "parameters": {}
        },
        {
          "resource_workflow_id": "30d10fbd-04c3-41a7-94b0-af5e8156261e",
          "type": "results_resource_workflow_step",
          "name": "Generic Review Results",
          "help": "Review the results from the run step. [CHANGE THIS HELP TEXT]",
          "id": "d6fa7d7f-bc76-4e20-baf5-573197509e59",
          "parameters": {}
        }
      ],
      "url": "/apps/tribs/resources/72dee23b-8185-4e9a-9886-48494f06a7df/generate_graph_file_workflow/30d10fbd-04c3-41a7-94b0-af5e8156261e/"
    },
    {
      "id": "8f47f91a-dbc1-43d9-ae7c-2a48fd9eccbc",
      "date_created": new Date("2024-06-12T21:41:51.556189"),
      "name": "Bulk Data Retrieval Workflow 2024-06-12 21:41:51",
      "type": "bulk_data_retrieval_workflow",
      "locked": false,
      "attributes": {
        "fromAction": "daadb125-4392-4644-8a84-134ee9120433"
      },
      "created_by": "_staff_user",
      "display_type_plural": "Bulk Data Retrieval Workflows",
      "display_type_singular": "Bulk Data Retrieval Workflow",
      "results": [],
      "status": "Pending",
      "steps": [
        {
          "resource_workflow_id": "8f47f91a-dbc1-43d9-ae7c-2a48fd9eccbc",
          "type": "spatial_input_workflow_step",
          "name": "Generic Spatial Input Step",
          "help": "Use the point tool to define a location. [CHANGE THIS HELP TEXT]",
          "id": "1f731333-8271-4aa6-bb28-3928d0acf58e",
          "parameters": {
            "geometry": null,
            "imagery": null
          }
        },
        {
          "resource_workflow_id": "8f47f91a-dbc1-43d9-ae7c-2a48fd9eccbc",
          "type": "spatial_condor_job_workflow_step",
          "name": "Generic Run Step",
          "help": "Review input and then press the Run button to run the workflow. Press Next after the execution completes to continue. [CHANGE THIS HELP TEXT]",
          "id": "660b4170-f4d5-430c-b5d1-97500f8a4e39",
          "parameters": {}
        },
        {
          "resource_workflow_id": "8f47f91a-dbc1-43d9-ae7c-2a48fd9eccbc",
          "type": "results_resource_workflow_step",
          "name": "Generic Review Results",
          "help": "Review the results from the run step. [CHANGE THIS HELP TEXT]",
          "id": "966275e9-6262-4c75-aed0-1f72bdebe2c6",
          "parameters": {}
        }
      ],
      "url": "/apps/tribs/resources/72dee23b-8185-4e9a-9886-48494f06a7df/bulk_data_retrieval_workflow/8f47f91a-dbc1-43d9-ae7c-2a48fd9eccbc/"
    }
  ]
};

const setupTests = async (title = "Test", show = true) => {
  const user = userEvent.setup();
  const { server, backend } = await mockBackend();
  const handleClose = jest.fn();
  const mockPathname = jest.fn();
  Object.defineProperty(window, 'location', {
    value: {
      get pathname() {
        return mockPathname();
      },
    },
  });
  const windowOpenSpy = jest.spyOn(window, "open").mockImplementation(jest.fn());

  const workflow_id = newUUID();
  const mockHistoryItem = {
    "id": workflow_id,
    "date_created": new Date().toLocaleDateString(),
    "name": "Test History Item",
    "type": "generate_graph_file_workflow",
    "locked": false,
    "attributes": {},
    "created_by": "_staff_user",
    "display_type_plural": "Generate Graph File Workflows",
    "display_type_singular": "Generate Graph File Workflow",
    "results": [],
    "status": "Pending",
    "steps": [
      {
        "resource_workflow_id": workflow_id,
        "type": "spatial_input_workflow_step",
        "name": "Generic Spatial Input Step",
        "help": "Use the point tool to define a location. [CHANGE THIS HELP TEXT]",
        "id": newUUID(),
        "parameters": {
          "geometry": null,
          "imagery": null
        }
      },
      {
        "resource_workflow_id": workflow_id,
        "type": "spatial_condor_job_workflow_step",
        "name": "Generic Run Step",
        "help": "Review input and then press the Run button to run the workflow. Press Next after the execution completes to continue. [CHANGE THIS HELP TEXT]",
        "id": newUUID(),
        "parameters": {}
      },
      {
        "resource_workflow_id": workflow_id,
        "type": "results_resource_workflow_step",
        "name": "Generic Review Results",
        "help": "Review the results from the run step. [CHANGE THIS HELP TEXT]",
        "id": newUUID(),
        "parameters": {}
      }
    ],
    "url": `/apps/tribs/resources/72dee23b-8185-4e9a-9886-48494f06a7df/generate_graph_file_workflow/${workflow_id}/`
  };

  const workflowsRender = (givenWorkflows = workflows) => {
    return (
      <AppContext.Provider value={{ backend: backend, csrf: "12345" }}>
        <WorkflowsModal
          workflows={givenWorkflows}
          onClose={handleClose}
          title={title}
          show={show} />
      </AppContext.Provider>
    );
  }

  const { rerender } = render(workflowsRender());
  return {
    user,
    server,
    backend,
    handleClose,
    rerender,
    workflowsRender,
    windowOpenSpy,
    workflow_id,
    mockHistoryItem,
  };
};

it("Creates a modal dialog", async () => {
  await setupTests();
  const modal = screen.getByRole("dialog");
  expect(modal).toBeInTheDocument();
});

it("Creates the correct title for the Workflows Modal", async () => {
  await setupTests("Workflows");
  const modal = screen.getByRole("dialog");
  const title = screen.getByRole("heading", { name: /Workflows/ });
  expect(modal).toContainElement(title);
});

it("Creates close button with correct title in the modal dialog", async () => {
  await setupTests("Workflows");

  const modal = screen.getByRole("dialog");
  const closeButton = screen.getByRole("button", { name: /Close/ });
  expect(modal).toContainElement(closeButton);
});

it("Calls the close function correctly", async () => {
  const { user, handleClose } = await setupTests();

  const closeButton = screen.getByRole("button", { name: /Close/ });
  await act(() => {
    user.click(closeButton);
  });
  expect(handleClose).toHaveBeenCalled();
});

it("Doesn't show the History Tab until selected", async () => {
  const { user, rerender, workflowsRender } = await setupTests();
  const workflowsTabButton = screen.getByRole("tab", {name: "Workflows"});
  expect(workflowsTabButton).toHaveClass("active");

  const historyTabButton = screen.getByRole("tab", {name: "History"});
  await user.click(historyTabButton);

  await rerender(workflowsRender());
  expect(workflowsTabButton).not.toHaveClass("active");
  expect(historyTabButton).toHaveClass("active");
});

it("Opens a new workflow window and changes the active tab", async () => {
  const {
    user,
    rerender,
    workflowsRender,
    server,
    backend,
    windowOpenSpy,
    workflow_id,
    mockHistoryItem,
  } = await setupTests();

  await expect(server).toReceiveMessage(
    expect.stringContaining('"type":"WORKFLOW_DATA_ALL"},"payload":{"initial":true}')
  );

  const workflowsTabButton = screen.getByRole("tab", {name: "Workflows"});
  const historyTabButton = screen.getByRole("tab", {name: "History"});
  expect(workflowsTabButton).toHaveClass("active");

  const runWorkflowButton = screen.getByRole("button", {name: "Run Bulk Data Retrieval Workflow"});

  // mockPathname.mockReturnValue('some');
  await user.click(runWorkflowButton);

  // TODO Add WORKFLOW_DATA_CREATE server message here
  await expect(server).toReceiveMessage(
    expect.stringContaining('"type":"WORKFLOW_CREATE"},"payload":{"type":"bulk_data_retrieval_workflow"}')
  );

  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: backend.actions.WORKFLOW_DATA,
      },
      payload: mockHistoryItem,
    })
  );

  await rerender(workflowsRender());
  expect(toast.info).toHaveBeenCalledWith("Opening Workflow Window", {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
  });

  expect(workflowsTabButton).not.toHaveClass("active");
  expect(historyTabButton).toHaveClass("active");

  const testHistoryItem = screen.getByText("Test History Item");
  expect(testHistoryItem).toBeInTheDocument();
  // Expects there to be a new folder of today's date that contains the new workflow history item
  const newDateItem = screen.getByText(new Date().toLocaleDateString());
  expect(newDateItem).toBeInTheDocument();

  await act(async () => {
    await pauseFor(2700);
  })

  expect(windowOpenSpy).toHaveBeenCalledWith(
    `/apps/tribs/resources/72dee23b-8185-4e9a-9886-48494f06a7df/generate_graph_file_workflow/${workflow_id}/`,
    "_self", "noopener noreferrer"
  );

  // Clean up
  windowOpenSpy.mockRestore();
});

it("Opens a duplicated workflow window", async () => {
  const {
    user,
    backend,
    server,
    windowOpenSpy,
    workflow_id,
    mockHistoryItem,
  } = await setupTests();
  await expect(server).toReceiveMessage(
    expect.stringContaining('"type":"WORKFLOW_DATA_ALL"},"payload":{"initial":true}')
  );

  const workflowsTabButton = screen.getByRole("tab", {name: "Workflows"});
  const historyTabButton = screen.getByRole("tab", {name: "History"});
  expect(workflowsTabButton).toHaveClass("active");

  await user.click(historyTabButton);

  const optionsButton = screen.getByRole("button", { name: "Options for Generate Graph File Workflow 2024-06-12 21:42:26" });
  await user.click(optionsButton);
  const duplicateButton = screen.getByRole("button", { name: "Duplicate" });
  await user.click(duplicateButton);

  await expect(server).toReceiveMessage(
    expect.stringContaining(`"type":"WORKFLOW_DUPLICATE"},"payload":{"id":"${workflows.history[0].id}"}`)
  );

  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: backend.actions.WORKFLOW_DATA,
      },
      payload: mockHistoryItem,
    })
  );

  expect(toast.info).toHaveBeenCalledWith("Opening Workflow Window", {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
  });

  await act(async () => {
    await pauseFor(2700);
  })  

  expect(windowOpenSpy).toHaveBeenCalledWith(
    `/apps/tribs/resources/72dee23b-8185-4e9a-9886-48494f06a7df/generate_graph_file_workflow/${workflow_id}/`,
    "_self", "noopener noreferrer"
  );

  // Clean up
  windowOpenSpy.mockRestore();
});

it("Opens the current progress on an existing History Item", async () => {
  const {
    user,
    rerender,
    workflowsRender,
    windowOpenSpy,
  } = await setupTests();

  const historyTabButton = screen.getByRole("tab", {name: "History"});

  await user.click(historyTabButton);
  await rerender(workflowsRender());

  const runOldWorkflow = screen.getByRole("button", { name: `Run ${workflows.history[0].name}` });
  await user.click(runOldWorkflow);

  expect(windowOpenSpy).toHaveBeenCalledWith(
    workflows.history[0].url, "_self", "noopener noreferrer"
  );
});

it("Filters the workflows based on the search input", async () => {
  const { user } = await setupTests();
  const workflows = screen.getAllByTestId("tree-item-child");
  expect(workflows).toHaveLength(11); // 9 workflows and 2 history tree items

  const searchBar = screen.getByPlaceholderText("Search Workflows");
  await user.type(searchBar, "Generate");
  expect(searchBar).toHaveValue("Generate");

  const rerenderedWorkflows = screen.getAllByTestId("tree-item-child");
  expect(rerenderedWorkflows).toHaveLength(4); // 2 workflows and 2 history tree items
});

it("Changes the name of the history item", async () => {
  const {
    user,
    backend,
    server,
    rerender,
    workflowsRender,
  } = await setupTests();

  await expect(server).toReceiveMessage(
    expect.stringContaining('"type":"WORKFLOW_DATA_ALL"},"payload":{"initial":true}')
  );
  const historyTabButton = screen.getByRole("tab", {name: "History"});

  await user.click(historyTabButton);
  await rerender(workflowsRender());

  const optionsButton = screen.getByRole("button", { name: "Options for Generate Graph File Workflow 2024-06-12 21:42:26" });
  await user.click(optionsButton);
  const renameButton = screen.getByRole("button", { name: "Rename" });
  await user.click(renameButton);

  const renameInput = screen.getAllByRole("textbox")[1];
  expect(renameInput).toHaveValue("Generate Graph File Workflow 2024-06-12 21:42:26");
  const renameSave = await screen.findByRole("button", { name: /^Save$/ });

  const newName = "A Different Name"
  await user.clear(renameInput);
  await user.type(renameInput, newName, { delay: 2 });
  await user.click(renameSave);

  const renamedHistoryItem = {
    ...workflows.history[0],
    name: newName,
  };

  await expect(server).toReceiveMessage(
    expect.stringContaining(`"type":"WORKFLOW_UPDATE"},"payload":${JSON.stringify(renamedHistoryItem)}`)
  );

  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: backend.actions.WORKFLOW_DATA,
      },
      payload: renamedHistoryItem,
    })
  );

  const reRenameSave = screen.queryByRole("button", { name: /^Save$/ });
  expect(reRenameSave).not.toBeInTheDocument();
  const wrongName = screen.queryByText("Generate Graph File Workflow 2024-06-12 21:42:26")
  expect(wrongName).not.toBeInTheDocument();
  expect(screen.getByRole("tree-item-child", {name: newName})).toBeInTheDocument();
});

it("Deletes an existing workflow", async () => {
  const {
    user,
    backend,
    server,
    rerender,
    workflowsRender,
  } = await setupTests();

  await expect(server).toReceiveMessage(
    expect.stringContaining('"type":"WORKFLOW_DATA_ALL"},"payload":{"initial":true}')
  );
  const historyTabButton = screen.getByRole("tab", {name: "History"});

  await user.click(historyTabButton);
  await rerender(workflowsRender());

  const optionsButton = screen.getByRole("button", { name: "Options for Generate Graph File Workflow 2024-06-12 21:42:26" });
  await user.click(optionsButton);
  const deleteButton = screen.getByRole("button", { name: "Delete" });
  await user.click(deleteButton);

  await rerender(workflowsRender());
  const confirmDelete = screen.getByRole("button", { name: "Yes" })
  await user.click(confirmDelete);

  await expect(server).toReceiveMessage(
    expect.stringContaining(`"type":"WORKFLOW_DELETE"},"payload":{"id":"${workflows.history[0].id}"}`)
  );

  server.send(
    JSON.stringify({
      action: {
        id: newUUID(),
        type: backend.actions.WORKFLOW_DELETE,
      },
      payload: workflows.history[0],
    })
  );

  const reRenameSave = screen.queryByRole("button", { name: /^Save$/ });
  expect(reRenameSave).not.toBeInTheDocument();
  const deletedHistoryItem = screen.queryByText("Generate Graph File Workflow 2024-06-12 21:42:26")
  expect(deletedHistoryItem).not.toBeInTheDocument();
});
