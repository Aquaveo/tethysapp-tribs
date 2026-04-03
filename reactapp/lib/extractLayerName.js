function extractLayerName(layer_url, dataset_id) {
  // "f2c9ebe0-25b3-438f-8531-bada6817c7ef/365970ee-9b8f-4852-9497-df1c4c00b6f1/czml/Mi_mm.czml"
  const visibileLayerDatasetName = layer_url.split("/").slice(-1)[0];
  // Mi_mm.czml
  const layerName = visibileLayerDatasetName.split(".").slice(0)[0];
  // Mi_mm
  return layerName.replace(`${dataset_id}-`, "");
}

export default extractLayerName;