import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { fetchValues } from "lib/layerValues";

/**
 * The parsed values file of a value-layer variable (see lib/layerValues.js), or null while it loads, when there is
 * no url or when it could not be loaded (the user is told). The result is tagged with its url so the values of the previously selected
 * variable are never returned for the new one.
 */
export default function useLayerValues(url) {
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!url) return undefined;
    let current = true;
    fetchValues(url)
      .then((values) => {
        if (current) setLoaded({ url, values });
      })
      .catch((error) => {
        console.error(error);
        // One message per file, however many components show it (the map layer and its legend)
        toast.error("Could not load the values of this layer. Its features are shown without colors.", {
          toastId: `layer-values-${url}`,
        });
        if (current) setLoaded(null);
      });
    return () => {
      current = false;
    };
  }, [url]);

  return loaded?.url === url ? loaded.values : null;
}
