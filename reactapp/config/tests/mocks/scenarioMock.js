import newUUID from "lib/uuid";

export function makeScenario(name) {
  return {
    id: newUUID(),
    name: name,
    linked_datasets: [
      {
        id: newUUID(),
        name: name,
      }
    ],
  };
}
