import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Upload, message } from 'antd';
import { ClearOutlined, DeleteOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { extractResumeImportText } from '@src/service/import/fileTextExtractor';
import { importMarkdownResume } from '@src/service/import/markdownImporter';
import { normalizeResumeToMarkdown } from '@src/service/import/resumeNormalizer';
import {
  ResumeImportSectionKey,
  ResumeSchema,
  ResumeSchemaEntry,
  ResumeSchemaSection,
} from '@src/service/import/resumeImportTypes';
import './index.less';

const { TextArea } = Input;
const { Dragger } = Upload;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (markdown: string) => void;
}

const SECTION_KEYS: ResumeImportSectionKey[] = [
  'education',
  'work',
  'projects',
  'skills',
  'research',
  'unclassified',
];

function cloneSchema(schema: ResumeSchema): ResumeSchema {
  return JSON.parse(JSON.stringify(schema));
}

function linesToText(lines: string[]): string {
  return lines.join('\n');
}

function textToLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function updateSection(
  schema: ResumeSchema,
  key: ResumeImportSectionKey,
  updater: (section: ResumeSchemaSection) => ResumeSchemaSection,
): ResumeSchema {
  return {
    ...schema,
    sections: {
      ...schema.sections,
      [key]: updater(schema.sections[key]),
    },
  };
}

function normalizeUnparsed(schema: ResumeSchema): ResumeSchema {
  const unclassified = schema.sections.unclassified;
  const unparsedBlocks = unclassified.items.filter(item => item.trim());
  return {
    ...schema,
    unparsedBlocks,
    sections: {
      ...schema.sections,
      unclassified: {
        ...unclassified,
        items: unparsedBlocks,
      },
    },
  };
}

function normalizeEditableSchema(schema: ResumeSchema): ResumeSchema {
  const normalizedSections = SECTION_KEYS.reduce((sections, key) => {
    const section = schema.sections[key];
    return {
      ...sections,
      [key]: {
        ...section,
        items: section.items.filter(item => item.trim()),
        entries: section.entries
          .map(entry => ({
            ...entry,
            name: entry.name.trim(),
            role: entry.role.trim(),
            date: entry.date.trim(),
            bullets: entry.bullets.map(bullet => bullet.trim()).filter(Boolean),
          }))
          .filter(entry => entry.name || entry.role || entry.date || entry.bullets.length > 0),
      },
    };
  }, {} as ResumeSchema['sections']);

  return normalizeUnparsed({
    ...schema,
    basicInfo: {
      name: schema.basicInfo.name.trim(),
      title: schema.basicInfo.title.trim(),
      summary: schema.basicInfo.summary.map(item => item.trim()).filter(Boolean),
    },
    contacts: schema.contacts.map(contact => contact.trim()).filter(Boolean),
    sections: normalizedSections,
  });
}

