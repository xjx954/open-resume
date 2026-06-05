import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
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
    updateSchema(schema => updateSection(schema, key, section => ({
      ...section,
      items: textToLines(value),
    })));
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

  const handleConfirm = useCallback(() => {
    if (!editableSchema) {
      message.warning('请先粘贴简历内容或上传 .md 文件');
      return;
    }
    onConfirm(normalizeResumeToMarkdown(normalizeUnparsed(editableSchema)));
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
        <h4>{section.title}</h4>
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
            <TextArea
              className="resume-import-field"
              value={linesToText(entry.bullets)}
              placeholder="每行一条描述"
              onChange={event => updateEntry(key, index, item => ({ ...item, bullets: textToLines(event.target.value) }))}
              autoSize={{ minRows: 2, maxRows: 8 }}
            />
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
            accept=".md,.markdown,text/markdown,text/plain"
            showUploadList={false}
            beforeUpload={(file) => {
              const reader = new FileReader();
              reader.onload = event => {
                const text = event.target?.result;
                if (typeof text === 'string') {
                  setSourceText(text);
                  message.success('文件已读取，请确认识别结果');
                }
              };
              reader.onerror = () => message.error('文件读取失败，请确认内容可读取');
              reader.readAsText(file);
              return false;
            }}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">上传 .md 文件</p>
            <p className="ant-upload-hint">支持 Markdown 和纯文本，不处理 DOCX/PDF</p>
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
