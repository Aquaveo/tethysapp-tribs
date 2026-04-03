import { idOrNameRequired } from "./propTypes";

it('Returns an Error if either "id" or "name" are not included in props argument', () => {
  const ret = idOrNameRequired({ foo: "bar" }, "baz", "FooBar");
  expect(ret).toBeInstanceOf(Error);
  expect(ret.message).toBe(
    'One of the props "id" or "name" was not specified in "FooBar"'
  );
});

it('Returns null when "id" is included in props argument', () => {
  const ret = idOrNameRequired({ id: "baz", foo: "bar" }, "baz", "FooBar");
  expect(ret).toBeUndefined();
});

it('Returns null when "name" is included in props argument', () => {
  const ret = idOrNameRequired({ name: "baz", foo: "bar" }, "baz", "FooBar");
  expect(ret).toBeUndefined();
});
