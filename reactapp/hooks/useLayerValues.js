import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { fetchValues } from "lib/layerValues";

/**
 * The values file of a value-layer variable (see lib/layerValues.js) with its loading state:
 * { values, loading }. `values` is the parsed file, or null while it loads, when there is no url or when it could
 * not be loaded (the user is told). `loading` is true only while the file of this url is on its way, so a caller can
 * tell "not there yet" from "not there". The result is tagged with its url so the values of the previously selected
 * variable are never returned for the new one.
 */
export function useLayerValuesState(url) {
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
        if (!current) return; // the layer is no longer shown, or shows another variable
        // One message per file, however many components show it (the map layer and its legend)
        toast.error("Could not load the values of this layer. Its features are shown without colors.", {
          toastId: `layer-values-${url}`,
        });
        setLoaded({ url, values: null });
      });
    return () => {
      current = false;
    };
  }, [url]);

  const settled = loaded?.url === url;
  return { values: settled ? loaded.values : null, loading: Boolean(url) && !settled };
}

/** The parsed values file of a value-layer variable, or null (loading, no url, or it could not be loaded). */
export default function useLayerValues(url) {
  return useLayerValuesState(url).values;
}
