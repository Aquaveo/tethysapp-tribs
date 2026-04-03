import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpatialDropdown from "./SpatialDropdown";

// Mock the debounce function from lodash
jest.mock("lodash", () => {
  return {
    debounce: (func) => func,
  };
});

// Mock fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        results: [{ id: "1", text: "Reference 1" }, { id: "2", text: "Reference 2" }],
      }),
  })
);

describe("SpatialDropdown", () => {
  it.skip("fetches spatial references and renders options", async () => {
    const user = userEvent.setup();
    render(<SpatialDropdown />);

    const input = screen.getByRole("combobox");

    user.type(input, "abc"); // Type some characters to trigger fetch
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const option1 = screen.getByText("Reference 1 (1)");
    const option2 = screen.getByText("Reference 2 (2)");
    expect(option1).toBeInTheDocument();
    expect(option2).toBeInTheDocument();
  });

  it("debounces input and fetches spatial references after 500ms", async () => {
    const user = userEvent.setup();
    render(<SpatialDropdown />);

    const input = screen.getByRole("combobox");

    user.type(input, "abc");
    user.type(input, "def"); // Typing more characters should not trigger fetch yet

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(0));

    // After 500ms debounce, the fetch should be triggered
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("displays 'NoOptionsMessage' when input length is less than 2", async () => {
    const user = userEvent.setup();
    render(<SpatialDropdown />);

    const input = screen.getByRole("combobox");

    user.type(input, "a"); // Type only 1 character

    const noOptionsMessage = await screen.findByText("Please enter 2 or more characters");
    expect(noOptionsMessage).toBeInTheDocument();
  });

  it.skip("selects an option when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<SpatialDropdown onSelect={onSelect} />);

    const input = screen.getByRole("combobox");

    user.type(input, "abc");
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const option = screen.getByText("Reference 1");
    user.click(option);

    expect(onSelect).toHaveBeenCalledWith({ value: "1", label: "Reference 1 (1)" });
  });
});

it("fetches spatial references when query is entered", async () => {
  render(<SpatialDropdown />);

  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "query" } });
  });

  // Wait for the fetch call to complete
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith("/apps/tribs/rest/spatial-reference/query/?q=query");
  });
});
