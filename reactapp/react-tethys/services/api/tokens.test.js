import { getAccessToken, onTokenChange, setTokens } from "react-tethys/services/api/tokens";

const unsubscribers = [];

afterEach(() => {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers.length = 0;
});

it("Stores the token and notifies every listener with it", () => {
  const first = jest.fn();
  const second = jest.fn();
  unsubscribers.push(onTokenChange(first), onTokenChange(second));

  setTokens("new-token");

  expect(getAccessToken()).toEqual("new-token");
  expect(first).toHaveBeenCalledWith("new-token");
  expect(second).toHaveBeenCalledWith("new-token");
});

it("Does not notify a listener after it unsubscribes", () => {
  const listener = jest.fn();
  const unsubscribe = onTokenChange(listener);

  unsubscribe();
  setTokens("new-token");

  expect(listener).not.toHaveBeenCalled();
});
