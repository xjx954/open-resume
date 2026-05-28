import React from 'react';
import { Input, Select } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { SectionData, SectionItem } from '@src/types/resume';

interface Props {
  data: SectionData;
  onChange: (data: SectionData) => void;
}

const SectionBlock: React.FC<Props> = ({ data, onChange }) => {
  const updateItem = (index: number, item: SectionItem) => {
    const items = [...data.items];
    items[index] = item;
    onChange({ ...data, items });
  };

  const removeItem = (index: number) => {
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const addItem = (type: SectionItem['type']) => {
    onChange({ ...data, items: [...data.items, { type, content: '' }] });
  };

  return (
    <div>
      <div className="block-field">
        <label className="block-label">
          {data.level === 2 ? '二级标题 (##)' : '三级标题 (###)'}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={data.title}
            placeholder={data.level === 2 ? '如：工作经历' : '如：某公司 - 前端工程师'}
            style={{ flex: 1 }}
            onChange={e => onChange({ ...data, title: e.target.value })}
          />
          <Select
            value={data.level}
            style={{ width: 80, flexShrink: 0 }}
            onChange={(val: 2 | 3) => onChange({ ...data, level: val })}
            options={[
              { value: 2, label: 'H2' },
              { value: 3, label: 'H3' },
            ]}
          />
        </div>
      </div>

      <div className="block-field">
        <label className="block-label">副标题（可选）</label>
        <Input
          value={data.subtitle || ''}
          placeholder="如：2020 - 至今"
          onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })}
        />
      </div>

      <div className="block-items">
        <label className="block-label">条目列表</label>
        {data.items.length === 0 && (
          <div style={{
            padding: '20px 0',
            textAlign: 'center',
            color: 'var(--text-tertiary, #9ca3af)',
            fontSize: '13px',
          }}>
            暂无条目，点击下方按钮添加
          </div>
        )}
        {data.items.map((item, i) => (
          <div className="block-item-row" key={i}>
            <Select
              value={item.type}
              style={{ width: 80, flexShrink: 0 }}
              onChange={(val: SectionItem['type']) => updateItem(i, { ...item, type: val })}
              options={[
                { value: 'bullet', label: '列表' },
                { value: 'text', label: '文本' },
              ]}
            />
            <Input
              value={item.content}
              placeholder={item.type === 'bullet' ? '列表项内容' : '文本内容'}
              style={{ flex: 1 }}
              onChange={e => updateItem(i, { ...item, content: e.target.value })}
            />
            <button
              type="button"
              className="block-item-row__remove"
              onClick={() => removeItem(i)}
              aria-label="删除条目"
            >
              <CloseOutlined />
            </button>
          </div>
        ))}
        <div className="block-item-actions">
          <button
            type="button"
            className="block-add-item-btn"
            onClick={() => addItem('bullet')}
          >
            <PlusOutlined /> 添加列表项
          </button>
          <button
            type="button"
            className="block-add-item-btn"
            onClick={() => addItem('text')}
          >
            <PlusOutlined /> 添加文本
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionBlock;
