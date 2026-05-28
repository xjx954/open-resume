import React from 'react';
import { Input } from 'antd';
import { RawMarkdownData } from '@src/types/resume';

interface Props {
  data: RawMarkdownData;
  onChange: (data: RawMarkdownData) => void;
}

const RawMarkdownBlock: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="block-editor-raw">
      <div className="block-raw-notice">
        此内容包含复杂 Markdown 格式，无法完全转换为块编辑。你可以在下方直接编辑原始 Markdown，或切换到 Markdown 模式处理。
      </div>
      <Input.TextArea
        rows={6}
        value={data.markdown}
        onChange={e => onChange({ markdown: e.target.value })}
        placeholder="原始 Markdown 内容"
      />
    </div>
  );
};

export default RawMarkdownBlock;
