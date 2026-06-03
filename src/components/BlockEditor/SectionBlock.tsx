import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { PlusOutlined, CloseOutlined, DownOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import { SectionData, SectionItem, SectionEntry } from '@src/types/resume';

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function reorderEntries(entries: SectionEntry[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= entries.length ||
    toIndex >= entries.length ||
    fromIndex === toIndex
  ) {
    return [...entries];
  }
  const next = [...entries];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

interface Props {
  data: SectionData;
  onChange: (data: SectionData) => void;
}

// —— Item editor (reused for top-level items and entry items) ——

interface ItemEditorProps {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}

const ItemEditor: React.FC<ItemEditorProps> = ({ items, onChange }) => {
  const updateItem = (index: number, item: SectionItem) => {
    const next = [...items];
    next[index] = item;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = (type: SectionItem['type']) => {
    onChange([...items, { type, content: '' }]);
  };

  return (
    <div className="block-items">
      <label className="block-label">条目内容</label>
      {items.length === 0 && (
        <div className="block-items-empty">暂无条目，点击下方按钮添加</div>
      )}
      {items.map((item, i) => (
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
        <button type="button" className="block-add-item-btn" onClick={() => addItem('bullet')}>
          <PlusOutlined /> 添加要点
        </button>
        <button type="button" className="block-add-item-btn" onClick={() => addItem('text')}>
          <PlusOutlined /> 添加段落
        </button>
      </div>
    </div>
  );
};

// —— Single entry card ——

interface EntryCardProps {
  entry: SectionEntry;
  index: number;
  total: number;
  onChange: (entry: SectionEntry) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="block-entry-card">
      <div className="block-entry-card__header" onClick={() => setCollapsed(!collapsed)}>
        <span className="block-entry-card__chevron">
          {collapsed ? <RightOutlined /> : <DownOutlined />}
        </span>
        <div className="block-entry-card__info">
          <span className="block-entry-card__title">
            {entry.title || '未命名条目'}
          </span>
          {collapsed && entry.subtitle && (
            <span className="block-entry-card__subtitle">{entry.subtitle}</span>
          )}
          {collapsed && (
            <span className="block-entry-card__count">{entry.items.length} 条</span>
          )}
        </div>
        <div className="block-entry-card__sort-actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label="上移条目"
          >
            <UpOutlined />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            aria-label="下移条目"
          >
            <DownOutlined />
          </button>
        </div>
        <button
          type="button"
          className="block-entry-card__remove"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label="删除条目"
        >
          <CloseOutlined />
        </button>
      </div>

      {!collapsed && (
        <div className="block-entry-card__body">
          <div className="block-entry-card__divider" />
          <div className="block-field">
            <label className="block-label">条目标题</label>
            <Input
              value={entry.title}
              placeholder="如：公司名称 - 职位"
              onChange={e => onChange({ ...entry, title: e.target.value })}
            />
          </div>
          <div className="block-field">
            <label className="block-label">副标题（可选）</label>
            <Input
              value={entry.subtitle || ''}
              placeholder="如：2020.07 - 2022.09"
              onChange={e => onChange({ ...entry, subtitle: e.target.value || undefined })}
            />
          </div>
          <ItemEditor
            items={entry.items}
            onChange={items => onChange({ ...entry, items })}
          />
        </div>
      )}
    </div>
  );
};

// —— Section label helper ——
function getEntryAddLabel(title: string): string {
  if (!title) return '添加条目';
  const t = title.replace(/[（(].*$/, '').trim();
  if (t.includes('教育')) return '添加教育经历';
  if (t.includes('工作') || t.includes('实习')) return '添加工作经历';
  if (t.includes('项目')) return '添加项目';
  return `添加${t}`;
}

// —— Main component ——

const SectionBlock: React.FC<Props> = ({ data, onChange }) => {
  const safeData: SectionData = {
    level: 2,
    title: data.title || '',
    subtitle: data.subtitle,
    items: data.items || [],
    entries: data.entries || [],
  };

  const updateEntry = (index: number, entry: SectionEntry) => {
    const entries = [...safeData.entries];
    entries[index] = entry;
    onChange({ ...safeData, entries });
  };

  const removeEntry = (index: number) => {
    onChange({ ...safeData, entries: safeData.entries.filter((_, i) => i !== index) });
  };

  const addEntry = () => {
    onChange({
      ...safeData,
      entries: [...safeData.entries, { id: generateId(), title: '', items: [] }],
    });
  };

  const moveEntry = (fromIndex: number, toIndex: number) => {
    onChange({
      ...safeData,
      entries: reorderEntries(safeData.entries, fromIndex, toIndex),
    });
  };

  return (
    <div>
      <div className="block-field">
        <label className="block-label">模块名称</label>
        <Input
          value={safeData.title}
          placeholder="如：工作经历、教育背景"
          onChange={e => onChange({ ...safeData, title: e.target.value })}
        />
      </div>

      <div className="block-field">
        <label className="block-label">副标题（可选）</label>
        <Input
          value={safeData.subtitle || ''}
          placeholder="如：3 年工作经验"
          onChange={e => onChange({ ...safeData, subtitle: e.target.value || undefined })}
        />
      </div>

      <ItemEditor
        items={safeData.items}
        onChange={items => onChange({ ...safeData, items })}
      />

      {/* Entries section */}
      <div className="block-entries">
        <div className="block-entries__header">
          <label className="block-label">子条目</label>
          {safeData.entries.length > 0 && (
            <span className="block-entries__count">{safeData.entries.length} 个</span>
          )}
        </div>

        {safeData.entries.length === 0 && (
          <div className="block-items-empty">暂无子条目，点击下方按钮添加</div>
        )}

        {safeData.entries.map((entry, i) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            index={i}
            total={safeData.entries.length}
            onChange={e => updateEntry(i, e)}
            onRemove={() => removeEntry(i)}
            onMoveUp={() => moveEntry(i, i - 1)}
            onMoveDown={() => moveEntry(i, i + 1)}
          />
        ))}

        <div className="block-item-actions" style={{ marginTop: 8 }}>
          <button type="button" className="block-add-item-btn" onClick={addEntry}>
            <PlusOutlined /> {getEntryAddLabel(safeData.title)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionBlock;
