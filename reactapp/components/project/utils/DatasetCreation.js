import * as ProjectConstants from "constants/projectConstants";

export function sortDatasetsByKey(datasets, key = "name", ascending = true) {
  const locale = undefined;
  const sorted_datasets = [...datasets].sort((a, b) => {
    if (typeof a[key] === "number" && typeof b[key] === "number") {
      return a[key].localeCompare(b[key], locale, { numeric: true });
    }
    return a[key].localeCompare(b[key], locale);
  });

  if (!ascending) {
    return sorted_datasets.reverse();
  }
  return sorted_datasets;
}

export function filterDatasets(datasets, filter_key, sort_key = "name", ascending = true) {
  let filtered_datasets = datasets.filter(
    (dataset) => ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type] === filter_key
  )
  if (filter_key === ProjectConstants.DATASET_GROUPS.OTHER) {
    filtered_datasets = datasets.filter(
      (dataset) => {
        const dataset_group = ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type]
        return !dataset_group ||
        dataset_group === ProjectConstants.DATASET_GROUPS.OUTPUT;
      }
    )
  }
  let sorted_datasets = sortDatasetsByKey(filtered_datasets, sort_key, ascending);

  if (filter_key === ProjectConstants.DATASET_GROUPS.MESH) {
    if (filtered_datasets.length === 0) {
      return ({
        name: "Mesh Data",
        datasets: [],
      })
    }
    const mesh = loadMesh(sorted_datasets);
    const meshObject = {
      name: "Mesh Data",
      datasets: mesh,
    }
    return meshObject;
  } else if (filter_key === ProjectConstants.DATASET_GROUPS.GIS) {
    if (filtered_datasets.length === 0) {
      return []
    }
    const gis = loadGis(sorted_datasets);
    return gis;
  } else if (filter_key === ProjectConstants.DATASET_GROUPS.RASTER) {
    if (filtered_datasets.length === 0) {
      return []
    }
    const raster = loadRaster(sorted_datasets);
    return raster;
  } else if (filter_key === ProjectConstants.DATASET_GROUPS.TABULAR) {
    if (filtered_datasets.length === 0) {
      return []
    }
    const tabular = loadTabular(sorted_datasets);
    return tabular;
  } else {
    return sorted_datasets.map(
      (sorted_dataset) => ({
        ...sorted_dataset,
        date_created: new Date(sorted_dataset.date_created)
      })
    );
  }
}

export function loadRaster(datasets) {
  return datasets.map((dataset) => {
    return ({
      ...dataset,
      id: dataset.id,
      name: dataset.name,
      file: "file",
      dataset_type: dataset.dataset_type,
      _data: { value: "stl", type: "stl" },
      _status: "new",
      viz: dataset.viz,
    });
  }).flat();  
}

export function loadGis(datasets) {
  return datasets.map((dataset) => {
    return ({
      ...dataset,
      id: dataset.id,
      name: dataset.name,
      file: "file",
      dataset_type: dataset.dataset_type,
      _data: { value: "stl", type: "stl" },
      _status: "new",
      viz: dataset.viz,
    });
  }).flat();  
}

export function loadTabular(datasets) {
  return datasets.map((dataset) => {
    return ({
      ...dataset,
      id: dataset.id,
      name: dataset.name,
      file: "file",
      dataset_type: dataset.dataset_type,
      _data: { value: "stl", type: "stl" },
      _status: "new",
    });
  }).flat();
}

export function loadMesh(datasets) {
  const groupedDatasets = datasets.map((dataset) => {
    // TODO Update this to use the ACTUAL Z dataset and Soil Moisture when that data becomes available
    // const default_object = ["Z"];
    // const mesh_datasets = default_object.map((file_name) => ({
    //   id: dataset.id, // TODO Update this too (see above)
    //   name: file_name,
    //   viz: dataset.viz, // TODO Update this too (see above)
    // }));
    const mesh_datasets = [];

    return({
      ...dataset,
      id: dataset.id,
      name: dataset.name,
      datasets: mesh_datasets,
      dataset_type: dataset.dataset_type,
      viz: dataset.viz,
    })
  });
  return groupedDatasets;
}
