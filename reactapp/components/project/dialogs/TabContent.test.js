import { render, screen } from "@testing-library/react";
import { TabContent, getKeyNames, getCapitalizedKey, groupByIdAndType, getDatasetTypeForId } from "./TabContent";
import { Formik } from "formik";
import { serialized_project } from "config/tests/mocks/projectContext";

describe("getKeyNames Function", () => {
  it("Returns keys with nested objects", () => {
    const obj = {
      key1: { nested1: "value1" },
      key2: "value2",
      key3: { nested2: "value3" },
    };

    const keysWithObjects = getKeyNames(obj);

    expect(keysWithObjects).toEqual(["Key1", "Key3"]);
  });

  it("Returns empty array if no nested objects", () => {
    const obj = {
      key1: "value1",
      key2: "value2",
    };

    const keysWithObjects = getKeyNames(obj);

    expect(keysWithObjects).toEqual([]);
  });
});

describe("getCapitalizedKey Function", () => {
  it("Capitalizes keys with underscores", () => {
    const key = "key_with_underscores";

    const capitalizedKey = getCapitalizedKey(key);

    expect(capitalizedKey).toEqual("Key With Underscores");
  });

  it("Does not change already capitalized keys", () => {
    const key = "AlreadyCapitalizedKey";

    const capitalizedKey = getCapitalizedKey(key);

    expect(capitalizedKey).toEqual("AlreadyCapitalizedKey");
  });
});

describe('getDatasetTypeForId Function', () => {
  const datasets = serialized_project.datasets;

  test("Returns correct dataset for a given id", () => {
    const result = getDatasetTypeForId("95bb70ff-d91c-4808-876b-ca7b04bc0cee", datasets);
    expect(result).toEqual("RASTER");
  });

  test("Returns null for non-existent id", () => {
    const result = getDatasetTypeForId(null, datasets);
    expect(result).toBeNull();
  })
});

describe('groupByIdAndType Function', () => {
  const datasets = serialized_project.datasets;

  test('groups datasets by type', () => {
    const result = groupByIdAndType(datasets);
    expect(result).toEqual({
      // OTHER: [],
      // After removing the Point File, there is no longer any OTHER datasets
      // GIS: [],
      // No GIS data in the projectContext I guess?
      RASTER: [
        {
          id: '95bb70ff-d91c-4808-876b-ca7b04bc0cee',
          name: 'Land Use Grid'
        },
        {
          id: '6907d792-26fb-43ee-9c05-d356735fd3f8',
          name: 'Radar Rainfall Grids'
        },
        {
          id: 'abe094da-7772-4de2-8259-d889c1c4ed46',
          name: 'Groundwater Grid'
        },
        {
          id: '4e9af351-978c-4ca2-accf-b811d4a7baed',
          name: 'Soil Grid'
        },
      ],
      GIS: [
        {
          id: '200ecc7f-8c01-4d58-ad7b-50290a949f59',
          name: 'Hydromet Station Data'
        },
        {
          id: "7b5c1ff1-1ece-4903-a16c-8c63a68da3c9",
          name: "GIS Dataset",
        },
      ],
      TABULAR: [
        {
          id: '7a3688c0-3c24-4b65-8008-2748ae07999a',
          name: 'Soil Reclassification Table'
        },
        {
          id: '76174e70-0640-4108-9c01-ab61dafcba75',
          name: 'Land Use Reclassification Table'
        },
        {
          id: '85e571ea-93b8-41f3-ad41-cbc0fc265357',
          name: 'Interior Node Output List'
        },
        {
          id: '60ee1e0d-b727-4245-94c3-0b99d1836ea7',
          name: 'Node Output List'
        },
        {
          id: '81ef8cd4-2501-46cb-a545-be9c89f015ab',
          name: 'Runtime Node Output List'
        },        
      ],
      MESH: [
        {
          id: '2508e47b-e6dd-41da-9784-461049f013c3',
          name: 'TIN'
        },
      ],
      CESIUM: [
        {
          id: '2753b50b-5d69-494d-a99f-75ef23eac55a',
          name: 'Time-Integrated Variable Output'
        },
        {
          id: 'd6248310-b374-49d9-88d6-a86e0e2ccc9d',
          name: 'Basin Averaged Hydrograph File'
        },
        {
          id: 'd1a4cec2-554b-4695-89a4-4482e562c3af',
          name: 'Control File'
        },
        {
          id: '43887c74-7928-4719-a13f-f6985a690839',
          name: 'Hydrograph Runoff Types File'
        },
        {
          id: '618189e8-400d-4910-9dc7-a45d925d0810',
          name: 'Qout File'
        },
        {
          id: '2627de66-2508-4391-850e-59333c7fa5d6',
          name: 'Time-Dynamic Variable Output'
        },

        {
          id: '44d36f74-1e70-40f8-a66d-25e3c5645936',
          name: 'Node Dynamic Output'
        }
      ]
    });
  });

  it('returns an empty object', () => {
    const result = groupByIdAndType();
    expect(result).toEqual({});
  })
});

