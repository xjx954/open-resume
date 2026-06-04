# P1 Job Match Analysis Design

## Summary

P1-A is now a focused `岗位匹配分析` flow inside the existing AI Assistant. It does not present ATS scores, JD match scores, overall scores, or any total score. The report answers three practical questions: what is missing, why it matters, and how to supplement the resume.

This release reuses the current frontend OpenAI-compatible AI configuration and the current resume Markdown. It does not automatically mutate resume content, import PDF/DOCX files, add a backend proxy, or persist report history.

## Goals

- Show explainable keyword coverage based on local calculation.
- Let AI explain advantages, improvement areas, and concrete suggestions.
- Generate copyable resume bullet suggestions tied to source keywords.
- Preserve the existing Markdown/block editor contract, including Markdown import and preview behavior.

## Non-Goals

- No ATS scoring system.
- No JD match score, overall score, or pass/fail judgment.
- No automatic insertion into project, work, or skills sections in this milestone.
- No backend AI proxy or server-side keyword extraction.
- No claim that AI analysis represents real employer screening rules.

## User Experience

The editor toolbar keeps one `AI 助手` entry.

The assistant exposes two visible tasks:

- `简历润色`: existing full-resume improvement flow.
- `岗位匹配分析`: requires a pasted job description.

When the user chooses `岗位匹配分析`:

- The left side asks for the job description.
- Empty JD shows `请先粘贴岗位描述。` and does not call AI.
- The right side renders a structured report after analysis.
- Suggestions and generated bullets can be copied.
- Missing AI configuration uses the existing `AI 服务配置` settings prompt.

## Report Shape

```ts
interface ResumeAnalysisReport {
  keywordCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  advantages: string[];
  improvementAreas: string[];
  suggestions: Suggestion[];
  generatedBullets: Array<{
    targetSection: string;
    sourceKeyword: string;
    content: string;
    insertable?: boolean;
  }>;
  radarScores: {
    technical: number;
    project: number;
    impact: number;
    keywordCoverage: number;
    engineering: number;
  };
}
```

`keywordCoverage`, `matchedKeywords`, and `missingKeywords` are local results. If the model returns fields with the same names, the parser ignores them and keeps the local calculation.

## Local Keyword Coverage

The flow first extracts candidate keywords from the JD using lightweight local rules:

- English technical tokens such as `Python`, `FastAPI`, `Docker`, `C++`, `Node.js`.
- Chinese skill terms with at least two characters.
- Deduplication by lowercase key.
- Common generic words are ignored.

The resume Markdown is matched case-insensitively.

Example:

```text
JD: Python / FastAPI / Docker / Linux / RAG
Resume: Python / FastAPI / Linux
Matched: Python, FastAPI, Linux
Missing: Docker, RAG
Coverage: 3 / 5 = 60%
```

## AI Responsibility

The model receives the resume Markdown, JD, and local keyword results. It should only return:

- advantages
- improvementAreas
- suggestions
- generatedBullets
- radarScores

The prompt forbids ATS score, JD score, total score, fabricated experience, invented projects, and unsupported numeric claims. `generatedBullets.sourceKeyword` must correspond to a missing keyword or relevant JD keyword.

## Report UI

The report displays:

- 关键词覆盖率
- 已匹配关键词
- 缺失关键词
- 竞争力分析 using stars, not raw numeric scores
- 优势分析
- 待提升项
- 优化建议
- AI 生成补充内容 with `来源关键词`
- Disclaimer: `本分析由 AI 根据当前简历和岗位描述生成，用于辅助优化简历，不代表招聘方实际筛选规则。`

## Testing

Unit tests:

- Local coverage computes `60%` for the Python/FastAPI/Docker/Linux/RAG example.
- Keyword matching is case-insensitive and deduplicated.
- Parser keeps local coverage over model-provided coverage fields.
- Parser supports fenced JSON and returns fallback text for malformed JSON.
- Parser uses `advantages` and `improvementAreas`, not `strengths` and `weaknesses` as primary fields.
- `generatedBullets` preserves `targetSection`, `sourceKeyword`, `content`, and `insertable`.
- Empty JD does not call fetch.

Component tests:

- `ResumeAiModal` only exposes `简历润色` and `岗位匹配分析`.
- Report renders coverage, matched and missing keywords, advantages, improvement areas, suggestions, generated bullets, source keywords, and disclaimer.
- Report UI does not show ATS score, JD match score, overall score, ATS scoring, ATS detection, or total score language.

Regression tests:

- Existing AI config tests continue to pass.
- Existing `blockSerializer` tests continue to pass.
- Existing template gallery tests continue to pass.

Browser verification:

- Open `/editor`.
- Open `AI 助手`.
- Choose `岗位匹配分析`.
- Paste a JD and run analysis.
- Confirm the structured report renders, copy actions work, and resume preview/store content is not changed.

## Assumptions

- The local keyword extractor remains lightweight and dependency-free.
- `keywordCoverage` is explainable keyword coverage, not a resume score.
- `radarScores` are only converted to star-style qualitative indicators.
- This milestone only supports copying generated content; `insertable?: boolean` reserves future insertion behavior.
