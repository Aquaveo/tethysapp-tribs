import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import FileSelect from "./FileSelect";
import userEvent from "@testing-library/user-event";
import { ModalContext } from "react-tethys/context";

const mockedSelectOptions = {
  name: "selectInput",
  options: [
    { value: '', label: 'Select an option' },
    { value: '1', label: 'One' },
    { value: '2', label: 'Two' },
  ],
};

function initAndRender(label = "Foo") {
  const user = userEvent.setup();
  const setShowAddGenericDataset = jest.fn();
  const setShowAddMesh = jest.fn();
  const setShowAddGIS = jest.fn();
  const setShowAddRaster = jest.fn();
  const setShowAddTabular = jest.fn();

  const modalContext = {
    setShowAddGenericDataset,
    setShowAddMesh,
    setShowAddGIS,
    setShowAddRaster,
    setShowAddTabular,
  }

  render(
    <ModalContext.Provider value={modalContext}>
      <Formik>
        <FileSelect
          label={label}
          name={label}
          selectOptions={mockedSelectOptions}
        />
      </Formik>
    </ModalContext.Provider>
  );

  return {
    user,
    setShowAddGenericDataset,
    setShowAddMesh,
    setShowAddGIS,
    setShowAddRaster,
    setShowAddTabular,
  };
}

describe("FileSelect", () => {
  it("Renders a SelectInput when switchInput is true", () => {
    initAndRender();

    const selectSwitch = screen.getByTitle(/Upload New File/i);
    expect(selectSwitch).toBeInTheDocument();
  });

  it("Opens the Add Mesh Modal", async () => {
    const { user, setShowAddMesh } = initAndRender("INPUTDATAFILE");

    const uploadButton = screen.getByRole("button", {name: "Upload New File"});
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);
    expect(setShowAddMesh).toHaveBeenCalled();
  });

  it("Opens the Add GIS Modal", async () => {
    const { user, setShowAddGIS } = initAndRender("TEMP_GIS_KEY_NAME");

    const uploadButton = screen.getByRole("button", {name: "Upload New File"});
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);
    expect(setShowAddGIS).toHaveBeenCalled();
  });

  it("Opens the Add Raster Modal", async () => {
    const { user, setShowAddRaster } = initAndRender("RAINFILE");

    const uploadButton = screen.getByRole("button", {name: "Upload New File"});
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);
    expect(setShowAddRaster).toHaveBeenCalled();
  });

  it("Opens the Add Tabular Modal", async () => {
    const { user, setShowAddTabular } = initAndRender("SOILTABLENAME");

    const uploadButton = screen.getByRole("button", {name: "Upload New File"});
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);
    expect(setShowAddTabular).toHaveBeenCalled();
  });

  it("Opens the Add Generic Modal if there is no discernable type", async () => {
    const { user, setShowAddGenericDataset } = initAndRender("FOOBAR");

    const uploadButton = screen.getByRole("button", {name: "Upload New File"});
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);
    expect(setShowAddGenericDataset).toHaveBeenCalled();
  });
});
