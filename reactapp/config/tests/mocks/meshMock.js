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
