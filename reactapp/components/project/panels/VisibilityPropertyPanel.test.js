import userEvent from "@testing-library/user-event";
import { render, screen } from '@testing-library/react';

import { SidePanelContext, GraphicsWindowVisualsContext } from 'react-tethys/context';
import VisibilityPropertyPanel from './VisibilityPropertyPanel';
import { DO_NOT_SET_LAYER } from "constants/GraphicsWindowConstants";
import { makeStaticMesh, makeTimeSeriesMesh } from "config/tests/mocks/meshMock";


const dataset = {
  "id": "ef458c1c-e390-4196-a152-405683d9b0c9",
  "name": "Node Dynamic Output",
  "type": "dataset_resource",
  "locked": false,
  "status": null,
  "attributes": {},
  "created_by": "_staff_user",
  "date_created": "2024-07-10T20:48:18.317243",
  "description": "Node Dynamic Output for tEST.",
  "display_type_plural": "Datasets",
  "display_type_singular": "Dataset",
  "organizations": [
    {
      "id": "67984deb-e430-435c-ba0f-fae786a0440f",
      "name": "Hello World"
    }
  ],
  "public": false,
  "slug": "datasets",
  "viz": {
    "type": "czml",
    "url": [
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Mi_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/GWflx_m3-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/HFlux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/LngRadIn_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SoilT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/RootMoist_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nwt_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/NetRad_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Wind_m-s.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Intercept_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Srf_Hour_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpTtrs_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Qstrm_m3-s.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Runon_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nt_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Hlev_m.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpSoil_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Trnsm_m2-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/CumIntercept_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/AirT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SkyCov_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Srf_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpDryCan_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/LngRadOutW-m2_.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/NetPrecip_mm-hr.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/EvpWetCan_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SoilMoist_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Recharge_mm-hr.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShortAbsbVeg_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/CanStorg_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Press_Pa.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ActEvp_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Rain_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Lflux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/PotEvp_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShortAbsbSoi_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/RelHum_d-l.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/SurfT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Nf_mm.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/QpOut_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_dir_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/ShrtRadIn_dif_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/DewT_oC.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Gflux_W-m2.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/QpIn_mm-h.czml",
      "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/czml/Mu_mm.czml"
    ],
    "origin": [
      -112.5841635588148,
      34.29805405819842
    ],
    "extent": [
      -124.914551,
      24.766785,
      -67.412109,
      49.15297
    ]
  },
  "dataset_type": "TRIBS_OUT_PIXEL",
  "srid": null
};

const setupPanel = (show = false, disabled = false, panelDataset = dataset) => {
  const user = userEvent.setup();
  
  const mockSidePanelContextValue = {
    hideSidePanel: jest.fn(),
    visibleSidePanel: null
  };
  
  const mockGraphicsWindowVisualsContextValue = {
    visibleCZMLObject: {},
    setCZMLLayer: jest.fn(),
    setActiveTimeSeries: jest.fn(),
  };

  if (show) {
    mockSidePanelContextValue.visibleSidePanel = 'testPanelId';
  }

  if (disabled) {
    mockGraphicsWindowVisualsContextValue.visibleCZMLObject = { [panelDataset.id]: DO_NOT_SET_LAYER }
  }

  const panelRender = (
    <SidePanelContext.Provider value={mockSidePanelContextValue}>
      <GraphicsWindowVisualsContext.Provider value={mockGraphicsWindowVisualsContextValue}>
        <VisibilityPropertyPanel dataset={panelDataset} panelId="testPanelId" />
      </GraphicsWindowVisualsContext.Provider>
    </SidePanelContext.Provider>
  );

  const { rerender } = render(panelRender);
  return {
    user,
    panelRender,
    rerender,
    mockGraphicsWindowVisualsContextValue,
    mockSidePanelContextValue
  };
}

