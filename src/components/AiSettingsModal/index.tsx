import React, { useEffect, useState } from "react";
import { Alert, Input, Modal, Select } from "antd";
import { AiConfig } from "@src/types/ai";
import {
  loadAiConfig,
  providerPresets,
  saveAiConfig,
} from "@src/service/aiConfig";
import "./index.less";

interface AiSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
}

const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ visible, onCancel }) => {
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());

  useEffect(() => {
    if (visible) {
      setConfig(loadAiConfig());
    }
  }, [visible]);

  const updateConfig = (key: keyof AiConfig, value: string) => {
    const nextConfig = {
      ...config,
      [key]: value,
    };
    setConfig(nextConfig);
    saveAiConfig(nextConfig);
  };

  const applyProviderPreset = (presetKey: string) => {
    const preset = providerPresets.find((item) => item.key === presetKey);
    if (!preset) return;
    const nextConfig = {
      ...config,
      baseURL: preset.baseURL,
      model: preset.model,
    };
    setConfig(nextConfig);
    saveAiConfig(nextConfig);
  };

  return (
    <Modal
      title="AI 服务配置"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={640}
    >
      <div className="ai-settings">
        <Alert
          type="info"
          showIcon
          message="这些设置只用于 AI 助手和选中文本润色，普通编辑流程不会展示模型参数。"
        />
        <div className="ai-settings__section">
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
          <div className="ai-settings__links">
            {providerPresets.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && <span>/</span>}
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
        <div className="ai-settings__section">
          <label>API Key</label>
          <Input.Password
            value={config.apiKey}
            onChange={(e) => updateConfig("apiKey", e.target.value)}
            placeholder="sk-..."
          />
        </div>
        <div className="ai-settings__section">
          <label>Base URL</label>
          <Input
            value={config.baseURL}
            onChange={(e) => updateConfig("baseURL", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>
        <div className="ai-settings__section">
          <label>Model</label>
          <Input
            value={config.model}
            onChange={(e) => updateConfig("model", e.target.value)}
            placeholder="gpt-4o-mini / deepseek-chat / qwen-plus"
          />
        </div>
      </div>
    </Modal>
  );
};

export default AiSettingsModal;
