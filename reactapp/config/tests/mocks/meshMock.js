import newUUID from "lib/uuid";

export function makeMesh(name) {
  return {
    id: newUUID(),
    name: "Name 1",
    // datasets: [
    //   {
    //     id: newUUID(),
    //     name: name,
    //   }
    // ],
    datasets: [],
    viz: {
      type: "gltf",
      url: [
        "/static/tribs/gltf/out_examplebasin_Z.gltf"
      ],
      center: [
        -111.37634936677337,
        34.42561120663049,
        2120.662353515625
      ],
      extent: [
        -111.393127,
        34.359876,
        -110.9832,
        34.633773
      ]
    },
  };
}

const FDB = "4beeb62d-ca82-476a-9257-94092c419bf2/ce1b934d-a10e-466b-bf25-fbbc644a5a18/gltf";

function timestep(variable, hours, time) {
  const stamp = String(hours).padStart(4, "0");
  return {
    hours,
    time,
    url: `${FDB}/abc-salas_salas-${stamp}_00d_${variable}.glb`,
    legend: `${FDB}/abc-salas_salas-${stamp}_00d_${variable}_legend.png`,
  };
}

const datasetBase = (id) => ({
  id,
  type: "dataset_resource",
  locked: false,
  status: null,
  attributes: {},
  created_by: "_staff_user",
  date_created: "2024-07-10T20:48:18.317243",
  display_type_plural: "Datasets",
  display_type_singular: "Dataset",
  organizations: [{ id: "67984deb-e430-435c-ba0f-fae786a0440f", name: "Hello World" }],
  public: false,
  slug: "datasets",
  srid: null,
});

/** A time-dynamic glTF mesh output dataset with viz.variables (Mu: 3 time steps, Nwt: 2 time steps). */
export function makeTimeSeriesMesh(id = "1c1f3a5e-5d0b-4f8e-9a2a-6d6a7e1c2b3d") {
  const variables = [
    {
      name: "Mu",
      start: "2004-06-01T00:00:00Z",
      end: "2004-06-01T20:00:00Z",
      step_hours: 10,
      timesteps: [
        timestep("Mu", 0, "2004-06-01T00:00:00Z"),
        timestep("Mu", 10, "2004-06-01T10:00:00Z"),
        timestep("Mu", 20, "2004-06-01T20:00:00Z"),
      ],
    },
    {
      name: "Nwt",
      start: "2004-06-01T00:00:00Z",
      end: "2004-06-01T20:00:00Z",
      step_hours: 20,
      timesteps: [timestep("Nwt", 0, "2004-06-01T00:00:00Z"), timestep("Nwt", 20, "2004-06-01T20:00:00Z")],
    },
  ];
  const timesteps = variables.flatMap((variable) => variable.timesteps);
  return {
    ...datasetBase(id),
    name: "Time Dynamic Output",
    description: "Time Dynamic Output for test.",
    dataset_type: "TRIBS_OUT_TIME_DYNAMIC",
    viz: {
      type: "gltf",
      url: timesteps.map((t) => t.url),
      legend: timesteps.map((t) => t.legend),
      origin: [-112.5841635588148, 34.29805405819842, 1500],
      extent: [-124.914551, 24.766785, -67.412109, 49.15297],
      variables,
    },
  };
}

/** A bare TIN glTF dataset with the single static Elevation variable. */
export function makeStaticMesh(id = "2d2f4b6f-6e1c-4a9f-8b3b-7e7b8f2d3c4e") {
  return {
    ...datasetBase(id),
    name: "Mesh",
    description: "Bare TIN.",
    dataset_type: "TRIBS_TIN",
    viz: {
      type: "gltf",
      url: [`${FDB}/abc-salas.glb`],
      legend: [`${FDB}/abc-salas_legend.png`],
      origin: [-112.5841635588148, 34.29805405819842, 1500],
      extent: [-124.914551, 24.766785, -67.412109, 49.15297],
      variables: [
        {
          name: "Elevation",
          start: null,
          end: null,
          step_hours: null,
          timesteps: [{ hours: null, time: null, url: `${FDB}/abc-salas.glb`, legend: `${FDB}/abc-salas_legend.png` }],
        },
      ],
    },
  };
}
