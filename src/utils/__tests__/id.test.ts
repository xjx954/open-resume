import { generateId } from "../id";

describe("generateId", () => {
  it("creates non-empty ids with the shared resume block format", () => {
    expect(generateId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});
