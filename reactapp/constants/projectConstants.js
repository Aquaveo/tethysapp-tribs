export const DEFAULT_DATASET_ICON_NAME = "DEFAULT";

export const OPTMESHINPUT = {
  tMesh: 1,
  points: 2,
  arcGridRandom: 3,
  arcGridHex: 4,
  pointsNet: 5,
  pointsLinPnt: 6,
  scratch: 7,
  pointTriangulator: 8,
  largeDomain: 9,
};

export const RAINSOURCE = {
  stageIIIRadar: 1,
  wsiRadar: 2,
  rainGauges: 3,
};

export const RAINDISTRIBUTION = {
  spatiallyDistRadar: 0,
  meanArealPrecipRadar: 1,
};

export const OPTEVAPOTRANS = {
  inactive: 0,
  penmanMonteith: 1,
  deardorff: 2,
  priestlyTaylor: 3,
  panEvaporation: 4,
};

export const OPTSNOW = {
  inactive: 0,
  singleLayer: 1,
};

export const HILLALBOPT = {
  snow: 0,
  landuse: 1,
  dynamic: 2,
};

export const OPTRADSHELT = {
  local: 0,
  remoteDiffuse: 1,
  remoteEntire: 2,
  noSheltering: 3,
};

export const OPTINTERCEPT = {
  inactive: 0,
  canopyStorage: 1,
  canopyWaterBalance: 2,
};

export const OPTLANDUSE = {
  static: 0,
  dynamic: 1,
};

export const OPTLUINTERP = {
  constant: 0,
  linear: 1,
};

export const GFLUXOPTION = {
  inactive: 0,
  tempGradient: 1,
  forceRestore: 2,
};

export const METDATAOPTION = {
  inactive: 0,
  stations: 1,
  hydroMetGrid: 2,
};

export const CONVERTDATA = {
  inactive: 0,
  hydroMet: 1,
  rainGauge: 2,
  dmip: 3,
};

export const OPTBEDROCK = {
  uniform: 0,
  gridded: 1,
};

export const OPTGROUNDWATER = {
  moduleOff: 0,
  moduleOn: 1,
};

export const WIDTHINTERPOLATION = {
  measuredAndObservered: 0,
  measuredOnly: 1,
};

export const OPTGWFILE = {
  grid: 0,
  voronoi: 1,
};

export const OPTRUNON = {
  noRunon: 0,
  runon: 1,
};

export const OPTSOILTYPE = {
  tabular: 0,
  gridded: 1,
};

export const STOCHASTICMODE = {
  inactive: 0,
  mean: 1,
  random: 2,
  sinusoidal: 3,
  meanSine: 4,
  randomSine: 5,
  weatherGenerator: 6,
};

export const OPTRESERVOIR = {
  inactive: 0,
  active: 1,
};

export const OPTPERCOLATION = {
  inactive: 0,
  constantLoss: 1,
  constantLossTransient: 2,
  greenAmpt: 3,
};

export const FORECASTMODE = {
  inactive: 0,
  qpf: 1,
  persistence: 2,
  climatological: 3,
};

export const RESTARTMODE = {
  inactive: 0,
  writeOnly: 1,
  readOnly: 2,
  readAndWrite: 3,
};

export const PARALLELMODE = {
  serial: 0,
  parallel: 1,
};

export const GRAPHOPTION = {
  default: 0,
  reach: 1,
  outlet: 2,
};

export const OPTVIZ = {
  inactive: 0,
  binary: 1,
};

export const OPTSPATIAL = {
  spatialoutputOff: 0,
  spatialoutputOn: 1,
};

export const OPTINTERHYDRO = {
  intermediatehydrographsOff: 0,
  intermediatehydrographsOn: 1,
};

export const OPTHEADER = {
  outputheadersOff: 0,
  outputheadersOn: 1,
};

export const SORT_KEYS = {
  ID: "id",
  CREATED_BY: "created_by",
  DATE_CREATED: "date_created",
  DESCRIPTION: "description",
  DISPLAY_TYPE_PLURAL: "display_type_plural",
  DISPLAY_TYPE_SINGULAR: "display_type_singular",
  NAME: "name",
  SLUG: "slug",
  STATUS: "status",
  TYPE: "type",
  DATASET_TYPE: "dataset_type",
  // Manual is for the option of dragging the datasets in the UI.
  // There is currently no code implemented to use this mode.
  // One way of detecting it would be to set the initial state of the sorted datasets
  // as well as a useRef that can be checked against when the order changes without a sort key change.
  MANUAL: "manual",
};

export const DATASET_GROUPS = {
  MESH: "MESH",
  GIS: "GIS",
  RASTER: "RASTER",
  TABULAR: "TABULAR",
  OUTPUT: "CESIUM",
  OTHER: "OTHER",
};

export const DATASET_TYPE_GROUPED_FOLDERS = [
  // This is for marking the Compound Dataset files
  "TRIBS_GRID_DATA",
  "TRIBS_TABLE_SOIL",
  "SOILGRID_PHYSICAL_SOIL_DATA",
];

