import React, { useMemo, useState } from "react";
import { Button, Input, message, Modal, Radio, Space } from "antd";
import { AiTaskOption, AiTaskType, GeneratedBullet, JobDiagnosisReport, ResumeAnalysisResult } from "@src/types/ai";
import {
  isAiConfigError,
  loadAiConfig,
  runJobMatchAnalysis,
  runResumeAiTask,
} from "@src/service/ai";
import { analyzeJobDiagnosis } from "@src/service/jobDiagnosis";
import { applyGeneratedBulletToBlocks, getGeneratedBulletKey } from "@src/utils/aiApply";
import { buildParagraphDiff, ParagraphDiffRow } from "@src/utils/markdownDiff";
import { useStores } from "@src/store";
import ResumeAnalysisReportView from "./ResumeAnalysisReport";
import JobDiagnosisReportView from "./JobDiagnosisReport";
import "./index.less";

const { TextArea } = Input;

type BulletState = {
  applied?: boolean;
  duplicate?: boolean;
  notice?: string;
};

const taskOptions: AiTaskOption[] = [
  {
    type: "polish",
    title: "简历润色",
    description: "优化表达、语气和结构，不主动编造经历。",
  },
  {
    type: "job_match",
    title: "岗位匹配分析",
    description: "分析关键词覆盖、优势、待提升项和可复制的补充内容。",
  },
  {
    type: "job_diagnosis",
    title: "求职诊断",
    description: "本地规则合并 ATS 检查、JD 关键词覆盖、技能覆盖和经历匹配。",
  },
];

interface ResumeAiModalProps {
  visible: boolean;
  markdown: string;
  blockMode?: boolean;
  onCancel: () => void;
  onApply: (content: string, mode: "insert" | "replace") => void;
  onOpenSettings: () => void;
}

