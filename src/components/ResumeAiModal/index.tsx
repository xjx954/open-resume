import React, { useMemo, useState } from "react";
import { Alert, Button, Input, message, Modal, Select, Space, Tabs } from "antd";
import { AiConfig, AiTaskOption, AiTaskType } from "@src/types/ai";
import { runResumeAiTask } from "@src/service/ai";
import "./index.less";

const { TextArea } = Input;

const AI_CONFIG_KEY = "open-resume-ai-config";

const defaultConfig: AiConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

const providerPresets = [
  {
    key: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    helpUrl: "https://platform.openai.com/api-keys",
  },
  {
    key: "deepseek",
    label: "DeepSeek V3",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    helpUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    key: "qwen",
    label: "通义千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    helpUrl: "https://bailian.console.aliyun.com/",
  },
  {
    key: "glm",
    label: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4",
    helpUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
];

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

function loadConfig(): AiConfig {
  try {
    const config = localStorage.getItem(AI_CONFIG_KEY);
    return config ? { ...defaultConfig, ...JSON.parse(config) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

interface ResumeAiModalProps {
  visible: boolean;
  markdown: string;
  blockMode?: boolean;
  onCancel: () => void;
  onApply: (content: string, mode: "insert" | "replace") => void;
}

const ResumeAiModal: React.FC<ResumeAiModalProps> = ({
  visible,
  markdown,
  blockMode,
  onCancel,
  onApply,
}) => {
  const [taskType, setTaskType] = useState<AiTaskType>("polish");
  const [jobDescription, setJobDescription] = useState("");
  const [config, setConfig] = useState<AiConfig>(() => loadConfig());
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTask = useMemo(
    () => taskOptions.find((item) => item.type === taskType) || taskOptions[0],
    [taskType]
  );

  const updateConfig = (key: keyof AiConfig, value: string) => {
    const nextConfig = {
      ...config,
      [key]: value,
    };
    setConfig(nextConfig);
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(nextConfig));
  };

  const applyProviderPreset = (presetKey: string) => {
    const preset = providerPresets.find(item => item.key === presetKey);
    if (!preset) return;
    const nextConfig = {
      ...config,
      baseURL: preset.baseURL,
      model: preset.model,
    };
    setConfig(nextConfig);
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(nextConfig));
  };

  const runTask = async () => {
    setLoading(true);
    try {
      const content = await runResumeAiTask(
        taskType,
        markdown,
        jobDescription,
        config
      );
      setResult(content);
      message.success("AI 结果已生成");
    } catch (e: any) {
      message.error(e?.message || "AI 请求失败，请检查配置后重试。");
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
      title="AI 简历优化"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={920}
      destroyOnClose={false}
    >
      <div className="resume-ai">
        <Tabs defaultActiveKey="task">
          <Tabs.TabPane tab="优化任务" key="task">
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
          </Tabs.TabPane>
          <Tabs.TabPane tab="模型配置" key="config">
            <div className="resume-ai__section">
              <label>服务商预设</label>
              <Select
                placeholder="选择后自动填入 Base URL 和 Model"
                style={{ width: "100%" }}
                onChange={applyProviderPreset}
              >
                {providerPresets.map((item) => (
                  <Select.Option value={item.key} key={item.key}>
                    {item.label} - {item.model}
                  </Select.Option>
                ))}
              </Select>
              <div style={{ marginTop: 8 }}>
                {providerPresets.map((item, index) => (
                  <React.Fragment key={item.key}>
                    {index > 0 && <span style={{ color: "#d1d5db", margin: "0 6px" }}>/</span>}
                    <a href={item.helpUrl} target="_blank" rel="noreferrer">
                      {item.label} Key
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <Alert
              type="warning"
              showIcon
              message="API Key 会保存在本机浏览器 localStorage 中。建议使用有额度限制的 Key，不要填入主账号高权限 Key。"
            />
            <div className="resume-ai__section">
              <label>API Key</label>
              <Input.Password
                value={config.apiKey}
                onChange={(e) => updateConfig("apiKey", e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div className="resume-ai__section">
              <label>Base URL</label>
              <Input
                value={config.baseURL}
                onChange={(e) => updateConfig("baseURL", e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="resume-ai__section">
              <label>Model</label>
              <Input
                value={config.model}
                onChange={(e) => updateConfig("model", e.target.value)}
                placeholder="gpt-4o-mini / deepseek-chat / qwen-plus"
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
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