describe('VisibilityPropertyPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the SlideSheet component with the correct title', () => {
    setupPanel(true);
    expect(screen.getByText(`${dataset.name} Visibility Properties`)).toBeInTheDocument();
  });

  it('should select the first layer as a default', () => {
    const { mockGraphicsWindowVisualsContextValue } = setupPanel(true);
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(dataset.id, "Mi_mm");
  });

  it('should call hideSidePanel when the SlideSheet is closed', async () => {
    const { user, mockSidePanelContextValue } = setupPanel(true);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(mockSidePanelContextValue.hideSidePanel).toHaveBeenCalled();
  });

  it('should render TreeItem components for each URL in the dataset', () => {
    setupPanel(true);
    const treeItems = screen.getAllByTestId("tree-item-child");
    expect(treeItems).toHaveLength(47);
    expect(screen.getByText('Mi_mm')).toBeInTheDocument();
    expect(screen.getByText('HFlux_W-m2')).toBeInTheDocument();
  });

  it('should call setCZMLLayer with the correct arguments when a TreeItem is clicked', async () => {
    const { user, mockGraphicsWindowVisualsContextValue } = setupPanel(true);
    await user.click(screen.getByText('Intercept_mm'));
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(dataset.id, 'Intercept_mm');
  });

  it('should not call setCZMLLayer if the visibleCZMLObject is set to DO_NOT_SET_LAYER', () => {
    const { user, mockGraphicsWindowVisualsContextValue } = setupPanel(true, true);
    user.click(screen.getByText('Mi_mm'));
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).not.toHaveBeenCalled();
  });

  it('should initialize the CZML layer on first render if conditions are met', () => {
    const { mockGraphicsWindowVisualsContextValue } = setupPanel(true);
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(dataset.id, 'Mi_mm');
  });
});

describe('VisibilityPropertyPanel with glTF mesh variables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list each variable once and select the first one with its time series', () => {
    const mesh = makeTimeSeriesMesh();
    const { mockGraphicsWindowVisualsContextValue } = setupPanel(true, false, mesh);
    expect(screen.getAllByTestId("tree-item-child")).toHaveLength(2);
    expect(screen.getByText('Mu')).toBeInTheDocument();
    expect(screen.getByText('Nwt')).toBeInTheDocument();
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(mesh.id, 'Mu');
    expect(mockGraphicsWindowVisualsContextValue.setActiveTimeSeries).toHaveBeenCalledWith(
      expect.objectContaining({ datasetId: mesh.id, variableName: 'Mu', multiplier: 72000, count: 3 })
    );
  });

  it('should select the clicked variable and make it drive the clock', async () => {
    const mesh = makeTimeSeriesMesh();
    const { user, mockGraphicsWindowVisualsContextValue } = setupPanel(true, false, mesh);
    jest.clearAllMocks();
    await user.click(screen.getByText('Nwt'));
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(mesh.id, 'Nwt');
    expect(mockGraphicsWindowVisualsContextValue.setActiveTimeSeries).toHaveBeenCalledWith(
      expect.objectContaining({ datasetId: mesh.id, variableName: 'Nwt', count: 2 })
    );
  });

  it('should not select anything when the layer is DO_NOT_SET_LAYER', async () => {
    const mesh = makeTimeSeriesMesh();
    const { user, mockGraphicsWindowVisualsContextValue } = setupPanel(true, true, mesh);
    await user.click(screen.getByText('Nwt'));
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).not.toHaveBeenCalled();
    expect(mockGraphicsWindowVisualsContextValue.setActiveTimeSeries).not.toHaveBeenCalled();
  });

  it('should not drive the clock for a static mesh', () => {
    const mesh = makeStaticMesh();
    const { mockGraphicsWindowVisualsContextValue } = setupPanel(true, false, mesh);
    expect(screen.getAllByTestId("tree-item-child")).toHaveLength(1);
    expect(screen.getByText('Elevation')).toBeInTheDocument();
    expect(mockGraphicsWindowVisualsContextValue.setCZMLLayer).toHaveBeenCalledWith(mesh.id, 'Elevation');
    expect(mockGraphicsWindowVisualsContextValue.setActiveTimeSeries).not.toHaveBeenCalled();
  });
});