const ResumeAiModal: React.FC<ResumeAiModalProps> = ({
  visible,
  markdown,
  blockMode,
  onCancel,
  onApply,
  onOpenSettings,
}) => {
  const { templateStore } = useStores();
  const [taskType, setTaskType] = useState<AiTaskType>("polish");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [jobDiagnosisReport, setJobDiagnosisReport] = useState<JobDiagnosisReport | null>(null);
  const [bulletStates, setBulletStates] = useState<Record<string, BulletState>>({});
  const [loading, setLoading] = useState(false);

  const currentTask = useMemo(
    () => taskOptions.find((item) => item.type === taskType) || taskOptions[0],
    [taskType]
  );

  const runTask = async () => {
    if (taskType === "job_match" && !jobDescription.trim()) {
      message.warning("请先粘贴岗位描述。");
      return;
    }

    setLoading(true);
    try {
      if (taskType === "job_match") {
        const report = await runJobMatchAnalysis(markdown, jobDescription, loadAiConfig());
        setAnalysisResult(report);
        setJobDiagnosisReport(null);
        setResult("");
        setBulletStates({});
      } else if (taskType === "job_diagnosis") {
        const report = analyzeJobDiagnosis(markdown, jobDescription);
        setJobDiagnosisReport(report);
        setAnalysisResult(null);
        setResult("");
        setBulletStates({});
      } else {
        const content = await runResumeAiTask(
          taskType,
          markdown,
          jobDescription,
          loadAiConfig()
        );
        setResult(content);
        setAnalysisResult(null);
        setJobDiagnosisReport(null);
      }
      message.success(taskType === "job_diagnosis" ? "求职诊断已完成" : "AI 结果已生成");
    } catch (e: any) {
      const errorMessage = e?.message || "AI 请求失败，请检查配置后重试。";
      if (isAiConfigError(e)) {
        Modal.confirm({
          title: "请先配置 AI 服务",
          content: "按向导选择服务商并粘贴 API Key，测试连接成功后即可使用 AI 助手。",
          okText: "打开设置",
          cancelText: "稍后再说",
          onOk: onOpenSettings,
        });
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    message.success("已复制 AI 结果");
  };

  const isAnalysisMode = taskType === "job_match";
  const isDiagnosisMode = taskType === "job_diagnosis";
  const isReportMode = isAnalysisMode || isDiagnosisMode;

  return (
    <Modal
      title="AI 助手"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={920}
      className="resume-ai-modal"
      destroyOnClose={false}
    >
      <div className="resume-ai">
        <div className="resume-ai__section">
          <label>任务类型</label>
          <Radio.Group
            value={taskType}
            onChange={(event) => {
              setTaskType(event.target.value as AiTaskType);
              setResult("");
              setAnalysisResult(null);
              setJobDiagnosisReport(null);
              setBulletStates({});
            }}
            className="resume-ai__task-group"
          >
            {taskOptions.map((item) => (
              <Radio.Button value={item.type} key={item.type}>
                {item.title}
              </Radio.Button>
            ))}
          </Radio.Group>
          <p>{currentTask.description}</p>
        </div>
        <div className="resume-ai__section">
          <label>{isAnalysisMode ? "岗位描述（JD）" : "岗位 JD（可选）"}</label>
          <TextArea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            placeholder="粘贴目标岗位描述、任职要求或招聘 JD"
          />
        </div>
        <Button type="primary" loading={loading} onClick={runTask}>
          {isAnalysisMode ? "开始分析" : isDiagnosisMode ? "开始诊断" : "生成优化结果"}
        </Button>
        <div className="resume-ai__result">
          <div className="resume-ai__result-title">
            {isAnalysisMode ? "岗位匹配分析" : isDiagnosisMode ? "求职诊断" : "AI 结果"}
          </div>
          {isReportMode ? (
            isDiagnosisMode ? (
              jobDiagnosisReport ? (
                <JobDiagnosisReportView
                  report={jobDiagnosisReport}
                  resumeMarkdown={markdown}
                  jobDescription={jobDescription}
                  onOpenSettings={onOpenSettings}
                />
              ) : (
                <div className="resume-ai__placeholder">点击开始诊断，查看 ATS 风险、关键词覆盖和经历匹配。</div>
              )
            ) : (
            analysisResult?.kind === "report" ? (
              <ResumeAnalysisReportView
                report={analysisResult.report}
                onApplyBullet={(bullet: GeneratedBullet) => {
                  const applyResult = applyGeneratedBulletToBlocks(templateStore.blocks, bullet);
                  const key = getGeneratedBulletKey(bullet);
                  if (applyResult.applied) {
                    templateStore.setBlocks(applyResult.blocks);
                    message.success(`已添加至「${applyResult.targetTitle}」`);
                  } else if (applyResult.duplicate) {
                    message.info("这条内容已在简历中");
                  }
                  setBulletStates((prev) => ({
                    ...prev,
                    [key]: {
                      applied: applyResult.applied,
                      duplicate: applyResult.duplicate,
                      notice: applyResult.notice,
                    },
                  }));
                }}
                bulletStates={bulletStates}
              />
            ) : analysisResult?.kind === "fallback" ? (
              <TextArea value={analysisResult.rawText} rows={12} readOnly />
            ) : (
              <div className="resume-ai__placeholder">粘贴岗位描述后开始分析。</div>
            )
            )
          ) : (
            <>
              <TextArea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={12}
                placeholder="生成结果会显示在这里。确认后再复制、插入或替换，不会自动覆盖当前简历。"
              />
              <ParagraphDiffPreview rows={buildParagraphDiff(markdown, result)} hasResult={!!result} />
              <Space className="resume-ai__actions">
                <Button disabled={!result} onClick={copyResult}>
                  复制结果
                </Button>
                {blockMode ? (
                  <Button disabled={!result} onClick={() => onApply(result, "insert")}>
                    追加为新章节
                  </Button>
                ) : (
                  <Button disabled={!result} onClick={() => onApply(result, "insert")}>
                    插入当前位置
                  </Button>
                )}
                <Button
                  danger
                  disabled={!result}
                  onClick={() => onApply(result, "replace")}
                >
                  替换全文
                </Button>
              </Space>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

const ParagraphDiffPreview: React.FC<{ rows: ParagraphDiffRow[]; hasResult: boolean }> = ({
  rows,
  hasResult,
}) => (
  <section className="resume-ai-diff">
    <div className="resume-ai-diff__title">段落级改动预览</div>
    <div className="resume-ai-diff__header">
      <span>原文</span>
      <span>AI 结果</span>
    </div>
    <div className="resume-ai-diff__rows">
      {hasResult ? rows.map((row, index) => (
        <div className={`resume-ai-diff__row resume-ai-diff__row--${row.type}`} key={`${row.type}-${index}`}>
          <p>{row.before || ""}</p>
          <p>{row.after || ""}</p>
        </div>
      )) : (
        <div className="resume-ai-diff__empty">生成结果后会在这里标出新增、删除和修改的段落。</div>
      )}
    </div>
  </section>
);

export default ResumeAiModal;
