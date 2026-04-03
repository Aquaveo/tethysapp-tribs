import { useEffect, useRef, useMemo } from "react";

const useOnUpdate = (callback, deps) => {
  const isFirstRender = useRef(true);
  // Serialize deps into a stable value that changes only when deps change.
  // Might need a more sophisticated serializer or a custom solution
  // especially if deps includes functions or circular references.
  const depsSerialized = useMemo(() => JSON.stringify(deps), [deps]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return
    } else {
      callback();
    }
  }, [callback, depsSerialized]);
};

export default useOnUpdate;
