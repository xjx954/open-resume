import React from 'react';
import { Input, Select } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { TwoColumnData, ColumnContent, ContactItem } from '@src/types/resume';

const ICON_OPTIONS = [
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '电话' },
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: '个人网站' },
  { value: 'blog', label: '博客' },
  { value: 'juejin', label: '掘金' },
  { value: 'zhihu', label: '知乎' },
  { value: 'csdn', label: 'CSDN' },
];

interface Props {
  data: TwoColumnData;
  onChange: (data: TwoColumnData) => void;
}

function emptyContact(): ContactItem {
  return { icon: 'email', label: '', link: '' };
}

interface ColumnEditorProps {
  column: ColumnContent;
  title: string;
  onChange: (col: ColumnContent) => void;
}

const ColumnEditor: React.FC<ColumnEditorProps> = ({ column, title, onChange }) => {
  const addContact = () => {
    onChange({ ...column, contacts: [...column.contacts, emptyContact()] });
  };

  const updateContact = (index: number, contact: ContactItem) => {
    const contacts = [...column.contacts];
    contacts[index] = contact;
    onChange({ ...column, contacts });
  };

  const removeContact = (index: number) => {
    onChange({ ...column, contacts: column.contacts.filter((_, i) => i !== index) });
  };

  return (
    <div className="block-column">
      <h4 className="block-column-title">{title}</h4>
      <div className="block-field">
        <label className="block-label">文本内容</label>
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 6 }}
          value={column.text}
          placeholder="一句话描述你的职业优势或核心经验"
          onChange={e => onChange({ ...column, text: e.target.value })}
        />
      </div>
      <div className="block-contacts">
        <label className="block-label">联系方式</label>
        {column.contacts.length === 0 && (
          <div style={{
            padding: '12px 0',
            color: 'var(--text-tertiary, #9ca3af)',
            fontSize: '12px',
          }}>
            暂无联系方式
          </div>
        )}
        {column.contacts.map((c, i) => (
          <div className="block-contact-row" key={i}>
            <div className="block-contact-row__fields">
              <div className="block-contact-row__top">
                <Select
                  value={c.icon}
                  style={{ width: 90, flexShrink: 0 }}
                  size="small"
                  onChange={val => updateContact(i, { ...c, icon: val })}
                  options={ICON_OPTIONS}
                />
                <Input
                  value={c.label}
                  placeholder="显示文本"
                  style={{ flex: 1 }}
                  onChange={e => updateContact(i, { ...c, label: e.target.value })}
                />
                <button
                  type="button"
                  className="block-contact-row__remove"
                  onClick={() => removeContact(i)}
                  aria-label="删除联系方式"
                >
                  <CloseOutlined />
                </button>
              </div>
              <Input
                value={c.link || ''}
                placeholder="链接（可选）"
                className="block-contact-row__link"
                onChange={e => updateContact(i, { ...c, link: e.target.value || undefined })}
              />
            </div>
          </div>
        ))}
        <button type="button" className="block-add-contact" onClick={addContact}>
          <PlusOutlined /> 添加联系方式
        </button>
      </div>
    </div>
  );
};

const TwoColumnBlock: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="block-editor-twocol">
      <ColumnEditor
        column={data.left}
        title="个人总结"
        onChange={left => onChange({ ...data, left })}
      />
      <div className="block-column-divider" />
      <ColumnEditor
        column={data.right}
        title="联系方式"
        onChange={right => onChange({ ...data, right })}
      />
    </div>
  );
};

export default TwoColumnBlock;
