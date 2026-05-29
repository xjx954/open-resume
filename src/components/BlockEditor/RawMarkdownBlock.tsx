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
        这段内容包含暂不支持结构化编辑的格式，可在这里精细调整。如需更完整的编辑体验，可以切换到 Markdown 模式。
      </div>
      <Input.TextArea
        rows={6}
        value={data.markdown}
        onChange={e => onChange({ markdown: e.target.value })}
        placeholder="补充内容"
      />
    </div>
  );
};

export default RawMarkdownBlock;
