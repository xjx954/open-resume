import { downloadDirect } from "../helper";

describe("downloadDirect", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("releases blob URLs after triggering the download", () => {
    const click = jest.fn();
    jest.spyOn(document, "createElement").mockReturnValue({
      click,
      set download(value: string) {},
      set target(value: string) {},
      set href(value: string) {},
    } as unknown as HTMLAnchorElement);
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    downloadDirect("blob:http://localhost/resume", "resume.md");
    jest.runOnlyPendingTimers();

    expect(click).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith("blob:http://localhost/resume");
  });
});
