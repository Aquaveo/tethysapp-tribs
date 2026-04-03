import { validate as uuidValidate } from "uuid";

import newUUID from "./uuid";

it("Create a UUID version 4", () => {
  const ret = newUUID();
  expect(uuidValidate(ret)).toBe(true);
});
