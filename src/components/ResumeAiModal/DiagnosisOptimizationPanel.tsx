import React from "react";
import { Button, Space } from "antd";
import {
  JobDiagnosisOptimizationIssue,
  JobDiagnosisOptimizationResult,
} from "@src/types/ai";

interface Props {
  issue: JobDiagnosisOptimizationIssue;
  result: JobDiagnosisOptimizationResult;
  loading?: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

const DiagnosisOptimizationPanel: React.FC<Props> = ({
  issue,
  result,
  loading,
  onCopy,
  onRegenerate,
  onClose,
}) => (
  <section className="diagnosis-optimization-panel">
    <div className="diagnosis-optimization-panel__head">
      <div>
        <span>AI 生成优化版本</span>
        <strong>{issue.title}</strong>
      </div>
      <Button size="small" onClick={onClose}>
        关闭
      </Button>
    </div>
    <div className="diagnosis-optimization-panel__body">
      <div>
        <label>原内容</label>
        <p>{result.originalContent}</p>
      </div>
      <div>
        <label>优化后</label>
        <p>{result.optimizedContent}</p>
      </div>
      <div>
        <label>说明</label>
        <p>{result.explanation}</p>
      </div>
    </div>
    <Space className="diagnosis-optimization-panel__actions">
      <Button size="small" onClick={onCopy}>
        复制
      </Button>
      <Button size="small" loading={loading} onClick={onRegenerate}>
        再次生成
      </Button>
    </Space>
  </section>
);

export default DiagnosisOptimizationPanel;