const ResumeImportModal: React.FC<Props> = ({ visible, onCancel, onConfirm }) => {
  const [sourceText, setSourceText] = useState('');
  const [editableSchema, setEditableSchema] = useState<ResumeSchema | null>(null);

  const importResult = useMemo(() => {
    if (!sourceText.trim()) return null;
    return importMarkdownResume(sourceText);
  }, [sourceText]);

  useEffect(() => {
    setEditableSchema(importResult ? cloneSchema(importResult.schema) : null);
  }, [importResult]);

  const updateSchema = useCallback((updater: (schema: ResumeSchema) => ResumeSchema) => {
    setEditableSchema(current => (current ? updater(current) : current));
  }, []);

  const updateBasicInfo = useCallback((field: keyof ResumeSchema['basicInfo'], value: string | string[]) => {
    updateSchema(schema => ({
      ...schema,
      basicInfo: {
        ...schema.basicInfo,
        [field]: value,
      },
    }));
  }, [updateSchema]);

  const updateSectionItems = useCallback((key: ResumeImportSectionKey, value: string) => {
    updateSchema(schema => {
      const items = textToLines(value);
      const nextSchema = updateSection(schema, key, section => ({
        ...section,
        items,
      }));
      if (key !== 'unclassified') return nextSchema;
      return {
        ...nextSchema,
        unparsedBlocks: items,
      };
    });
  }, [updateSchema]);

  const updateEntry = useCallback((
    key: ResumeImportSectionKey,
    entryIndex: number,
    updater: (entry: ResumeSchemaEntry) => ResumeSchemaEntry,
  ) => {
    updateSchema(schema => updateSection(schema, key, section => ({
      ...section,
      entries: section.entries.map((entry, index) => (index === entryIndex ? updater(entry) : entry)),
    })));
  }, [updateSchema]);

  const clearSection = useCallback((key: ResumeImportSectionKey) => {
    updateSchema(schema => {
      const nextSchema = updateSection(schema, key, section => ({
        ...section,
        items: [],
        entries: [],
      }));
      if (key !== 'unclassified') return nextSchema;
      return {
        ...nextSchema,
        unparsedBlocks: [],
      };
    });
  }, [updateSchema]);

  const deleteEntry = useCallback((key: ResumeImportSectionKey, entryIndex: number) => {
    updateSchema(schema => updateSection(schema, key, section => ({
      ...section,
      entries: section.entries.filter((_, index) => index !== entryIndex),
    })));
  }, [updateSchema]);

  const addEntryBullet = useCallback((key: ResumeImportSectionKey, entryIndex: number) => {
    updateEntry(key, entryIndex, entry => ({
      ...entry,
      bullets: [...entry.bullets, ''],
    }));
  }, [updateEntry]);

  const updateEntryBullet = useCallback((
    key: ResumeImportSectionKey,
    entryIndex: number,
    bulletIndex: number,
    value: string,
  ) => {
    updateEntry(key, entryIndex, entry => ({
      ...entry,
      bullets: entry.bullets.map((bullet, index) => (index === bulletIndex ? value : bullet)),
    }));
  }, [updateEntry]);

  const deleteEntryBullet = useCallback((
    key: ResumeImportSectionKey,
    entryIndex: number,
    bulletIndex: number,
  ) => {
    updateEntry(key, entryIndex, entry => ({
      ...entry,
      bullets: entry.bullets.filter((_, index) => index !== bulletIndex),
    }));
  }, [updateEntry]);

  const handleConfirm = useCallback(() => {
    if (!editableSchema) {
      message.warning('请先粘贴简历内容或上传 .md 文件');
      return;
    }
    onConfirm(normalizeResumeToMarkdown(normalizeEditableSchema(editableSchema)));
    setSourceText('');
    setEditableSchema(null);
  }, [editableSchema, onConfirm]);

  const handleCancel = useCallback(() => {
    setSourceText('');
    setEditableSchema(null);
    onCancel();
  }, [onCancel]);

  const renderSectionEditor = (key: ResumeImportSectionKey) => {
    if (!editableSchema) return null;
    const section = editableSchema.sections[key];
    const hasContent = section.items.length > 0 || section.entries.length > 0;

    if (key === 'unclassified' && editableSchema.unparsedBlocks.length === 0 && section.items.length === 0) {
      return null;
    }

    return (
      <section className="resume-import-section" key={key}>
        <div className="resume-import-section__header">
          <h4>{section.title}</h4>
          {hasContent && (
            <Button
              size="small"
              type="link"
              danger
              icon={key === 'unclassified' ? <ClearOutlined /> : <DeleteOutlined />}
              onClick={() => clearSection(key)}
            >
              {key === 'unclassified' ? '清空未归类' : '删除本段'}
            </Button>
          )}
        </div>
        {!hasContent && <p className="resume-import-empty">未识别到内容</p>}

        {section.items.length > 0 && (
          <TextArea
            className="resume-import-field"
            value={linesToText(section.items)}
            onChange={event => updateSectionItems(key, event.target.value)}
            autoSize={{ minRows: 2, maxRows: 8 }}
          />
        )}

        {section.entries.map((entry, index) => (
          <div className="resume-import-entry" key={`${key}-${index}`}>
            <div className="resume-import-entry__toolbar">
              <Button
                size="small"
                type="link"
                icon={<PlusOutlined />}
                onClick={() => addEntryBullet(key, index)}
              >
                新增描述
              </Button>
              <Button
                size="small"
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteEntry(key, index)}
              >
                删除条目
              </Button>
            </div>
            <div className="resume-import-entry__grid">
              <Input
                value={entry.name}
                placeholder="名称"
                onChange={event => updateEntry(key, index, item => ({ ...item, name: event.target.value }))}
              />
              <Input
                value={entry.role}
                placeholder="角色/职位/学历"
                onChange={event => updateEntry(key, index, item => ({ ...item, role: event.target.value }))}
              />
              <Input
                value={entry.date}
                placeholder="日期"
                onChange={event => updateEntry(key, index, item => ({ ...item, date: event.target.value }))}
              />
            </div>
            <div className="resume-import-bullets">
              {entry.bullets.length === 0 && (
                <p className="resume-import-empty">暂无描述</p>
              )}
              {entry.bullets.map((bullet, bulletIndex) => (
                <div className="resume-import-bullet" key={`${key}-${index}-bullet-${bulletIndex}`}>
                  <Input
                    value={bullet}
                    placeholder="描述内容"
                    onChange={event => updateEntryBullet(key, index, bulletIndex, event.target.value)}
                  />
                  <Button
                    size="small"
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteEntryBullet(key, index, bulletIndex)}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  };

  return (
    <Modal
      title="导入旧简历"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText="确认导入"
      cancelText="取消"
      width={1040}
      destroyOnClose
      className="resume-import-modal"
    >
      <div className="resume-import-layout">
        <div className="resume-import-source">
          <Dragger
            accept=".md,.markdown,.txt,.docx,.pdf,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            showUploadList={false}
            beforeUpload={async (file) => {
              const hide = message.loading('正在读取文件内容...', 0);
              try {
                const text = await extractResumeImportText(file);
                if (!text.trim()) {
                  message.warning('没有读取到可导入的文本内容');
                } else {
                  setSourceText(text);
                  message.success('文件已读取，请确认识别结果');
                }
              } catch (error) {
                const detail = error instanceof Error ? error.message : '文件读取失败';
                message.error(detail);
              } finally {
                hide();
              }
              return false;
            }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">上传 .md / .docx / .pdf 文件</p>
            <p className="ant-upload-hint">DOCX/PDF 仅提取文本，不保留原排版，不做 OCR</p>
          </Dragger>

          <TextArea
            value={sourceText}
            onChange={event => setSourceText(event.target.value)}
            placeholder="也可以直接粘贴 Markdown / 纯文本简历"
            autoSize={{ minRows: 14, maxRows: 18 }}
          />
          <Button size="small" onClick={() => setSourceText('')} disabled={!sourceText}>
            清空
          </Button>
        </div>

        <div className="resume-import-preview">
          {!editableSchema ? (
            <Empty description="等待导入内容" />
          ) : (
            <>
              <section className="resume-import-section">
                <h4>基本信息</h4>
                <div className="resume-import-basic">
                  <Input
                    value={editableSchema.basicInfo.name}
                    placeholder="姓名"
                    onChange={event => updateBasicInfo('name', event.target.value)}
                  />
                  <Input
                    value={editableSchema.basicInfo.title}
                    placeholder="标题/求职方向"
                    onChange={event => updateBasicInfo('title', event.target.value)}
                  />
                  <TextArea
                    value={linesToText(editableSchema.basicInfo.summary)}
                    placeholder="补充简介，每行一条"
                    onChange={event => updateBasicInfo('summary', textToLines(event.target.value))}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </div>
              </section>

              <section className="resume-import-section">
                <h4>联系方式</h4>
                <TextArea
                  value={linesToText(editableSchema.contacts)}
                  placeholder="每行一个联系方式"
                  onChange={event => updateSchema(schema => ({ ...schema, contacts: textToLines(event.target.value) }))}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                />
              </section>

              {SECTION_KEYS.map(renderSectionEditor)}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ResumeImportModal;
