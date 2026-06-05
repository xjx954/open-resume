import React, { useCallback, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { importMarkdownResume } from '@src/service/import/markdownImporter';
import { ParsedResume, ParsedResumeEntry, ResumeImportSectionKey } from '@src/service/import/resumeImportTypes';
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

function renderEntry(entry: ParsedResumeEntry) {
  return (
    <div className="resume-import-entry" key={`${entry.name}-${entry.role}-${entry.date}`}>
      <div className="resume-import-entry__title">
        <span>{entry.name || '未识别名称'}</span>
        {(entry.role || entry.date) && (
          <em>{[entry.role, entry.date].filter(Boolean).join(' | ')}</em>
        )}
      </div>
      {entry.bullets.length > 0 && (
        <ul>
          {entry.bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderSection(parsed: ParsedResume, key: ResumeImportSectionKey) {
  const section = parsed.sections[key];
  const hasContent = section.items.length > 0 || section.entries.length > 0;

  return (
    <section className="resume-import-section" key={key}>
      <h4>{section.title}</h4>
      {!hasContent && <p className="resume-import-empty">未识别到内容</p>}
      {section.items.length > 0 && (
        <ul>
          {section.items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
      {section.entries.map(renderEntry)}
    </section>
  );
}

const ResumeImportModal: React.FC<Props> = ({ visible, onCancel, onConfirm }) => {
  const [sourceText, setSourceText] = useState('');

  const importResult = useMemo(() => {
    if (!sourceText.trim()) return null;
    return importMarkdownResume(sourceText);
  }, [sourceText]);

  const handleConfirm = useCallback(() => {
    if (!importResult) {
      message.warning('请先粘贴简历内容或上传 .md 文件');
      return;
    }
    onConfirm(importResult.markdown);
    setSourceText('');
  }, [importResult, onConfirm]);

  const handleCancel = useCallback(() => {
    setSourceText('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      title="导入旧简历"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText="确认导入"
      cancelText="取消"
      width={980}
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
            <p className="ant-upload-hint">第一阶段支持 Markdown 和纯文本，不处理 DOCX/PDF</p>
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
          {!importResult ? (
            <Empty description="等待导入内容" />
          ) : (
            <>
              <section className="resume-import-section">
                <h4>基本信息</h4>
                <div className="resume-import-basic">
                  <strong>{importResult.parsed.basicInfo.name}</strong>
                  {importResult.parsed.basicInfo.title && <span>{importResult.parsed.basicInfo.title}</span>}
                  {importResult.parsed.basicInfo.summary.map((item, index) => (
                    <p key={`${item}-${index}`}>{item}</p>
                  ))}
                </div>
              </section>

              <section className="resume-import-section">
                <h4>联系方式</h4>
                {importResult.parsed.contacts.length === 0 ? (
                  <p className="resume-import-empty">未识别到内容</p>
                ) : (
                  <ul>
                    {importResult.parsed.contacts.map((contact, index) => (
                      <li key={`${contact}-${index}`}>{contact}</li>
                    ))}
                  </ul>
                )}
              </section>

              {SECTION_KEYS.map(key => renderSection(importResult.parsed, key))}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ResumeImportModal;
