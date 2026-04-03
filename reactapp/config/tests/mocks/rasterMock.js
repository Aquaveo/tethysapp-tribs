import newUUID from "lib/uuid";

export function makeRaster(name) {
  return {
    id: newUUID(),
    name: name,
    viz: {
      type: "wms",
      url: "http://localhost:8181/geoserver/wms",
      layer: "topp:states",
      extent: [
        -124.914551,
        24.766785,
        -67.412109,
        49.15297
      ]
    }
  };
}
