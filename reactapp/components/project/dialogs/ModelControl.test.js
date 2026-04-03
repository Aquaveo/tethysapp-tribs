import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import ModelControl from "./ModelControl";
import { serialized_project } from "config/tests/mocks/projectContext";
import { ModalContext, ProjectObjectContext } from "react-tethys/context";
import AddGenericDatasetModal from "./AddGenericDatasetModal";

const datasets = serialized_project.datasets;
const modelScenario = serialized_project.scenarios;

jest.setTimeout(60000);
describe("Model Control", () => {
  it("Creates a modal dialog", () => {
    render(
      <ModelControl
        modelScenario={modelScenario[0]}
        datasets={datasets}
        show
      />
    );
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
  });

  it("Creates correct title for the modal dialog", () => {
    render(
      <ModelControl
        modelScenario={modelScenario[0]}
        datasets={datasets}
        show
      />
    );

    const modal = screen.getByRole("dialog");
    const title = screen.getByRole("heading", { name: /Model Control/ });
    expect(modal).toContainElement(title);
  });

  it("Creates close button with correct title in the modal dialog", () => {
    render(
      <ModelControl
        modelScenario={modelScenario[0]}
        datasets={datasets}
        show
      />
    );

    const modal = screen.getByRole("dialog");
    const closeButton = screen.getByRole("button", { name: /Close/ });
    expect(modal).toContainElement(closeButton);
  });

  it("Creates correct input fields in the modal dialog", () => {
    render(
      <ModelControl
        modelScenario={modelScenario[0]}
        datasets={datasets}
        show
      />
    );

    const modal = screen.getByRole("dialog");
    const nameInput = screen.getByLabelText(/RUNTIME/);
    expect(modal).toContainElement(nameInput);
  });

  it("Calls submit and close callbacks when submit button pressed.", async () => {
    const user = userEvent.setup();
    const submitCallback = jest.fn();
    const closeCallback = jest.fn();
    render(
      <ModelControl
        modelScenario={modelScenario[0]}
        datasets={datasets}
        updateScenario={submitCallback}
        onClose={closeCallback}
        show
      />
    );

    const textInput = screen.getByLabelText(/RUNTIME/);
    await user.clear(textInput);
    await user.type(textInput, "900");
    const submitButton = screen.getByRole("button", { name: /Save & Close/ });
    await user.click(submitButton);

    const pauseFor = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds));
    await pauseFor(500);

    expect(submitCallback).toHaveBeenCalled();
    expect(closeCallback).toHaveBeenCalled();
  });

  it.skip("Auto Selects the new dataset type when it's added.", async () => {
    // TODO Finish this test when the backend methods are fully mocked.
    // const user = userEvent.setup();
    const submitCallback = jest.fn();
    const closeCallback = jest.fn();

    const dataObject = ""
    const setDataObject = jest.fn();
    const projectObjectLocation = "input_file.files_and_pathnames.mesh_generation.POINTFILENAME.resource_id"
    const setProjectObjectLocation = jest.fn();

    const projectObjectValue = {
      dataObject,
      setDataObject,
      projectObjectLocation,
      setProjectObjectLocation  
    }

    const setShowAddGenericDataset = jest.fn();
    const closeAddGenericDataset = jest.fn();
    const handleAddDatasetSubmit = () => setDataObject({ "12345": "input_file.files_and_pathnames.mesh_generation.POINTFILENAME.resource_id" });

    const modalContextValue = {
      setShowAddGenericDataset,
    }

    // add `const { rerender } = render()` when backend methods are fully mocked.
    render(
      <ProjectObjectContext.Provider value={projectObjectValue}>
        <ModalContext.Provider value={modalContextValue}>
          <ModelControl
            modelScenario={modelScenario[0]}
            datasets={datasets}
            updateScenario={submitCallback}
            onClose={closeCallback}
            show
          />
          <AddGenericDatasetModal
            show={setShowAddGenericDataset}
            onClose={closeAddGenericDataset}
            onSubmit={handleAddDatasetSubmit}
          />
        </ModalContext.Provider>
      </ProjectObjectContext.Provider>
    );

    // Test will go as follows:
    // 1. Find the "Files and Pathnames" tab on screen.
    // 2. Click on that tab to open it. (await)
    // 3. Find the "Upload New File" button that corresponds to the "POINTFILENAME" key
    // 4. Click that button and wait for the Generic Dataset Modal to appear. (await rerender)
    // 5. Fill out the Generic Dataset Modal so it can be submitted.
    // 6. Find and click the "Add" button. (await)
    // 7, Wait for the Generic Dataset Modal to disappear (await rerender)
    // 8. Wait for the SelectInput field to fill with the Test data from the Generic Dataset Modal form submission
  });
});