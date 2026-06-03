import React, { useMemo, useState } from "react";
import { Button, Input, message, Modal, Select, Space } from "antd";
import { AiTaskOption, AiTaskType } from "@src/types/ai";
import { runResumeAiTask } from "@src/service/ai";
import { isAiConfigError, loadAiConfig } from "@src/service/aiConfig";
import "./index.less";

const { TextArea } = Input;

const taskOptions: AiTaskOption[] = [
  {
    type: "polish",
    title: "简历润色",
    description: "优化表达、语气和结构，不主动编造经历。",
  },
  {
    type: "match_jd",
    title: "匹配 JD",
    description: "根据岗位描述突出匹配点和关键词。",
  },
  {
    type: "quantify",
    title: "经历量化",
    description: "把职责描述改成更结果导向的表达。",
  },
  {
    type: "ats_keywords",
    title: "ATS 建议",
    description: "输出关键词、缺失项和可插入 bullet。",
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
  const [taskType, setTaskType] = useState<AiTaskType>("polish");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTask = useMemo(
    () => taskOptions.find((item) => item.type === taskType) || taskOptions[0],
    [taskType]
  );

  const runTask = async () => {
    setLoading(true);
    try {
      const content = await runResumeAiTask(
        taskType,
        markdown,
        jobDescription,
        loadAiConfig()
      );
      setResult(content);
      message.success("AI 结果已生成");
    } catch (e: any) {
      const errorMessage = e?.message || "AI 请求失败，请检查配置后重试。";
      if (isAiConfigError(e)) {
        Modal.confirm({
          title: "请先配置 AI 服务",
          content: "前往设置中的 AI 服务配置，填写 API Key、Base URL 和 Model 后即可使用 AI 助手。",
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

  return (
    <Modal
      title="AI 助手"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={920}
      destroyOnClose={false}
    >
      <div className="resume-ai">
        <div className="resume-ai__section">
          <label>任务类型</label>
          <Select
            value={taskType}
            onChange={setTaskType}
            style={{ width: "100%" }}
          >
            {taskOptions.map((item) => (
              <Select.Option value={item.type} key={item.type}>
                {item.title}
              </Select.Option>
            ))}
          </Select>
          <p>{currentTask.description}</p>
        </div>
        <div className="resume-ai__section">
          <label>岗位 JD（匹配 JD / ATS 建议时建议填写）</label>
          <TextArea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            placeholder="粘贴目标岗位描述、任职要求或招聘 JD"
          />
        </div>
        <Button type="primary" loading={loading} onClick={runTask}>
          生成优化结果
        </Button>
        <div className="resume-ai__result">
          <div className="resume-ai__result-title">AI 结果</div>
          <TextArea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={12}
            placeholder="生成结果会显示在这里。确认后再复制、插入或替换，不会自动覆盖当前简历。"
          />
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
        </div>
      </div>
    </Modal>
  );
};

export default ResumeAiModal;
