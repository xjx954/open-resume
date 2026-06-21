import {
  buildJobDiagnosisOptimizationUserPrompt,
  runJobDiagnosisOptimization,
} from "../jobDiagnosisOptimization";

const issue = {
  title: "项目经历缺少量化成果",
  detail: "项目经历中缺少数字化结果。",
  reason: "招聘方很难判断影响范围和结果。",
  recommendation: "补充真实指标，例如用例数量、缺陷数量、覆盖率或效率变化。",
  example: "负责系统测试，设计并执行 300+ 测试用例。",
};

describe("jobDiagnosisOptimization", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds prompt from resume, issue, advice, and optional JD", () => {
    const prompt = buildJobDiagnosisOptimizationUserPrompt({
      resumeMarkdown: "负责系统测试工作",
      jobDescription: "需要测试用例设计和缺陷跟踪",
      issue,
    });

    expect(prompt).toContain("当前简历 Markdown");
    expect(prompt).toContain("负责系统测试工作");
    expect(prompt).toContain("需要测试用例设计和缺陷跟踪");
    expect(prompt).toContain("项目经历缺少量化成果");
    expect(prompt).toContain("补充真实指标");
    expect(prompt).toContain("originalContent、optimizedContent、explanation");
  });

  it("uses the unified AI client and parses optimization JSON", async () => {
    const fetchMock = jest.spyOn(global as any, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                originalContent: "负责系统测试工作",
                optimizedContent: "负责系统测试，设计并执行 300+ 测试用例。",
                explanation: "300+ 为示例数字，需替换为真实数据。",
              }),
            },
          },
        ],
      }),
    } as any);

    const result = await runJobDiagnosisOptimization({
      resumeMarkdown: "负责系统测试工作",
      jobDescription: "需要测试用例设计和缺陷跟踪",
      issue,
      config: {
        apiKey: "test-key",
        baseURL: "https://example.com/v1",
        model: "test-model",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    );
    expect(result).toEqual({
      originalContent: "负责系统测试工作",
      optimizedContent: "负责系统测试，设计并执行 300+ 测试用例。",
      explanation: "300+ 为示例数字，需替换为真实数据。",
    });
  });
});