export const DATASET_TYPE_TO_NORMALIZED_STRING = {
  // Mesh Data
  TRIBS_TIN: "tRIBS TIN",

  // GIS Data
  FEATURES_SHAPEFILE: "Shapefile",
  TRIBS_SDF_RAIN_GAUGE: "Rain Gauge Station Data File (sdf + mdf)",
  TRIBS_SDF_HYDROMET_STATION: "Meteorological Station Data File (sdf + mdf)",
  TRIBS_METIS: "TRIBS METIS",

  // Raster Data
  RASTER_DISC_ASCII: "Esri ASCII (Discreet)",
  RASTER_CONT_ASCII: "Esri ASCII (Continuous)",
  RASTER_DISC_GEOTIFF: "GeoTIFF (Discreet)",
  RASTER_CONT_GEOTIFF: "GeoTIFF (Continuous)",
  RASTER_RGB_GEOTIFF: "GeoTIFF (RGB)",
  RASTER_DISC_ASCII_TIMESERIES: "Esri ASCII Time Series (Discreet)",
  RASTER_CONT_ASCII_TIMESERIES: "Esri ASCII Time Series (Continuous)",
  RASTER_DISC_GEOTIFF_TIMESERIES: "GeoTIFF Time Series (Discreet)",
  RASTER_CONT_GEOTIFF_TIMESERIES: "GeoTIFF Time Series (Continuous)",
  TRIBS_GRID_DATA: "Grid Data File (gdf)",
  SOILGRID_PHYSICAL_SOIL_DATA: "ISRIC Soil Data",

  // Tabular Data
  TRIBS_MDF_RAIN_GAUGE: "Rain Gauge Data File (mdf)",
  TRIBS_MDF_HYDROMET_STATION: "Meteorological Station Data File (mdf)",
  TRIBS_MDI_RAIN_GAUGE: "Rain Gauge Conversion File (mdi)",
  TRIBS_MDI_HYDROMET_STATION: "Meteorological Data Input File (mdi)",
  TRIBS_NODE_LIST: "Node List (dat)",
  TRIBS_TABLE_LANDUSE: "Landuse Reclassification Table (ldt)",
  TRIBS_TABLE_SOIL: "Soil Reclassification Table (sdt)",
};

export const DATASET_TYPE_MAPS = {
  // Mesh Data
  TRIBS_TIN: DATASET_GROUPS.MESH, // INPUTDATAFILE
  // TRIBS_POINTS: DATASET_GROUPS.MESH, // POINTFILENAME

  // GIS Data
  FEATURES_SHAPEFILE: DATASET_GROUPS.GIS,
  TRIBS_SDF_RAIN_GAUGE: DATASET_GROUPS.GIS,
  TRIBS_SDF_HYDROMET_STATION: DATASET_GROUPS.GIS, // HYDROMETSTATIONS
  TRIBS_METIS: DATASET_GROUPS.GIS, 

  // Raster Data
  RASTER_CONT_ASCII: DATASET_GROUPS.RASTER, // GWATERFILE
  RASTER_DISC_ASCII: DATASET_GROUPS.RASTER, // SOILMAPNAME, LANDMAPNAME
  RASTER_CONT_GEOTIFF: DATASET_GROUPS.RASTER,
  RASTER_DISC_GEOTIFF: DATASET_GROUPS.RASTER,
  RASTER_RGB_GEOTIFF: DATASET_GROUPS.RASTER,
  RASTER_CONT_ASCII_TIMESERIES: DATASET_GROUPS.RASTER, // RAINFILE
  RASTER_DISC_ASCII_TIMESERIES: DATASET_GROUPS.RASTER,
  RASTER_CONT_GEOTIFF_TIMESERIES: DATASET_GROUPS.RASTER,
  RASTER_DISC_GEOTIFF_TIMESERIES: DATASET_GROUPS.RASTER,
  TRIBS_GRID_DATA: DATASET_GROUPS.RASTER,
  SOILGRID_PHYSICAL_SOIL_DATA: DATASET_GROUPS.RASTER,

  // Tabular Data
  TRIBS_MDF_RAIN_GAUGE: DATASET_GROUPS.TABULAR,
  TRIBS_MDF_HYDROMET_STATION: DATASET_GROUPS.TABULAR,
  TRIBS_MDI_RAIN_GAUGE: DATASET_GROUPS.TABULAR,
  TRIBS_MDI_HYDROMET_STATION: DATASET_GROUPS.TABULAR,
  TRIBS_NODE_LIST: DATASET_GROUPS.TABULAR, // HYDRONODELIST, NODEOUTPUTLIST, OUTLETNODELIST
  TRIBS_TABLE_LANDUSE: DATASET_GROUPS.TABULAR, // LANDTABLENAME
  TRIBS_TABLE_SOIL: DATASET_GROUPS.TABULAR, // SOILTABLENAME

  // Output Data
  TRIBS_OUT_MRF: DATASET_GROUPS.OUTPUT, // Mentioned as GIS dataset type in OUTHYDROFILENAME file_database_paths
  TRIBS_OUT_RFT: DATASET_GROUPS.OUTPUT, // Mentioned as GIS dataset type in OUTHYDROFILENAME file_database_paths
  TRIBS_OUT_PIXEL: DATASET_GROUPS.OUTPUT, // Mentioned as GIS dataset type in OUTFILENAME file_database_paths
  TRIBS_OUT_TIME_DYNAMIC: DATASET_GROUPS.OUTPUT, // Mentioned in OUTFILENAME file_database_paths
  TRIBS_OUT_CNTRL: DATASET_GROUPS.OUTPUT, // Mentioned in OUTHYDROFILENAME file_database_paths
  TRIBS_OUT_QOUT: DATASET_GROUPS.OUTPUT, // Mentioned in OUTHYDROFILENAME file_database_paths
  TRIBS_OUT_TIME_INTEGRATED: DATASET_GROUPS.OUTPUT, // Mentioned in OUTFILENAME file_database_paths
  TRIBS_OUT_STATIONS: DATASET_GROUPS.OUTPUT,
};

