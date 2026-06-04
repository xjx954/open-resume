# P1 JD/ATS Analysis Design

## Summary

Build P1-A as a focused JD matching and ATS analysis MVP inside the existing AI Assistant. The feature turns the current `match_jd` and `ats_keywords` text-generation tasks into a structured, user-facing report that helps candidates decide what to improve before applying.

This release does not automatically rewrite the resume, import PDF/DOCX files, or mutate block editor content. It reads the current resume Markdown from the existing editor state, accepts an optional job description, calls the existing OpenAI-compatible AI service, and renders an actionable report with scores, keyword gaps, strengths, risks, suggestions, and copyable bullet ideas.

## Goals

- Give users a clear JD match and ATS readiness report without leaving the editor.
- Reuse the P0 AI configuration and AI Assistant entry point.
- Keep resume content safe by making recommendations read-only in this milestone.
- Preserve the Markdown/block editor contract: no changes to `blockSerializer`, `templateStore.blocks`, or Markdown import behavior.

## Non-Goals

- No automatic resume editing or one-click apply.
- No PDF/DOCX parsing or upload-based resume import.
- No backend AI proxy.
- No persistent report history.
- No hard guarantee that AI-generated scores are objectively accurate; scores are guidance, not compliance certification.

## User Experience

The AI Assistant keeps a single modal entry from the editor toolbar.

For P1-A, the assistant shows three user-facing modes:

- `简历润色`: existing full-resume improvement flow.
- `JD 匹配分析`: requires a pasted job description.
- `ATS 检测`: can run without JD, but uses JD when provided for keyword coverage.

When the user chooses `JD 匹配分析` or `ATS 检测`:

- The left side keeps the job description input and task action.
- The right side renders a structured analysis report instead of a raw textarea.
- The report displays score cards, missing keywords, matched strengths, risks, suggestions, and insertable bullet ideas.
- Each keyword, suggestion, and bullet can be copied.
- If AI service configuration is missing, the existing `AI 服务配置` prompt opens the settings modal.

## Report Shape

The AI service should return parseable JSON for analysis tasks. The UI must tolerate malformed model output by falling back to a plain-text report view.

```ts
export interface ResumeAnalysisReport {
  overallScore: number;
  jdMatchScore: number;
  atsScore: number;
  summary: string;
  missingKeywords: string[];
  strengths: string[];
  risks: string[];
  suggestions: Array<{
    section: "summary" | "skills" | "experience" | "projects" | "education" | "other";
    title: string;
    detail: string;
  }>;
  insertableBullets: Array<{
    targetSection: "skills" | "experience" | "projects" | "other";
    content: string;
  }>;
}

export interface ResumeAnalysisFallback {
  rawText: string;
}
```

Score fields should be clamped to `0..100` in the parser. Empty arrays are valid when the model cannot identify useful items.

## Implementation Approach

- Extend `src/types/ai.ts` with `ResumeAnalysisReport`, suggestion, bullet, and analysis mode types.
- Add a parser/helper module for AI analysis reports that:
  - extracts JSON from raw model output,
  - normalizes missing fields,
  - clamps numeric scores,
  - returns a plain-text fallback when JSON parsing fails.
- Extend `src/service/ai.ts` with `runResumeAnalysisTask(...)` for `jd_match` and `ats_check` analysis modes.
- Refactor `ResumeAiModal` into two result render paths:
  - existing text result for polish/quantify,
  - structured report component for JD/ATS.
- Add a focused `ResumeAnalysisReport` component for score cards, lists, copy buttons, and fallback text.
- Keep `runResumeAiTask(...)` available for existing text tasks to avoid breaking P0 behavior.

## Error Handling

- Missing AI config uses the existing stable config error flow and settings modal.
- Empty JD in `JD 匹配分析` shows a user-facing warning before calling AI.
- Empty JD in `ATS 检测` is allowed; the report should omit JD-specific keyword coverage when no JD is provided.
- AI network errors show the existing message error.
- Malformed JSON from AI does not fail the whole task; the raw text is rendered as fallback.

## Testing

Unit tests:

- Parser clamps scores and fills missing arrays.
- Parser extracts JSON from fenced Markdown output.
- Parser returns fallback text for malformed JSON.
- AI service sends the current resume Markdown and JD to the chat completions API.

Component tests:

- Report component renders scores, keywords, suggestions, and copyable bullets.
- `ResumeAiModal` does not show raw textarea for JD/ATS report mode after a successful structured response.

Regression tests:

- Existing AI config tests still pass.
- Existing `blockSerializer` tests still pass.
- Existing template gallery tests still pass.

Browser verification:

- Open `/editor`.
- Open `AI 助手`.
- Choose `JD 匹配分析`, paste a JD, run analysis with a mocked or configured AI response.
- Confirm structured report renders and does not modify the resume preview.

## Assumptions

- The current P0 AI Assistant and AI settings flow are already merged or available on this branch.
- Users provide their own OpenAI-compatible API key.
- This milestone prioritizes useful guidance over automated editing.
- Future P1 work can add "insert suggestion into section" using the structured `targetSection` fields.
