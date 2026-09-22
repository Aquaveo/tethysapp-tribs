import { useEffect, useState } from "react";
import tethysAPI from "react-tethys/services/api/tethys";
import { logout } from "react-tethys/services/api/client";
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
    // The portal navbar renders the "Log Out" control outside React (a plain
    // anchor to /accounts/logout/). Intercept it so we blacklist the refresh
    // token and clear localStorage before the portal ends the session.
    const links = document.querySelectorAll('a[href*="/accounts/logout"]');
    const handler = (e) => {
      e.preventDefault();
      logout(); // blacklist refresh -> clearTokens -> redirect to /accounts/logout/
    };
    links.forEach((el) => el.addEventListener("click", handler));
    return () => links.forEach((el) => el.removeEventListener("click", handler));
  }, []);

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
