import newUUID from "lib/uuid";

export function makeRealization(name, linked_datasets) {
  return {
    id: newUUID(),
    name: name,
    scenario_name: name,
    scenario_id: newUUID(),
    linked_datasets: linked_datasets,
  };
}
