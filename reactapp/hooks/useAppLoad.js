import { useEffect, useState } from "react";
import tethysAPI from "react-tethys/services/api/tethys";
import Backend from "services/Backend";

export const APP_ID = process.env.TETHYS_APP_ID;
export const LOADER_DELAY = process.env.TETHYS_LOADER_DELAY;
export const TETHYS_APP_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;

export function useAppLoad() {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appContext, setAppContext] = useState(null);

  const handleError = (error) => {
    // Delay setting the error to avoid flashing the loading animation
    setTimeout(() => {
      setError(error);
    }, LOADER_DELAY);
  };

  useEffect(() => {
    Promise.all([
      tethysAPI.getAppData(APP_ID),
      tethysAPI.getUserData(),
      tethysAPI.getJWTToken(),
    ])
      .then(([tethysApp, user, jwt]) => {
        if (!jwt.access) {
          // /api/token/ returns 200 with nulls when not logged in
          window.location.assign(
            `/accounts/login?next=${window.location.pathname}`
          );
          return;
        }

        // Setup backend
        const backend = new Backend(TETHYS_APP_ROOT_URL);

        backend.connect(() => {
          console.log("Connected to backend.");
          setAppContext({
            tethysApp,
            user,
            jwtToken: jwt,
            backend,
          });

          // Allow for minimum delay to display loader
          setTimeout(() => {
            setIsLoaded(true);
          }, LOADER_DELAY);
        });
      })
      .catch(handleError);
  }, []);

  return { isLoaded, appContext, error };
}
