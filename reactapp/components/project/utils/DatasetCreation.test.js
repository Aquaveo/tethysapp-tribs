import { serialized_project } from "config/tests/mocks/projectContext";
import { filterDatasets } from "./DatasetCreation";
import * as ProjectConstants from "constants/projectConstants";

describe("filterDatasets", () => {
  it("should create a new mesh for MESH datasets", () => {
    const datasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.MESH).datasets;
    expect(datasets).toHaveLength(1);

    const meshDataset = datasets[0];
    expect(meshDataset).toHaveProperty('id');
    expect(meshDataset).toHaveProperty('name');
    expect(meshDataset.name).toEqual("TIN");
  });

  it("return an empty array for MESH datasets if datasets doesn't have any matches", () => {
    const nonMeshDatasets = serialized_project.datasets.filter(
      (dataset) => 
        ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type] !== ProjectConstants.DATASET_GROUPS.MESH
    );
    const datasets = filterDatasets(nonMeshDatasets, ProjectConstants.DATASET_GROUPS.MESH);
    expect(datasets).toStrictEqual({"datasets": [], "name": "Mesh Data"});
  });

  it("should create a new mesh for GIS datasets", () => {
    const datasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.GIS);
    expect(datasets).toHaveLength(2);

    const gisDataset = datasets[0];
    expect(gisDataset).toHaveProperty("id");
    expect(gisDataset).toHaveProperty("name");
    expect(gisDataset.name).toEqual("GIS Dataset");
  });

  it("return an empty array for GIS datasets if datasets doesn't have any matches", () => {
    const nonMeshDatasets = serialized_project.datasets.filter(
      (dataset) => 
        ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type] !== ProjectConstants.DATASET_GROUPS.GIS
    );
    const datasets = filterDatasets(nonMeshDatasets, ProjectConstants.DATASET_GROUPS.GIS);
    expect(datasets).toStrictEqual([]);
  });

  it("should create a new mesh for RASTER datasets", () => {
    const datasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.RASTER);
    expect(datasets).toHaveLength(4);

    const rasterDataset = datasets[0];
    expect(rasterDataset).toHaveProperty('id');
    expect(rasterDataset).toHaveProperty('name');
    expect(rasterDataset.name).toEqual("Groundwater Grid");
  });

  it("return an empty array for RASTER datasets if datasets doesn't have any matches", () => {
    const nonMeshDatasets = serialized_project.datasets.filter(
      (dataset) => 
        ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type] !== ProjectConstants.DATASET_GROUPS.RASTER
    );
    const datasets = filterDatasets(nonMeshDatasets, ProjectConstants.DATASET_GROUPS.RASTER);
    expect(datasets).toStrictEqual([]);
  });

  it("should create a new mesh for Tabular datasets", () => {
    const datasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.TABULAR);
    expect(datasets).toHaveLength(5);

    const tabularDataset = datasets[0];
    expect(tabularDataset).toHaveProperty('id');
    expect(tabularDataset).toHaveProperty('name');
    expect(tabularDataset.name).toEqual("Interior Node Output List");
  });

  it("return an empty array for TABULAR datasets if datasets doesn't have any matches", () => {
    const nonMeshDatasets = serialized_project.datasets.filter(
      (dataset) => 
        ProjectConstants.DATASET_TYPE_MAPS[dataset.dataset_type] !== ProjectConstants.DATASET_GROUPS.TABULAR
    );
    const datasets = filterDatasets(nonMeshDatasets, ProjectConstants.DATASET_GROUPS.TABULAR);
    expect(datasets).toStrictEqual([]);
  });

  it("Should return only OTHER group datasets", () => {
    // The OTHER group is currently set to be Output data or any dataset that doesn't have a dataset_type.
    const datasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.OTHER);
    expect(datasets).toHaveLength(7);

    const otherDataset = datasets[0];
    expect(otherDataset).toHaveProperty("id");
    expect(otherDataset).toHaveProperty("dataset_type");
    expect(otherDataset.dataset_type).toBe("TRIBS_OUT_MRF");
  });
});

describe("createNewRaster", () => {
  it("should create new raster datasets with correct properties", () => {
    const rasterDatasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.RASTER);

    rasterDatasets.forEach(rasterDataset => {
      expect(rasterDataset).toHaveProperty("id");
      expect(rasterDataset).toHaveProperty("name");
      expect(rasterDataset).toHaveProperty("file");
      expect(rasterDataset).toHaveProperty("_data");
      expect(rasterDataset).toHaveProperty("_status");
      expect(rasterDataset).toHaveProperty("viz");
    });
  });
});

describe("createNewTabular", () => {
  it("should create new tabular datasets with correct properties", () => {
    const tabularDatasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.TABULAR);

    tabularDatasets.forEach(tabularDataset => {
      expect(tabularDataset).toHaveProperty('id');
      expect(tabularDataset).toHaveProperty('name');
      expect(tabularDataset).toHaveProperty('file');
      expect(tabularDataset).toHaveProperty('_data');
      expect(tabularDataset).toHaveProperty('_status');
    });
  });
});

describe("createNewGis", () => {
  it("should create new gis datasets with correct properties", () => {
    const gisDatasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.GIS);

    gisDatasets.forEach(gisDataset => {
      expect(gisDataset).toHaveProperty("id");
      expect(gisDataset).toHaveProperty("name");
      expect(gisDataset).toHaveProperty("file");
      expect(gisDataset).toHaveProperty("_data");
      expect(gisDataset).toHaveProperty("_status");
      expect(gisDataset).toHaveProperty("viz");
    });
  });
});

describe("createNewMesh", () => {
  it("should create new mesh datasets with correct properties", () => {
    const meshDatasets = filterDatasets(serialized_project.datasets, ProjectConstants.DATASET_GROUPS.MESH);

    meshDatasets.datasets.forEach(meshDataset => {
      expect(meshDataset).toHaveProperty("id");
      expect(meshDataset).toHaveProperty("name");
      expect(meshDataset).toHaveProperty("datasets");
      expect(meshDataset).toHaveProperty("viz")

      meshDataset.datasets.forEach(dataset => {
        expect(dataset).toHaveProperty("id")
        expect(dataset).toHaveProperty("name")
      })
    });
  });
});
