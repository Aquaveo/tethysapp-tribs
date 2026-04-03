export const serialized_project = {
    "id": "15095388-81b1-4c7a-acb0-4014bf0ea00d",
    "attributes": {
        "file_database_id": "ba0b5a1e-8020-49eb-b253-909cc3f503d9"
    },
    "created_by": "_staff_user",
    "date_created": new Date("2023-12-12T16:54:56.560536"),
    "description": "",
    "display_type_plural": "Projects",
    "display_type_singular": "Project",
    "locked": false,
    "name": "SALAS",
    "organizations": [
        {
            "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
            "name": "Aquaveo"
        }
    ],
    "public": false,
    "slug": "projects",
    "status": null,
    "type": "project_resource",
    "datasets": [
        {
            "id": "2753b50b-5d69-494d-a99f-75ef23eac55a",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.512801"),
            "description": "Time-Integrated Variable Output for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Time-Integrated Variable Output",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_TIME_INTEGRATED"
        },
        {
            "id": "200ecc7f-8c01-4d58-ad7b-50290a949f59",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:38.217724"),
            "description": "Hydromet Station Data for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Hydromet Station Data",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_SDF_HYDROMET_STATION"
        },
        {
            "id": "95bb70ff-d91c-4808-876b-ca7b04bc0cee",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:38.293196"),
            "description": "Land Use Grid for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Land Use Grid",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "RASTER_DISC_ASCII"
        },
        {
            "id": "7a3688c0-3c24-4b65-8008-2748ae07999a",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:38.367918"),
            "description": "Soil Reclassification Table for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Soil Reclassification Table",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_TABLE_SOIL"
        },
        {
            id: '7b5c1ff1-1ece-4903-a16c-8c63a68da3c9',
            name: 'GIS Dataset',
            type: 'dataset_resource',
            locked: false,
            status: 'Complete',
            attributes: {},
            created_by: '_staff_user',
            date_created: "2024-10-19T00:47:36.279Z",
            description: '',
            display_type_plural: 'Datasets',
            display_type_singular: 'Dataset',
            organizations: [ { id: 'f1a4cb9c-f459-4373-a05b-75764beae970', name: 'Test' } ],
            public: false,
            slug: 'datasets',
            viz: {
              type: 'wms',
              url: 'http://localhost:8181/geoserver/wms/',
              layer: 'tribs:d7acd6c0-8f85-4a05-b53d-44aa46603710',
              extent: [
                -111.65440426486374,
                34.57955911078993,
                -111.58361694982506,
                34.636153749951596
              ],
              origin: null
            },
            dataset_type: 'FEATURES_SHAPEFILE',
            srid: '32612'
        },        
        {
            "id": "6907d792-26fb-43ee-9c05-d356735fd3f8",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:38.626626"),
            "description": "Radar Rainfall Grids for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Radar Rainfall Grids",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "RASTER_CONT_ASCII_TIMESERIES"
        },
        {
            "id": "abe094da-7772-4de2-8259-d889c1c4ed46",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.317648"),
            "description": "Groundwater Grid for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Groundwater Grid",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "RASTER_CONT_ASCII"
        },
        {
            "id": "4e9af351-978c-4ca2-accf-b811d4a7baed",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.422330"),
            "description": "Soil Grid for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Soil Grid",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "RASTER_DISC_ASCII"
        },
        {
            "id": "76174e70-0640-4108-9c01-ab61dafcba75",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.517679"),
            "description": "Land Use Reclassification Table for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Land Use Reclassification Table",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_TABLE_LANDUSE"
        },
        {
            "id": "2508e47b-e6dd-41da-9784-461049f013c3",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.620460"),
            "description": "TIN for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "TIN",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_TIN"
        },
        {
            "id": "85e571ea-93b8-41f3-ad41-cbc0fc265357",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.843946"),
            "description": "Interior Node Output List for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Interior Node Output List",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_NODE_LIST"
        },
        {
            "id": "60ee1e0d-b727-4245-94c3-0b99d1836ea7",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:40.948507"),
            "description": "Node Output List for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Node Output List",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_NODE_LIST"
        },
        {
            "id": "81ef8cd4-2501-46cb-a545-be9c89f015ab",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:41.037529"),
            "description": "Runtime Node Output List for SALAS A.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Runtime Node Output List",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_NODE_LIST"
        },
        {
            "id": "d6248310-b374-49d9-88d6-a86e0e2ccc9d",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.038013"),
            "description": "Basin Averaged Hydrograph File for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Basin Averaged Hydrograph File",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_MRF"
        },
        {
            "id": "d1a4cec2-554b-4695-89a4-4482e562c3af",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.110038"),
            "description": "Control File for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Control File",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_CNTRL"
        },
        {
            "id": "43887c74-7928-4719-a13f-f6985a690839",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.184694"),
            "description": "Hydrograph Runoff Types File for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Hydrograph Runoff Types File",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_RFT"
        },
        {
            "id": "618189e8-400d-4910-9dc7-a45d925d0810",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.261821"),
            "description": "Qout File for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Qout File",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_QOUT"
        },
        {
            "id": "2627de66-2508-4391-850e-59333c7fa5d6",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.370081"),
            "description": "Time-Dynamic Variable Output for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Time-Dynamic Variable Output",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_TIME_DYNAMIC"
        },
        {
            "id": "44d36f74-1e70-40f8-a66d-25e3c5645936",
            "attributes": {},
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:56:10.639572"),
            "description": "Node Dynamic Output for SALAS A 1.",
            "display_type_plural": "Datasets",
            "display_type_singular": "Dataset",
            "locked": false,
            "name": "Node Dynamic Output",
            "organizations": [],
            "public": false,
            "slug": "datasets",
            "status": null,
            "type": "dataset_resource",
            "dataset_type": "TRIBS_OUT_PIXEL"
        }
    ],
    "scenarios": [
        {
            "id": "94d9eaf6-1710-4224-bfd3-4f61d3f9391d",
            "attributes": {
                "srid": "26913",
                "files": [
                    "/home/tethysdev/tethysapp-tribs/tethysapp/tribs/workspaces/app_workspace/94d9eaf6-1710-4224-bfd3-4f61d3f9391d/SALAS.zip"
                ]
            },
            "created_by": "_staff_user",
            "date_created": new Date("2023-12-12T16:55:37.981343"),
            "description": "",
            "display_type_plural": "Scenarios",
            "display_type_singular": "Scenario",
            "locked": false,
            "name": "SALAS A",
            "organizations": [
                {
                    "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                    "name": "Aquaveo"
                }
            ],
            "public": false,
            "slug": "scenarios",
            "status": null,
            "type": "scenario_resource",
            "input_file": {
                "file_name": "salas.in",
                "run_parameters": {
                    "time_variables": {
                        "STARTDATE": new Date("2004-06-01T00:00:00"),
                        "RUNTIME": 700,
                        "TIMESTEP": 3.75,
                        "GWSTEP": 7.5,
                        "METSTEP": 60,
                        "ETISTEP": 60,
                        "RAININTRVL": 1,
                        "OPINTRVL": 1,
                        "SPOPINTRVL": 10,
                        "INTSTORMMAX": 8760,
                        "RAINSEARCH": 2400
                    },
                    "routing_variables": {
                        "BASEFLOW": 0.01,
                        "VELOCITYCOEF": 0.5,
                        "VELOCITYRATIO": 5,
                        "KINEMVELCOEF": 0.1,
                        "FLOWEXP": 1e-7,
                        "CHANNELROUGHNESS": 0.15,
                        "CHANNELWIDTH": 10,
                        "CHANNELWIDTHCOEFF": 1,
                        "CHANNELWIDTHEXPNT": 0.3,
                        "CHANNELWIDTHFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    },
                    "meteorological_variables": {
                        "TLINKE": 2,
                        "MINSNTEMP": -27,
                        "TEMPLAPSE": -0.0065,
                        "PRECLAPSE": 0,
                        "SNLIQFRAC": 0.6
                    }
                },
                "run_options": {
                    "OPTMESHINPUT": 2,
                    "RAINSOURCE": 2,
                    "OPTEVAPOTRANS": 1,
                    "OPTSNOW": 1,
                    "HILLALBOPT": 2,
                    "OPTRADSHELT": 0,
                    "OPTINTERCEPT": 2,
                    "OPTLANDUSE": 1,
                    "OPTLUINTERP": 1,
                    "GFLUXOPTION": 2,
                    "METDATAOPTION": 1,
                    "CONVERTDATA": 0,
                    "OPTBEDROCK": 0,
                    "OPTGROUNDWATER": 0,
                    "WIDTHINTERPOLATION": 0,
                    "OPTGWFILE": 0,
                    "OPTRUNON": 0,
                    "OPTRESERVOIR": 0,
                    "OPTSOILTYPE": 0,
                    "OPTPERCOLATION": 0
                },
                "files_and_pathnames": {
                    "mesh_generation": {
                        "INPUTDATAFILE": {
                            "resource_id": "2508e47b-e6dd-41da-9784-461049f013c3",
                            "file_collection_id": "0e7abec5-fbf9-4f21-9017-1e16d349d333",
                            "file_collection_paths": [
                                "salas.z",
                                "salas_voi",
                                "salas_width",
                                "salas.tri",
                                "salas_area",
                                "salas.nodes",
                                "salas_reach",
                                "salas.edges"
                            ],
                            "path": "Output/voronoi/salas"
                        },
                        "POINTFILENAME": {
                            "resource_id": "d3045596-08f8-4514-8048-14c06e7e2155",
                            "file_collection_id": "4e86ed86-90bc-4571-9faa-1b497afed8c8",
                            "file_collection_paths": [
                                "salas.points"
                            ],
                            "path": "Input/salas.points"
                        },
                        "INPUTTIME": 0,
                        "ARCINFOFILENAME": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    },
                    "resampling_grids": {
                        "SOILTABLENAME": {
                            "resource_id": "7a3688c0-3c24-4b65-8008-2748ae07999a",
                            "file_collection_id": "31a6656c-ba1c-4fee-888b-f1781babd69f",
                            "file_collection_paths": [
                                "salas.sdt"
                            ],
                            "path": "Input/salas.sdt"
                        },
                        "SOILMAPNAME": {
                            "resource_id": "4e9af351-978c-4ca2-accf-b811d4a7baed",
                            "file_collection_id": "3724c51d-17f2-4628-861b-4cc31948811e",
                            "file_collection_paths": [
                                "salas.soi"
                            ],
                            "path": "Input/salas.soi"
                        },
                        "LANDTABLENAME": {
                            "resource_id": "76174e70-0640-4108-9c01-ab61dafcba75",
                            "file_collection_id": "7f82e099-ad34-4057-accc-8a3b37a69f54",
                            "file_collection_paths": [
                                "salas.ldt"
                            ],
                            "path": "Input/salas.ldt"
                        },
                        "LANDMAPNAME": {
                            "resource_id": "95bb70ff-d91c-4808-876b-ca7b04bc0cee",
                            "file_collection_id": "6d6bdd21-ef45-421e-82e0-05177680c3ae",
                            "file_collection_paths": [
                                "salas.lan"
                            ],
                            "path": "Input/salas.lan"
                        },
                        "GWATERFILE": {
                            "resource_id": "abe094da-7772-4de2-8259-d889c1c4ed46",
                            "file_collection_id": "6d118c0f-e808-44c7-b199-45bb4791b1f7",
                            "file_collection_paths": [
                                "salas.iwt"
                            ],
                            "path": "Input/salas.iwt"
                        },
                        "DEMFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "RAINFILE": {
                            "resource_id": "6907d792-26fb-43ee-9c05-d356735fd3f8",
                            "file_collection_id": "548c3fc9-2b63-4c5b-9921-1ea55e2c34b6",
                            "file_collection_paths": [
                                "p0625200409.txt",
                                "p0605200414.txt",
                                "p0624200415.txt",
                                "p0616200401.txt",
                                "p0601200411.txt",
                                "p0623200403.txt",
                                "p0612200414.txt",
                                "p0619200416.txt",
                                "p0616200421.txt",
                                "p0616200400.txt",
                                "p0615200412.txt",
                                "p0623200420.txt",
                                "p0611200411.txt",
                                "p0610200417.txt"
                            ],
                            "path": "Rain/p"
                        },
                        "RAINEXTENSION": "txt",
                        "DEPTHTOBEDROCK": 5,
                        "BEDROCKFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Input/salas.brd"
                        },
                        "LUGRID": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "SCGRID": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    },
                    "meteorological_data": {
                        "HYDROMETSTATIONS": {
                            "resource_id": "200ecc7f-8c01-4d58-ad7b-50290a949f59",
                            "file_collection_id": "c2c3e46a-4c98-475a-9965-0c14cb146258",
                            "file_collection_paths": [
                                "weatherC1601_2004.mdf",
                                "weatherC1601_2004.sdf"
                            ],
                            "path": "Weather/weatherC1601_2004.sdf"
                        },
                        "HYDROMETGRID": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Weather/"
                        },
                        "HYDROMETCONVERT": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Weather/"
                        },
                        "HYDROMETBASENAME": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Weather/weatherField"
                        },
                        "GAUGESTATIONS": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Rain/rainGauge.sdf"
                        },
                        "GAUGECONVERT": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "GAUGEBASENAME": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    },
                    "output_data": {
                        "OUTFILENAME": {
                            "file_database_paths": [],
                            "path": "Output/voronoi/salas"
                        },
                        "OUTHYDROFILENAME": {
                            "file_database_paths": [],
                            "path": "Output/hyd/salas"
                        },
                        "OUTHYDROEXTENSION": "mrf",
                        "RIBSHYDOUTPUT": 0,
                        "NODEOUTPUTLIST": {
                            "resource_id": "60ee1e0d-b727-4245-94c3-0b99d1836ea7",
                            "file_collection_id": "cf9447e4-99b5-4263-83b7-49f0276c1c03",
                            "file_collection_paths": [
                                "pNodes.dat"
                            ],
                            "path": "Input/Nodes/pNodes.dat"
                        },
                        "HYDRONODELIST": {
                            "resource_id": "81ef8cd4-2501-46cb-a545-be9c89f015ab",
                            "file_collection_id": "b796ca8d-9269-49ac-9d4f-1c624fedd7ae",
                            "file_collection_paths": [
                                "hNodes.dat"
                            ],
                            "path": "Input/Nodes/hNodes.dat"
                        },
                        "OUTLETNODELIST": {
                            "resource_id": "85e571ea-93b8-41f3-ad41-cbc0fc265357",
                            "file_collection_id": "31b3dbe1-b6ca-4e1a-b384-51938e5083ac",
                            "file_collection_paths": [
                                "oNodes.dat"
                            ],
                            "path": "Input/Nodes/oNodes.dat"
                        },
                        "OPTSPATIAL": 0,
                        "OPTINTERHYDRO": 0,
                        "OPTHEADER": 0,
                    },
                    "reservoir_data": {
                        "RESPOLYGONID": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "RESDATA": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    }
                },
                "modes": {
                    "rainfall_forecasting": {
                        "FORECASTMODE": 0,
                        "FORECASTTIME": null,
                        "FORECASTLEADTIME": null,
                        "FORECASTLENGTH": null,
                        "FORECASTFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "CLIMATOLOGY": null,
                        "RAINDISTRIBUTION": 0
                    },
                    "stochastic_climate_forcing": {
                        "STOCHASTICMODE": 0,
                        "PMEAN": 0,
                        "STDUR": 0,
                        "ISTDUR": 0,
                        "SEED": 11,
                        "PERIOD": 0,
                        "MAXPMEAN": 0,
                        "MAXSTDURMN": 0,
                        "MAXISTDURMN": 0,
                        "WEATHERTABLENAME": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": "Input/pramsWG.T"
                        }
                    },
                    "restart": {
                        "RESTARTMODE": 1,
                        "RESTARTINTRVL": 8760,
                        "RESTARTDIR": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        },
                        "RESTARTFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    },
                    "parallel": {
                        "PARALLELMODE": 1,
                        "GRAPHOPTION": 0,
                        "GRAPHFILE": {
                            "resource_id": null,
                            "file_collection_id": null,
                            "file_collection_paths": [],
                            "path": ""
                        }
                    }
                },
                "visualization": {
                    "OPTVIZ": 0,
                    "OUTVIZFILENAME": {
                        "resource_id": null,
                        "file_collection_id": null,
                        "file_collection_paths": [],
                        "path": ""
                    }
                }
            },
            "linked_datasets": [
                {
                    "id": "200ecc7f-8c01-4d58-ad7b-50290a949f59",
                    "name": "Hydromet Station Data"
                },
                {
                    "id": "95bb70ff-d91c-4808-876b-ca7b04bc0cee",
                    "name": "Land Use Grid"
                },
                {
                    "id": "7a3688c0-3c24-4b65-8008-2748ae07999a",
                    "name": "Soil Reclassification Table"
                },
                {
                    "id": "6907d792-26fb-43ee-9c05-d356735fd3f8",
                    "name": "Radar Rainfall Grids"
                },
                {
                    "id": "abe094da-7772-4de2-8259-d889c1c4ed46",
                    "name": "Groundwater Grid"
                },
                {
                    "id": "4e9af351-978c-4ca2-accf-b811d4a7baed",
                    "name": "Soil Grid"
                },
                {
                    "id": "76174e70-0640-4108-9c01-ab61dafcba75",
                    "name": "Land Use Reclassification Table"
                },
                {
                    "id": "2508e47b-e6dd-41da-9784-461049f013c3",
                    "name": "TIN"
                },
                {
                    "id": "d3045596-08f8-4514-8048-14c06e7e2155",
                    "name": "Point File"
                },
                {
                    "id": "85e571ea-93b8-41f3-ad41-cbc0fc265357",
                    "name": "Interior Node Output List"
                },
                {
                    "id": "60ee1e0d-b727-4245-94c3-0b99d1836ea7",
                    "name": "Node Output List"
                },
                {
                    "id": "81ef8cd4-2501-46cb-a545-be9c89f015ab",
                    "name": "Runtime Node Output List"
                }
            ],
            "realizations": [
                {
                    "id": "0b1d0ba4-349d-4844-afac-6f66ec369cb2",
                    "attributes": {
                        "files": [
                            "/home/tethysdev/tethysapp-tribs/tethysapp/tribs/workspaces/app_workspace/0b1d0ba4-349d-4844-afac-6f66ec369cb2/SALAS.zip"
                        ]
                    },
                    "created_by": "_staff_user",
                    "date_created": new Date("2023-12-12T16:56:09.828328"),
                    "description": "",
                    "display_type_plural": "Realizations",
                    "display_type_singular": "Realization",
                    "locked": false,
                    "name": "SALAS A 1",
                    "organizations": [
                        {
                            "id": "91b11d78-17f8-44bd-859f-2004ad8a37f4",
                            "name": "Aquaveo"
                        }
                    ],
                    "public": false,
                    "slug": "realizations",
                    "status": null,
                    "type": "realization_resource",
                    "input_file": {
                        "file_name": "salas.in",
                        "run_parameters": {
                            "time_variables": {
                                "STARTDATE": new Date("2004-06-01T00:00:00"),
                                "RUNTIME": 700,
                                "TIMESTEP": 3.75,
                                "GWSTEP": 7.5,
                                "METSTEP": 60,
                                "ETISTEP": 60,
                                "RAININTRVL": 1,
                                "OPINTRVL": 1,
                                "SPOPINTRVL": 10,
                                "INTSTORMMAX": 8760,
                                "RAINSEARCH": 2400
                            },
                            "routing_variables": {
                                "BASEFLOW": 0.01,
                                "VELOCITYCOEF": 0.5,
                                "VELOCITYRATIO": 5,
                                "KINEMVELCOEF": 0.1,
                                "FLOWEXP": 1e-7,
                                "CHANNELROUGHNESS": 0.15,
                                "CHANNELWIDTH": 10,
                                "CHANNELWIDTHCOEFF": 1,
                                "CHANNELWIDTHEXPNT": 0.3,
                                "CHANNELWIDTHFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            },
                            "meteorological_variables": {
                                "TLINKE": 2,
                                "MINSNTEMP": -27,
                                "TEMPLAPSE": -0.0065,
                                "PRECLAPSE": 0,
                                "SNLIQFRAC": 0.6
                            }
                        },
                        "run_options": {
                            "OPTMESHINPUT": 2,
                            "RAINSOURCE": 2,
                            "OPTEVAPOTRANS": 1,
                            "OPTSNOW": 1,
                            "HILLALBOPT": 2,
                            "OPTRADSHELT": 0,
                            "OPTINTERCEPT": 2,
                            "OPTLANDUSE": 1,
                            "OPTLUINTERP": 1,
                            "GFLUXOPTION": 2,
                            "METDATAOPTION": 1,
                            "CONVERTDATA": 0,
                            "OPTBEDROCK": 0,
                            "OPTGROUNDWATER": 0,
                            "WIDTHINTERPOLATION": 0,
                            "OPTGWFILE": 0,
                            "OPTRUNON": 0,
                            "OPTRESERVOIR": 0,
                            "OPTSOILTYPE": 0,
                            "OPTPERCOLATION": 0
                        },
                        "files_and_pathnames": {
                            "mesh_generation": {
                                "INPUTDATAFILE": {
                                    "resource_id": "2508e47b-e6dd-41da-9784-461049f013c3",
                                    "file_collection_id": "0e7abec5-fbf9-4f21-9017-1e16d349d333",
                                    "file_collection_paths": [
                                        "salas.z",
                                        "salas_voi",
                                        "salas_width",
                                        "salas.tri",
                                        "salas_area",
                                        "salas.nodes",
                                        "salas_reach",
                                        "salas.edges"
                                    ],
                                    "path": "Output/voronoi/salas"
                                },
                                "POINTFILENAME": {
                                    "resource_id": "d3045596-08f8-4514-8048-14c06e7e2155",
                                    "file_collection_id": "4e86ed86-90bc-4571-9faa-1b497afed8c8",
                                    "file_collection_paths": [
                                        "salas.points"
                                    ],
                                    "path": "Input/salas.points"
                                },
                                "INPUTTIME": 0,
                                "ARCINFOFILENAME": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            },
                            "resampling_grids": {
                                "SOILTABLENAME": {
                                    "resource_id": "7a3688c0-3c24-4b65-8008-2748ae07999a",
                                    "file_collection_id": "31a6656c-ba1c-4fee-888b-f1781babd69f",
                                    "file_collection_paths": [
                                        "salas.sdt"
                                    ],
                                    "path": "Input/salas.sdt"
                                },
                                "SOILMAPNAME": {
                                    "resource_id": "4e9af351-978c-4ca2-accf-b811d4a7baed",
                                    "file_collection_id": "3724c51d-17f2-4628-861b-4cc31948811e",
                                    "file_collection_paths": [
                                        "salas.soi"
                                    ],
                                    "path": "Input/salas.soi"
                                },
                                "LANDTABLENAME": {
                                    "resource_id": "76174e70-0640-4108-9c01-ab61dafcba75",
                                    "file_collection_id": "7f82e099-ad34-4057-accc-8a3b37a69f54",
                                    "file_collection_paths": [
                                        "salas.ldt"
                                    ],
                                    "path": "Input/salas.ldt"
                                },
                                "LANDMAPNAME": {
                                    "resource_id": "95bb70ff-d91c-4808-876b-ca7b04bc0cee",
                                    "file_collection_id": "6d6bdd21-ef45-421e-82e0-05177680c3ae",
                                    "file_collection_paths": [
                                        "salas.lan"
                                    ],
                                    "path": "Input/salas.lan"
                                },
                                "GWATERFILE": {
                                    "resource_id": "abe094da-7772-4de2-8259-d889c1c4ed46",
                                    "file_collection_id": "6d118c0f-e808-44c7-b199-45bb4791b1f7",
                                    "file_collection_paths": [
                                        "salas.iwt"
                                    ],
                                    "path": "Input/salas.iwt"
                                },
                                "DEMFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "RAINFILE": {
                                    "resource_id": "6907d792-26fb-43ee-9c05-d356735fd3f8",
                                    "file_collection_id": "548c3fc9-2b63-4c5b-9921-1ea55e2c34b6",
                                    "file_collection_paths": [
                                        "p0616200400.txt",
                                        "p0615200412.txt",
                                        "p0623200420.txt",
                                        "p0611200411.txt",
                                        "p0610200417.txt"
                                    ],
                                    "path": "Rain/p"
                                },
                                "RAINEXTENSION": "txt",
                                "DEPTHTOBEDROCK": 5,
                                "BEDROCKFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Input/salas.brd"
                                },
                                "LUGRID": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "SCGRID": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            },
                            "meteorological_data": {
                                "HYDROMETSTATIONS": {
                                    "resource_id": "200ecc7f-8c01-4d58-ad7b-50290a949f59",
                                    "file_collection_id": "c2c3e46a-4c98-475a-9965-0c14cb146258",
                                    "file_collection_paths": [
                                        "weatherC1601_2004.mdf",
                                        "weatherC1601_2004.sdf"
                                    ],
                                    "path": "Weather/weatherC1601_2004.sdf"
                                },
                                "HYDROMETGRID": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Weather/"
                                },
                                "HYDROMETCONVERT": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Weather/"
                                },
                                "HYDROMETBASENAME": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Weather/weatherField"
                                },
                                "GAUGESTATIONS": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Rain/rainGauge.sdf"
                                },
                                "GAUGECONVERT": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "GAUGEBASENAME": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            },
                            "output_data": {
                                "OUTFILENAME": {
                                    "file_database_paths": [
                                        {
                                            "resource_id": "2627de66-2508-4391-850e-59333c7fa5d6",
                                            "file_collection_id": "90321e03-4598-46ac-af82-c511081e623e",
                                            "file_collection_paths": [
                                                "salas.0130_00d",
                                                "salas.0220_00d",
                                                "salas.0570_00d"
                                            ],
                                            "path": ""
                                        },
                                        {
                                            "resource_id": "2753b50b-5d69-494d-a99f-75ef23eac55a",
                                            "file_collection_id": "557b3069-f2ae-42ba-a700-fd1e28b6ceba",
                                            "file_collection_paths": [
                                                "salas.0000_00i",
                                                "salas.0700_00i"
                                            ],
                                            "path": ""
                                        },
                                        {
                                            "resource_id": "44d36f74-1e70-40f8-a66d-25e3c5645936",
                                            "file_collection_id": "8e225683-a143-40b7-90ed-81864d93bd4d",
                                            "file_collection_paths": [
                                                "salas0.pixel"
                                            ],
                                            "path": ""
                                        }
                                    ],
                                    "path": "Output/voronoi/salas"
                                },
                                "OUTHYDROFILENAME": {
                                    "file_database_paths": [
                                        {
                                            "resource_id": "d6248310-b374-49d9-88d6-a86e0e2ccc9d",
                                            "file_collection_id": "2fc3b60f-64e2-4b84-afe9-01a0f3a3b04b",
                                            "file_collection_paths": [
                                                "salas0700_00.mrf"
                                            ],
                                            "path": ""
                                        },
                                        {
                                            "resource_id": "d1a4cec2-554b-4695-89a4-4482e562c3af",
                                            "file_collection_id": "1233b3fb-3278-4854-8328-5cb107f67af4",
                                            "file_collection_paths": [
                                                "salas.cntrl"
                                            ],
                                            "path": ""
                                        },
                                        {
                                            "resource_id": "43887c74-7928-4719-a13f-f6985a690839",
                                            "file_collection_id": "a6cafc24-0a86-4282-93a7-a66814a34684",
                                            "file_collection_paths": [
                                                "salas0700_00.rft"
                                            ],
                                            "path": ""
                                        },
                                        {
                                            "resource_id": "618189e8-400d-4910-9dc7-a45d925d0810",
                                            "file_collection_id": "9f8352c4-43c9-4d5e-a72f-8fe9c26f5279",
                                            "file_collection_paths": [
                                                "salas_Outlet.qout"
                                            ],
                                            "path": ""
                                        }
                                    ],
                                    "path": "Output/hyd/salas"
                                },
                                "OUTHYDROEXTENSION": "mrf",
                                "RIBSHYDOUTPUT": 0,
                                "NODEOUTPUTLIST": {
                                    "resource_id": "60ee1e0d-b727-4245-94c3-0b99d1836ea7",
                                    "file_collection_id": "cf9447e4-99b5-4263-83b7-49f0276c1c03",
                                    "file_collection_paths": [
                                        "pNodes.dat"
                                    ],
                                    "path": "Input/Nodes/pNodes.dat"
                                },
                                "HYDRONODELIST": {
                                    "resource_id": "81ef8cd4-2501-46cb-a545-be9c89f015ab",
                                    "file_collection_id": "b796ca8d-9269-49ac-9d4f-1c624fedd7ae",
                                    "file_collection_paths": [
                                        "hNodes.dat"
                                    ],
                                    "path": "Input/Nodes/hNodes.dat"
                                },
                                "OUTLETNODELIST": {
                                    "resource_id": "85e571ea-93b8-41f3-ad41-cbc0fc265357",
                                    "file_collection_id": "31b3dbe1-b6ca-4e1a-b384-51938e5083ac",
                                    "file_collection_paths": [
                                        "oNodes.dat"
                                    ],
                                    "path": "Input/Nodes/oNodes.dat"
                                },
                                "OPTSPATIAL": 0,
                                "OPTINTERHYDRO": 0,
                                "OPTHEADER": 0,
                            },
                            "reservoir_data": {
                                "RESPOLYGONID": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "RESDATA": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            }
                        },
                        "modes": {
                            "rainfall_forecasting": {
                                "FORECASTMODE": 0,
                                "FORECASTTIME": null,
                                "FORECASTLEADTIME": null,
                                "FORECASTLENGTH": null,
                                "FORECASTFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "CLIMATOLOGY": null,
                                "RAINDISTRIBUTION": 0
                            },
                            "stochastic_climate_forcing": {
                                "STOCHASTICMODE": 0,
                                "PMEAN": 0,
                                "STDUR": 0,
                                "ISTDUR": 0,
                                "SEED": 11,
                                "PERIOD": 0,
                                "MAXPMEAN": 0,
                                "MAXSTDURMN": 0,
                                "MAXISTDURMN": 0,
                                "WEATHERTABLENAME": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": "Input/pramsWG.T"
                                }
                            },
                            "restart": {
                                "RESTARTMODE": 1,
                                "RESTARTINTRVL": 8760,
                                "RESTARTDIR": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                },
                                "RESTARTFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            },
                            "parallel": {
                                "PARALLELMODE": 1,
                                "GRAPHOPTION": 0,
                                "GRAPHFILE": {
                                    "resource_id": null,
                                    "file_collection_id": null,
                                    "file_collection_paths": [],
                                    "path": ""
                                }
                            }
                        },
                        "visualization": {
                            "OPTVIZ": 0,
                            "OUTVIZFILENAME": {
                                "resource_id": null,
                                "file_collection_id": null,
                                "file_collection_paths": [],
                                "path": ""
                            }
                        }
                    },
                    "linked_datasets": [
                        {
                            "id": "2753b50b-5d69-494d-a99f-75ef23eac55a",
                            "name": "Time-Integrated Variable Output"
                        },
                        {
                            "id": "d6248310-b374-49d9-88d6-a86e0e2ccc9d",
                            "name": "Basin Averaged Hydrograph File"
                        },
                        {
                            "id": "d1a4cec2-554b-4695-89a4-4482e562c3af",
                            "name": "Control File"
                        },
                        {
                            "id": "43887c74-7928-4719-a13f-f6985a690839",
                            "name": "Hydrograph Runoff Types File"
                        },
                        {
                            "id": "618189e8-400d-4910-9dc7-a45d925d0810",
                            "name": "Qout File"
                        },
                        {
                            "id": "2627de66-2508-4391-850e-59333c7fa5d6",
                            "name": "Time-Dynamic Variable Output"
                        },
                        {
                            "id": "44d36f74-1e70-40f8-a66d-25e3c5645936",
                            "name": "Node Dynamic Output"
                        }
                    ]
                }
            ]
        }
    ],
    "workflows": {
        "available": [
            {
                "name": "tRIBS",
                "workflows": [
                    {
                        "id": "1a8317cc-f3a2-4197-a1d2-a89445bcdf4d",
                        "name": "Bulk Data Retrieval",
                        "description": "Really long and in depth description about how this tool is actually supposed to work."
                    },
                    {
                        "id": "3e2b2b66-50d7-4c6d-bf67-b385dec7ac68",
                        "name": "Prepare Precipitation",
                        "description": ""
                    },
                    {
                        "id": "bb6763d6-f1eb-494d-ac94-4ddb42a63ee9",
                        "name": "Prepare Soils",
                        "description": ""
                    },
                    {
                        "id": "2ab405f8-c2d0-4321-80e2-988efffec158",
                        "name": "Run Simulation",
                        "description": ""
                    }
                ]
            },
            {
                "name": "1tRIBS",
                "workflows": [
                    {
                        "id": "1a8317cc-f3a2-4197-a1d2-a89445bcdf4d",
                        "name": "1Bulk Data Retrieval",
                        "description": "Really long and in depth description about how this tool is actually supposed to work."
                    },
                    {
                        "id": "3e2b2b66-50d7-4c6d-bf67-b385dec7ac68",
                        "name": "1Prepare Precipitation",
                        "description": ""
                    },
                    {
                        "id": "bb6763d6-f1eb-494d-ac94-4ddb42a63ee9",
                        "name": "1Prepare Soils",
                        "description": ""
                    },
                    {
                        "id": "2ab405f8-c2d0-4321-80e2-988efffec158",
                        "name": "1Run Simulation",
                        "description": ""
                    }
                ]
            }
        ],
        "history": [
            {
                "id": "7098ac43-0a48-46d9-86be-d363c487ef66",
                "name": "Bulk Data Retrieval 2024-01-14 11:14",
                "date_created": new Date("2024-01-14T11:14:23.500Z"),
                "workflow_id": "1a8317cc-f3a2-4197-a1d2-a89445bcdf4d",
                "status": "Complete",
                "steps": [
                    {
                        name: "Number 1"
                    },
                    {
                        name: "Number 2"
                    },
                    {
                        name: "Number 3"
                    },
                    {
                        name: "Number 4"
                    },
                ],
                "output": [
                    {
                        name: "Number 1"
                    },
                    {
                        name: "Number 2"
                    },
                    {
                        name: "Number 3"
                    },
                    {
                        name: "Number 4"
                    },
                ]
            },
            {
                "id": "c9ccdd35-4a93-44d1-9220-9f4b6624c056",
                "name": "Prepare Soils 2024-01-14 12:34",
                "date_created": new Date("2024-01-14T12:34:34.700Z"),
                "workflow": "bb6763d6-f1eb-494d-ac94-4ddb42a63ee9",
                "status": "Continue",
                "steps": [],
                "output": []
            },
            {
                "id": "6d1890bc-7135-4514-a05e-4002ba99f300",
                "name": "Prepare Land Cover 2024-01-15 01:23",
                "date_created": new Date("2024-01-15T01:23:23.500Z"),
                "workflow": "0abe53ef-1250-47ef-a010-f4866665c68c",
                "status": "Running",
                "steps": [],
                "output": []
            },
            {
                "id": "6cce1fd0-580f-48cf-adf3-f8a83fc54203",
                "name": "Prepare Precipitation 2024-01-15 02:34",
                "date_created": new Date("2024-01-15T02:34:34.800Z"),
                "workflow": "3e2b2b66-50d7-4c6d-bf67-b385dec7ac68",
                "status": "Error",
                "steps": [],
                "output": []
            },
            {
                "id": "b98935bc-1e9d-410e-967d-370df37e81df",
                "name": "Run Simulation 2024-02-15 22:33",
                "date_created": new Date("2024-02-15T22:33:33.400Z"),
                "workflow": "2ab405f8-c2d0-4321-80e2-988efffec158",
                "status": "Pending",
                "steps": [],
                "output": []
            }
        ]
    }
}