describe("TabContent Function", () => {
  const datasets = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Name 1',
      file_collection_paths: 
        [
          'salas.z', 'salas_voi', 'salas_width', 'salas.tri', 'salas_area', 'salas.nodes',
          'salas_reach', 'salas.edges'
        ],
      path: 'Output/voronoi/salas',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Name 2',
      file_collection_paths: 
        [
          'salas.z', 'salas_voi', 'salas_width', 'salas.tri', 'salas_area', 'salas.nodes',
          'salas_reach', 'salas.edges'
        ],
      path: 'Output/voronoi/salas',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Name 3',
      file_collection_paths: 
        [
          'salas.z', 'salas_voi', 'salas_width', 'salas.tri', 'salas_area', 'salas.nodes',
          'salas_reach', 'salas.edges'
        ],
      path: 'Output/voronoi/salas',
    },
  ];

  it("Renders TextInput and DateInput based on given data", () => {
    const initialValues = {
      project_id: 123,
      name: "Test Model",
      description: "Testing TabContent function",
      created_by: "John Doe",
      date_created: new Date(),
      test_array: ["nothing", "of", "importance"],
      random_dataset: {
        resource_id: '00000000-0000-0000-0000-000000000001',
        file_collection_id: '00000000-0000-0000-0000-000000000000',
        file_collection_paths:
          [
            'salas.z', 'salas_voi', 'salas_width', 'salas.tri', 'salas_area', 'salas.nodes',
            'salas_reach', 'salas.edges'
          ],
        path: 'Output/voronoi/salas',
      },
      nested_object: {
        project_id1: 123,
        name1: "Test Model",
        description1: "Testing TabContent function",
        created_by1: "John Doe",
        date_created1: new Date(),
        test_array1: ["nothing", "of", "importance"],
        random_dataset1: {
          resource_id: '00000000-0000-0000-0000-000000000002',
          file_collection_id: '00000000-0000-0000-0000-000000000000',
          file_collection_paths:
            [
              'salas.z', 'salas_voi', 'salas_width', 'salas.tri', 'salas_area', 'salas.nodes',
              'salas_reach', 'salas.edges'
            ],
          path: 'Output/voronoi/salas',
        },
      }
    };

    render(
      <Formik initialValues={initialValues} onSubmit={() => {}}>
        {({ values }) => (
          <div>
            {TabContent( values, values, "input_file", datasets, groupByIdAndType(datasets) )}
          </div>
        )}
      </Formik>
    );

    // Check for NumberInput components
    expect(screen.getByLabelText("Project Id")).toBeInTheDocument();

    // Check for TextInput components
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Created By")).toBeInTheDocument();

    // Check for Arrays that shouldn't exist
    expect(screen.queryByText("Test Array")).not.toBeInTheDocument();

    // Check for DateInput component
    expect(screen.getByLabelText("Date Created")).toBeInTheDocument();
    expect(screen.getByLabelText("Date Created")).toHaveAttribute("type", "text");

    // Check for SelectInput components
    expect(screen.getByText("Random Dataset")).toBeInTheDocument();
    expect(screen.getByText("Random Dataset1")).toBeInTheDocument();

    // Check for the Header
    expect(screen.getByText("Nested Object")).toBeInTheDocument();
  });

  it("Handles empty keysWithObjects and returns null", () => {
    const keysWithObjects = {
      empty_object: null
    };

    render(
      <Formik initialValues={keysWithObjects} onSubmit={() => {}}>
        {({ values }) => (
          <div>
            {TabContent( keysWithObjects, values, "input_file", datasets )}
          </div>
        )}
      </Formik>
    );

    expect(screen.getByText("Debug Empty Object")).toBeInTheDocument();
  });
});