export const KEY_NAME_TO_DATASET_TYPE_MAP = {
  // This is for datasets that should be a general type but don't need to be restricted
  // The key names come from the scenarios
  INPUTDATAFILE: DATASET_TYPE_MAPS.TRIBS_TIN,
  // POINTFILENAME: DATASET_TYPE_MAPS.TRIBS_POINTS,
  RAINFILE: DATASET_TYPE_MAPS.RASTER_CONT_ASCII_TIMESERIES,
  TEMP_GIS_KEY_NAME: DATASET_TYPE_MAPS.FEATURES_SHAPEFILE,
};

export const RESTRICTED_DATASET_TYPES = {
  // This is for datasets that have a restricted dataset type
  SOILMAPNAME: [
    "RASTER_CONT_ASCII",
    "RASTER_DISC_ASCII",
    "RASTER_CONT_ASCII_TIMESERIES",
    "RASTER_DISC_ASCII_TIMESERIES",
  ],
  LANDMAPNAME: [
    "RASTER_CONT_ASCII",
    "RASTER_DISC_ASCII",
    "RASTER_CONT_ASCII_TIMESERIES",
    "RASTER_DISC_ASCII_TIMESERIES",
  ],
  SOILTABLENAME: "TRIBS_TABLE_SOIL",
  LANDTABLENAME: "TRIBS_TABLE_LANDUSE",
  LUGRID: ["TRIBS_GRID_DATA"],
  SCGRID: ["TRIBS_GRID_DATA"],
  HYDROMETGRID: ["TRIBS_GRID_DATA"],
  HYDROMETSTATIONS: ["TRIBS_SDF_HYDROMET_STATION"],
  GAUGESTATIONS: ["TRIBS_SDF_RAIN_GAUGE"],
  NODEOUTPUTLIST: ["TRIBS_NODE_LIST"],
  HYDRONODELIST: ["TRIBS_NODE_LIST"],
  OUTLETNODELIST: ["TRIBS_NODE_LIST"],
  RESTARTFILE: ["TRIBS_RESTART_FILES"],
  GWATERFILE: [
    "RASTER_CONT_ASCII",
    "RASTER_DISC_ASCII",
    "RASTER_CONT_ASCII_TIMESERIES",
    "RASTER_DISC_ASCII_TIMESERIES",
    "CSV_FILE",
  ],
};

export const KEY_NAME_TO_GENERAL_DATASET_TYPE_MAP = {
  // This is for allowing the FileSelect component in the Model Control
  // to open the correct Dataset upload modal.
  INPUTDATAFILE: DATASET_TYPE_MAPS.TRIBS_TIN,
  POINTFILENAME: DATASET_TYPE_MAPS.TRIBS_POINTS,
  HYDROMETSTATIONS: DATASET_TYPE_MAPS.TRIBS_SDF_HYDROMET_STATION,
  SOILMAPNAME: DATASET_TYPE_MAPS.RASTER_DISC_ASCII,
  LANDMAPNAME: DATASET_TYPE_MAPS.RASTER_DISC_ASCII,
  GWATERFILE: DATASET_TYPE_MAPS.RASTER_CONT_ASCII,
  RAINFILE: DATASET_TYPE_MAPS.RASTER_CONT_ASCII_TIMESERIES,
  SOILTABLENAME: DATASET_TYPE_MAPS.TRIBS_TABLE_SOIL,
  LANDTABLENAME: DATASET_TYPE_MAPS.TRIBS_TABLE_LANDUSE,
  NODEOUTPUTLIST: DATASET_TYPE_MAPS.TRIBS_NODE_LIST,
  HYDRONODELIST: DATASET_TYPE_MAPS.TRIBS_NODE_LIST,
  OUTLETNODELIST: DATASET_TYPE_MAPS.TRIBS_NODE_LIST,
  TEMP_GIS_KEY_NAME: DATASET_TYPE_MAPS.FEATURES_SHAPEFILE,
};
