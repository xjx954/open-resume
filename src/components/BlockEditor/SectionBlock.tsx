import React from 'react';
import { Input, Select } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { SectionData, SectionItem } from '@src/types/resume';

interface Props {
  data: SectionData;
  onChange: (data: SectionData) => void;
}

const SectionBlock: React.FC<Props> = ({ data, onChange }) => {
  const isH2 = data.level === 2;

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
          {isH2 ? '模块名称' : '条目标题'}
        </label>
        <Input
          value={data.title}
          placeholder={isH2 ? '如：工作经历、教育背景' : '如：公司名称 - 前端工程师'}
          onChange={e => onChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="block-field-row" style={{ marginBottom: 16 }}>
        <div className="block-column">
          <label className="block-label">类型</label>
          <Select
            value={data.level}
            style={{ width: '100%' }}
            onChange={(val: 2 | 3) => onChange({ ...data, level: val, title: data.title })}
            options={[
              { value: 2, label: '模块 (H2)' },
              { value: 3, label: '条目 (H3)' },
            ]}
          />
        </div>
        <div className="block-column">
          <label className="block-label">副标题（可选）</label>
          <Input
            value={data.subtitle || ''}
            placeholder={isH2 ? '如：2020 - 至今' : '如：2020.07 - 2022.09'}
            onChange={e => onChange({ ...data, subtitle: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="block-items">
        <label className="block-label">条目内容</label>
        {data.items.length === 0 && (
          <div className="block-items-empty">
            暂无条目，点击下方按钮添加
          </div>
        )}
        {data.items.map((item, i) => (
          <div className="block-item-row" key={i}>
            <Select
              value={item.type}
              style={{ width: 70, flexShrink: 0 }}
              size="small"
              onChange={(val: SectionItem['type']) => updateItem(i, { ...item, type: val })}
              options={[
                { value: 'bullet', label: '要点' },
                { value: 'text', label: '段落' },
              ]}
            />
            {item.type === 'text' ? (
              <Input.TextArea
                value={item.content}
                placeholder="段落内容，支持多行文本"
                autoSize={{ minRows: 2, maxRows: 8 }}
                style={{ flex: 1 }}
                onChange={e => updateItem(i, { ...item, content: e.target.value })}
              />
            ) : (
              <Input
                value={item.content}
                placeholder="要点内容"
                style={{ flex: 1 }}
                onChange={e => updateItem(i, { ...item, content: e.target.value })}
              />
            )}
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
            <PlusOutlined /> 添加要点
          </button>
          <button
            type="button"
            className="block-add-item-btn"
            onClick={() => addItem('text')}
          >
            <PlusOutlined /> 添加段落
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionBlock;
