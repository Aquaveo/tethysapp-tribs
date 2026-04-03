import { render } from '@testing-library/react';
import { toast } from 'react-toastify';
import { AppContext, GraphicsWindowVisualsContext } from 'react-tethys/context';
import CustomCamera from './CustomCamera';
import useCameraCoordinates from 'hooks/useCustomCamera';
import { BAD_EXTENT, HOME } from 'constants/GraphicsWindowConstants';
import { mockBackend, mockBackendAfterEach } from 'config/tests/mocks/backend';

// Mock dependencies
jest.mock('hooks/useCustomCamera');

// These tests only check if the correct toast messages are being passed.
// This is not a good test for the useCustomCamera hook.

afterEach(() => {
  mockBackendAfterEach();
});

describe('CustomCamera', () => {
  const renderComponent = async (homeExtent) => {
    const { server, backend } = await mockBackend();
    const framedObject = {[HOME]: homeExtent}
    const CustomCameraRender = (
      <AppContext.Provider value={{ backend: backend, csrf: "12345" }}>
        <GraphicsWindowVisualsContext.Provider value={{ framedObject }}>
          <CustomCamera />
        </GraphicsWindowVisualsContext.Provider>
      </AppContext.Provider>
    );
    const { rerender } = render(CustomCameraRender);
    return { server, rerender };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not show a success toast when cameraCoordinates are identical to homeExtent', async () => {
    const homeExtent = [40, -75, 40, -75];
    const cameraCoordinates = [40, -75, 40, -75];

    useCameraCoordinates.mockReturnValue({ cameraCoordinates });

    await renderComponent(homeExtent);

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should show an error toast when cameraCoordinates are not set correctly', async () => {
    const homeExtent = [40, -75, 40, -75];
    const cameraCoordinates = BAD_EXTENT;

    useCameraCoordinates.mockReturnValue({ cameraCoordinates });

    await renderComponent(homeExtent);

    expect(toast.error).toHaveBeenCalledWith("Project Extent was not set correctly. Please zoom in more and try again", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });

  it('should not show any toast if cameraCoordinates are null', async () => {
    const homeExtent = [40, -75, 40, -75];
    const cameraCoordinates = null;

    useCameraCoordinates.mockReturnValue({ cameraCoordinates });

    await renderComponent(homeExtent);

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should a success if cameraCoordinates are not identical to homeExtent and not BAD_EXTENT', async () => {
    const homeExtent = [40, -75, 40, -75];
    const cameraCoordinates = [40, -74, 40, -75];

    useCameraCoordinates.mockReturnValue({ cameraCoordinates });

    await renderComponent(homeExtent);

    expect(toast.success).toHaveBeenCalledWith("Successfully set the Project Extent", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  });
});
