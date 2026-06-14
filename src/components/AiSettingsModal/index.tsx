import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal } from "antd";
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
  const matched = providerPresets.find(
    (item) => item.baseURL === config.baseURL && item.model === config.model
  );
  return matched?.key || "deepseek";
}

const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ visible, onCancel }) => {
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());
  const [selectedProviderKey, setSelectedProviderKey] = useState(() =>
    getDefaultProviderKey(loadAiConfig())
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: "idle",
  });

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
      setAdvancedOpen(false);
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
      setConnectionStatus({
        type: "success",
        providerLabel: selectedProvider.label,
      });
    } else {
      setConnectionStatus({
        type: "error",
        message: result.message || "连接失败，请检查配置。",
      });
    }
  };

  const isKeyFormatValid = useMemo(
    () => config.apiKey.trim().length >= 10,
    [config.apiKey]
  );

  const renderFooter = () => {
    if (connectionStatus.type === "success") {
      return (
        <Button type="primary" size="large" onClick={onCancel}>
          ✅ 完成配置
        </Button>
      );
    }
    return <Button onClick={onCancel}>取消</Button>;
  };

  return (
    <Modal
      title="AI 服务配置"
      visible={visible}
      onCancel={onCancel}
      footer={renderFooter()}
      width={680}
    >
      <div className="ai-settings">
        {/* Guide banner */}
        <div className="ai-settings__guide">
          选服务商 → 粘贴 Key → 测试，三步就能用上 AI 助手
        </div>

        {/* Provider selection */}
        <div className="ai-settings__section">
          <label>选择服务商</label>
          <div className="ai-provider-grid">
            {providerPresets.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`ai-provider-card${
                  selectedProviderKey === item.key
                    ? " ai-provider-card--active"
                    : ""
                }`}
                onClick={() => applyProviderPreset(item.key)}
              >
                <span className="ai-provider-card__header">
                  <strong>{item.label}</strong>
                  {item.key === "deepseek" && <em>🔥 推荐</em>}
                </span>
                <small className="ai-provider-card__model">{item.model}</small>
                <span className="ai-provider-card__desc">
                  {item.description}
                </span>
                <span className="ai-provider-card__tags">
                  {item.tags.map((tag) => (
                    <i key={tag}>{tag}</i>
                  ))}
                </span>
                <a
                  className="ai-provider-card__keylink"
                  href={item.helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  去获取 Key →
                </a>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="ai-settings__section">
          <label className="ai-settings__key-label">
            API Key
            {isKeyFormatValid && (
              <span className="ai-settings__key-ok">✅ 格式正确</span>
            )}
          </label>
          <div className="ai-settings__key-row">
            <Input.Password
              value={config.apiKey}
              onChange={(e) => updateApiKey(e.target.value)}
              placeholder="粘贴你的 API Key，通常以 sk- 开头"
              size="large"
            />
          </div>
        </div>

        {/* Test */}
        <div className="ai-settings__section ai-settings__section--test">
          <Button
            type="primary"
            size="large"
            loading={testing}
            disabled={!config.apiKey.trim()}
            onClick={handleTestConnection}
          >
            🧪 测试连接
          </Button>
          {connectionStatus.type === "success" && (
            <div className="ai-settings__result ai-settings__result--success">
              ✅ AI 服务已连接 · {connectionStatus.providerLabel}
            </div>
          )}
          {connectionStatus.type === "error" && (
            <div className="ai-settings__result ai-settings__result--error">
              ❌ {connectionStatus.message}
            </div>
          )}
        </div>

        {/* Security footnote */}
        <div className="ai-settings__footnote">
          🔒 API Key 会以明文形式保存在本机浏览器 localStorage。请只使用有额度限制、可随时撤销的 Key，不要在不可信设备上配置。
        </div>

        {/* Advanced settings */}
        <Button
          type="link"
          className="ai-settings__advanced-toggle"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          {advancedOpen ? "收起高级设置" : "高级设置（通常无需修改）"}
        </Button>
        {advancedOpen && (
          <>
            <div className="ai-settings__section">
              <label htmlFor="ai-base-url">接口地址（Base URL）</label>
              <Input
                id="ai-base-url"
                value={config.baseURL}
                onChange={(e) => updateConfig("baseURL", e.target.value)}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
            <div className="ai-settings__section">
              <label htmlFor="ai-model">模型名称（Model）</label>
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
