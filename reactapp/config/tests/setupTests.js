// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { server } from "./mocks/server.js";

// Import enzyme to check the inner workings of the cesium component
import { configure } from "enzyme";
import Adapter from "@cfaester/enzyme-adapter-react-18";

// Make window.crypto availalbe for uuid tests.
const crypto = require("crypto");

Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
  },
});

// Make .env files accessible to tests (path relative to project root)
require("dotenv").config({ path: "./reactapp/config/tests/test.env" });

// Setup mocked Tethys API
beforeAll(() => server.listen());
// if you need to add a handler after calling setupServer for some specific test
// this will remove that handler for the rest of them
// (which is important for test isolation):
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mocks for tests involving plotly
window.URL.createObjectURL = jest.fn();
HTMLCanvasElement.prototype.getContext = jest.fn();

// This adapter is used take a peek into the cesium component
configure({ adapter: new Adapter() });

// Mock the react-toastify module
jest.mock("react-toastify", () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.update = jest.fn();
  toast.isActive = jest.fn();
  toast.info = jest.fn();
  toast.dismiss = jest.fn();
  
  return { toast };
});

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [{ id: "1", text: "Test" }] }),
  })
);
