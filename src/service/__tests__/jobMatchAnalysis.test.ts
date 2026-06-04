import {
  calculateKeywordCoverage,
  extractJobKeywords,
  parseJobMatchAnalysis,
} from "../jobMatchAnalysis";
import { runJobMatchAnalysis } from "../ai";

describe("job match keyword coverage", () => {
  it("calculates keyword coverage from local JD and resume text", () => {
    const jdKeywords = extractJobKeywords("Python\nFastAPI\nDocker\nLinux\nRAG");
    const result = calculateKeywordCoverage(
      jdKeywords,
      "熟悉 Python、FastAPI，在 Linux 环境完成服务开发。"
    );

    expect(result.keywordCoverage).toBe(60);
    expect(result.matchedKeywords).toEqual(["Python", "FastAPI", "Linux"]);
    expect(result.missingKeywords).toEqual(["Docker", "RAG"]);
  });

  it("matches keywords case-insensitively and removes duplicates", () => {
    const jdKeywords = extractJobKeywords("Docker docker FASTAPI FastAPI");
    const result = calculateKeywordCoverage(jdKeywords, "fastapi 项目经验");

    expect(jdKeywords).toEqual(["Docker", "FASTAPI"]);
    expect(result.keywordCoverage).toBe(50);
    expect(result.matchedKeywords).toEqual(["FASTAPI"]);
    expect(result.missingKeywords).toEqual(["Docker"]);
  });
});

describe("parseJobMatchAnalysis", () => {
  const localCoverage = {
    keywordCoverage: 60,
    matchedKeywords: ["Python", "FastAPI", "Linux"],
    missingKeywords: ["Docker", "RAG"],
  };

  it("uses local keyword coverage over AI-provided coverage fields", () => {
    const report = parseJobMatchAnalysis(
      JSON.stringify({
        keywordCoverage: 99,
        matchedKeywords: ["Fake"],
        missingKeywords: ["FakeMissing"],
        advantages: ["已有 Python/FastAPI 经验"],
        improvementAreas: ["缺少 Docker 描述"],
        suggestions: [{ title: "补充 Docker", detail: "在项目经历中补充容器化部署。" }],
        generatedBullets: [
          {
            targetSection: "projects",
            targetEntryHint: "部署平台",
            sourceKeyword: "Docker",
            content: "使用 Docker 完成服务容器化部署。",
            insertable: false,
          },
        ],
        radarScores: {
          technical: 80,
          project: 70,
          impact: 50,
          keywordCoverage: 99,
          engineering: 75,
        },
      }),
      localCoverage
    );

    expect(report.kind).toBe("report");
    if (report.kind !== "report") return;
    expect(report.report.keywordCoverage).toBe(60);
    expect(report.report.matchedKeywords).toEqual(localCoverage.matchedKeywords);
    expect(report.report.missingKeywords).toEqual(localCoverage.missingKeywords);
    expect(report.report.advantages).toEqual(["已有 Python/FastAPI 经验"]);
    expect(report.report.improvementAreas).toEqual(["缺少 Docker 描述"]);
    expect(report.report.generatedBullets[0]).toEqual({
      targetSection: "projects",
      targetEntryHint: "部署平台",
      sourceKeyword: "Docker",
      content: "使用 Docker 完成服务容器化部署。",
      insertable: false,
    });
  });

  it("keeps generated bullets compatible when targetEntryHint is missing", () => {
    const report = parseJobMatchAnalysis(
      JSON.stringify({
        generatedBullets: [
          {
            targetSection: "projects",
            sourceKeyword: "RAG",
            content: "补充 RAG 检索增强生成项目经验。",
          },
        ],
        radarScores: {},
      }),
      localCoverage
    );

    expect(report.kind).toBe("report");
    if (report.kind !== "report") return;
    expect(report.report.generatedBullets[0]).toEqual({
      targetSection: "projects",
      sourceKeyword: "RAG",
      content: "补充 RAG 检索增强生成项目经验。",
      targetEntryHint: undefined,
      insertable: false,
    });
  });

  it("parses fenced JSON and ignores strengths/weaknesses as primary fields", () => {
    const report = parseJobMatchAnalysis(
      "```json\n{\"strengths\":[\"旧字段\"],\"weaknesses\":[\"旧弱点\"],\"advantages\":[\"优势\"],\"improvementAreas\":[\"待提升项\"],\"radarScores\":{\"technical\":120,\"project\":80,\"impact\":20,\"keywordCoverage\":60,\"engineering\":-5}}\n```",
      localCoverage
    );

    expect(report.kind).toBe("report");
    if (report.kind !== "report") return;
    expect(report.report.advantages).toEqual(["优势"]);
    expect(report.report.improvementAreas).toEqual(["待提升项"]);
    expect(report.report.radarScores.technical).toBe(100);
    expect(report.report.radarScores.engineering).toBe(0);
  });

  it("returns fallback text for malformed JSON", () => {
    const report = parseJobMatchAnalysis("这不是 JSON", localCoverage);

    expect(report).toEqual({
      kind: "fallback",
      rawText: "这不是 JSON",
    });
  });
});

describe("runJobMatchAnalysis", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                advantages: ["测试开发背景明显"],
                improvementAreas: ["缺少 Docker 描述"],
                suggestions: [],
                generatedBullets: [],
                radarScores: {
                  technical: 80,
                  project: 70,
                  impact: 50,
                  keywordCoverage: 60,
                  engineering: 75,
                },
              }),
            },
          },
        ],
      }),
    });
  });

  it("does not call AI when JD is empty", async () => {
    await expect(
      runJobMatchAnalysis("Python", "   ", {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    ).rejects.toThrow("请先粘贴岗位描述");

    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it("sends local keyword results, resume markdown, and JD to the model", async () => {
    await runJobMatchAnalysis(
      "Python FastAPI Linux",
      "Python\nFastAPI\nDocker\nLinux\nRAG",
      {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      }
    );

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    const content = body.messages.map((message: { content: string }) => message.content).join("\n");
    expect(content).toContain("不要输出 ATS 分");
    expect(content).toContain("不编造经历");
    expect(content).toContain("targetEntryHint");
    expect(content).toContain("Python FastAPI Linux");
    expect(content).toContain("Docker");
    expect(content).toContain("RAG");
  });
});
