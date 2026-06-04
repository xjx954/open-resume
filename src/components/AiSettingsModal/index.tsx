import React, { useEffect, useState } from "react";
import { Alert, Button, Input, Modal } from "antd";
import { AiConfig } from "@src/types/ai";
import {
  loadAiConfig,
  providerPresets,
  saveAiConfig,
  testAiConnection,
} from "@src/service/aiConfig";
import "./index.less";

interface AiSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
}

type ConnectionStatus =
  | { type: "idle" }
  | { type: "success"; providerLabel: string }
  | { type: "error"; message: string };

function getDefaultProviderKey(config: AiConfig) {
  if (!config.apiKey.trim()) {
    return "deepseek";
  }
  const matched = providerPresets.find((item) =>
    item.baseURL === config.baseURL && item.model === config.model
  );
  return matched?.key || "deepseek";
}

const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ visible, onCancel }) => {
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());
  const [selectedProviderKey, setSelectedProviderKey] = useState(() => getDefaultProviderKey(loadAiConfig()));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ type: "idle" });

  const selectedProvider =
    providerPresets.find((item) => item.key === selectedProviderKey) ||
    providerPresets.find((item) => item.key === "deepseek") ||
    providerPresets[0];

  useEffect(() => {
    if (visible) {
      const loaded = loadAiConfig();
      setConfig(loaded);
      setSelectedProviderKey(getDefaultProviderKey(loaded));
      setConnectionStatus({ type: "idle" });
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

  const applyProviderPreset = (presetKey: string, apiKey = config.apiKey) => {
    const preset = providerPresets.find((item) => item.key === presetKey);
    if (!preset) return;
    const nextConfig = {
      ...config,
      apiKey,
      baseURL: preset.baseURL,
      model: preset.model,
    };
    setSelectedProviderKey(presetKey);
    setConfig(nextConfig);
    saveAiConfig(nextConfig);
    setConnectionStatus({ type: "idle" });
  };

  const updateApiKey = (apiKey: string) => {
    applyProviderPreset(selectedProvider.key, apiKey);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus({ type: "idle" });
    const result = await testAiConnection(config);
    setTesting(false);
    if (result.ok) {
      setConnectionStatus({ type: "success", providerLabel: selectedProvider.label });
    } else {
      setConnectionStatus({ type: "error", message: result.message || "连接失败，请检查配置。" });
    }
  };

  return (
    <Modal
      title="AI 服务配置向导"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
    >
      <div className="ai-settings">
        <Alert
          type="info"
          showIcon
          message="按下面 3 步完成配置。普通用户只需要选择服务商并粘贴 API Key。"
        />
        <div className="ai-settings__section">
          <label>1. 选择 AI 服务商</label>
          <div className="ai-provider-grid">
            {providerPresets.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`ai-provider-card ${selectedProviderKey === item.key ? "ai-provider-card--active" : ""}`}
                onClick={() => applyProviderPreset(item.key)}
              >
                <span>{item.label}</span>
                <strong>{item.model}</strong>
                {item.key === "deepseek" && <em>推荐新用户使用</em>}
              </button>
            ))}
          </div>
        </div>
        <div className="ai-settings__section">
          <label>2. 获取并粘贴 API Key</label>
          <div className="ai-settings__steps">
            <span>打开 {selectedProvider.label} 控制台</span>
            <span>创建或复制 API Key</span>
            <span>粘贴到下方输入框</span>
          </div>
          <a className="ai-settings__help-link" href={selectedProvider.helpUrl} target="_blank" rel="noreferrer">
            去申请 {selectedProvider.label} API Key
          </a>
          <Input.Password
            value={config.apiKey}
            onChange={(e) => updateApiKey(e.target.value)}
            placeholder="粘贴你的 API Key"
          />
        </div>
        <div className="ai-settings__section">
          <label>3. 测试连接</label>
          <div className="ai-settings__test-row">
            <Button type="primary" loading={testing} disabled={!config.apiKey.trim()} onClick={handleTestConnection}>
              测试连接
            </Button>
            {connectionStatus.type === "success" && (
              <span className="ai-settings__status ai-settings__status--success">
                AI 服务已连接：{connectionStatus.providerLabel}
              </span>
            )}
            {connectionStatus.type === "error" && (
              <span className="ai-settings__status ai-settings__status--error">
                {connectionStatus.message}
              </span>
            )}
          </div>
        </div>
        <Alert
          type="warning"
          showIcon
          message="API Key 会保存在本机浏览器 localStorage 中。建议使用有额度限制的 Key，不要填入主账号高权限 Key。"
        />
        <Button type="link" className="ai-settings__advanced-toggle" onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? "收起高级设置" : "展开高级设置"}
        </Button>
        {advancedOpen && (
          <>
            <div className="ai-settings__section">
              <label htmlFor="ai-base-url">Base URL</label>
              <Input
                id="ai-base-url"
                value={config.baseURL}
                onChange={(e) => updateConfig("baseURL", e.target.value)}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
            <div className="ai-settings__section">
              <label htmlFor="ai-model">Model</label>
              <Input
                id="ai-model"
                value={config.model}
                onChange={(e) => updateConfig("model", e.target.value)}
                placeholder="deepseek-chat / qwen-plus / gpt-4o-mini"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AiSettingsModal;
