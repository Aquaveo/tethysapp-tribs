import * as workflowConstants from "constants/workflowConstants"
import newUUID from "lib/uuid";

export function makeWorkflow(name) {
  return {
    id: newUUID(),
    name: name,
    date_created: new Date(),
    workflow_id: newUUID(),
    status: workflowConstants.WORKFLOW_STATUS[0],
    steps: [{name: name}],
    output: [{name: name}],
  };
}
