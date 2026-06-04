import React, { useState, useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useStores } from '@src/store';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dropdown, Menu, message } from 'antd';
import {
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  UpOutlined,
  DownOutlined,
  DragOutlined,
  UserOutlined,
  IdcardOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  ResumeBlock,
  HeaderData,
  TwoColumnData,
  SectionData,
  RawMarkdownData,
} from '@src/types/resume';
import HeaderBlock from './HeaderBlock';
import TwoColumnBlock from './TwoColumnBlock';
import SectionBlock from './SectionBlock';
import RawMarkdownBlock from './RawMarkdownBlock';
import AddBlockMenu from './AddBlockMenu';
import InlineAiRewrite from './InlineAiRewrite';
import './BlockEditor.less';

// ============================================================
// Block type icon mapping
// ============================================================

const BLOCK_ICON: Record<ResumeBlock['type'], React.ReactNode> = {
  'header': <UserOutlined />,
  'two-column': <IdcardOutlined />,
  'section': <UnorderedListOutlined />,
  'raw-markdown': <CodeOutlined />,
};

const BLOCK_LABEL: Record<ResumeBlock['type'], string> = {
  'header': '基本信息',
  'two-column': '联系方式与简介',
  'section': '简历模块',
  'raw-markdown': '高级内容',
};

function getBlockMeta(block: ResumeBlock): { icon: React.ReactNode; label: string } {
  const icon = BLOCK_ICON[block.type];
  if (block.type === 'section') {
    const d = block.data as SectionData;
    const label = d.title || '自定义模块';
    return { icon, label };
  }
  return { icon, label: BLOCK_LABEL[block.type] };
}

function getBlockSummary(block: ResumeBlock): string | null {
  if (block.type === 'header') {
    const d = block.data as HeaderData;
    if (d.title) return d.title;
    if (d.name) return d.name;
    return null;
  }
  if (block.type === 'section') {
    const d = block.data as SectionData;
    const entryCount = (d.entries || []).length;
    const itemCount = d.items.length;
    if (entryCount === 0 && itemCount === 0) return '无条目';
    const parts: string[] = [];
    if (d.subtitle) parts.push(d.subtitle);
    if (entryCount > 0) parts.push(`${entryCount} 个子条目`);
    if (itemCount > 0) parts.push(`${itemCount} 条`);
    return parts.join(' · ');
  }
  if (block.type === 'two-column') {
    const d = block.data as TwoColumnData;
    const n = d.left.contacts.length + d.right.contacts.length;
    const parts: string[] = [];
    if (d.left.text) parts.push(d.left.text.slice(0, 30) + (d.left.text.length > 30 ? '…' : ''));
    if (n > 0) parts.push(`${n} 个联系方式`);
    return parts.join(' · ') || null;
  }
  if (block.type === 'raw-markdown') {
    const d = block.data as RawMarkdownData;
    const preview = d.markdown.replace(/\n/g, ' ').slice(0, 40);
    return preview || null;
  }
  return null;
}

function getItemCountBadge(block: ResumeBlock): string | null {
  if (block.type === 'section') {
    const d = block.data as SectionData;
    const n = (d.entries || []).length;
    if (n > 0) return `${n} 个`;
    const m = d.items.length;
    if (m > 0) return `${m} 条`;
    return null;
  }
  if (block.type === 'two-column') {
    const d = block.data as TwoColumnData;
    const n = d.left.contacts.length + d.right.contacts.length;
    if (n > 0) return `${n}`;
    return null;
  }
  return null;
}

// ============================================================
// Sortable wrapper for individual blocks
// ============================================================

interface SortableBlockProps {
  block: ResumeBlock;
  index: number;
  total: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (id: string, data: ResumeBlock['data']) => void;
  onRemove: (id: string) => void;
  onDuplicate: (block: ResumeBlock) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

const SortableBlock: React.FC<SortableBlockProps> = ({
  block,
  index,
  total,
  collapsed,
  onToggleCollapse,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const meta = getBlockMeta(block);
  const summary = getBlockSummary(block);
  const badge = getItemCountBadge(block);

  const contextMenu = (
    <Menu className="block-context-menu">
      <Menu.Item
        key="move-up"
        icon={<UpOutlined />}
        disabled={index === 0}
        onClick={() => onMoveUp(index)}
      >
        上移
      </Menu.Item>
      <Menu.Item
        key="move-down"
        icon={<DownOutlined />}
        disabled={index === total - 1}
        onClick={() => onMoveDown(index)}
      >
        下移
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="duplicate"
        icon={<CopyOutlined />}
        onClick={() => onDuplicate(block)}
      >
        复制
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => onRemove(block.id)}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block-card ${isDragging ? 'block-card--dragging' : ''} ${collapsed ? 'block-card--collapsed' : 'block-card--expanded'}`}
    >
      {/* Title row */}
      <div className="block-card-title" onClick={onToggleCollapse}>
        <span className="block-card-title__grip" {...attributes} {...listeners}>
          <DragOutlined />
        </span>
        <span className="block-card-title__icon">{meta.icon}</span>
        <div className="block-card-title__text">
          <span className="block-card-title__label">{meta.label}</span>
          {summary && collapsed && (
            <span className="block-card-title__summary">{summary}</span>
          )}
        </div>
        {badge != null && (
          <span className="block-card-title__badge">{badge}</span>
        )}
        <span className={`block-card-title__chevron ${collapsed ? 'block-card-title__chevron--collapsed' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
        <span className="block-card-title__actions" onClick={e => e.stopPropagation()}>
          <Dropdown overlay={contextMenu} trigger={['click']} placement="bottomRight">
            <button
              className="block-card-title__menu-btn"
              aria-label="更多操作"
              type="button"
            >
              <MoreOutlined />
            </button>
          </Dropdown>
        </span>
      </div>

      {/* Divider */}
      {!collapsed && <div className="block-card-body__divider" />}

      {/* Collapsible body */}
      <div className={`block-card-body ${collapsed ? 'block-card-body--collapsed' : ''}`}>
        {block.type === 'header' && (
          <HeaderBlock
            data={block.data as HeaderData}
            onChange={data => onUpdate(block.id, data)}
          />
        )}
        {block.type === 'two-column' && (
          <TwoColumnBlock
            data={block.data as TwoColumnData}
            onChange={data => onUpdate(block.id, data)}
          />
        )}
        {block.type === 'section' && (
          <SectionBlock
            data={block.data as SectionData}
            onChange={data => onUpdate(block.id, data)}
          />
        )}
        {block.type === 'raw-markdown' && (
          <RawMarkdownBlock
            data={block.data as RawMarkdownData}
            onChange={data => onUpdate(block.id, data)}
          />
        )}
      </div>
    </div>
  );
};

// ============================================================
// Drag overlay — floating card shown during drag
// ============================================================

const DragOverlayCard: React.FC<{ block: ResumeBlock }> = ({ block }) => {
  const meta = getBlockMeta(block);
  return (
    <div className="block-card block-card--overlay" style={{ width: 360 }}>
      <div className="block-card-title">
        <span className="block-card-title__grip" style={{ opacity: 1 }}>
          <DragOutlined />
        </span>
        <span className="block-card-title__icon">{meta.icon}</span>
        <span className="block-card-title__label">{meta.label}</span>
        <span className={`block-card-title__chevron`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    </div>
  );
};

// ============================================================
// Container
// ============================================================

const BlockEditor: React.FC = observer(() => {
  const { templateStore } = useStores();
  const { blocks, removeBlock, updateBlock, reorderBlocks, addBlock } = templateStore;
  const blockIds = blocks.map(b => b.id);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const header = blocks.find(b => b.type === 'header');
    return new Set(header ? [header.id] : []);
  });
  const [activeBlockId, setActiveBlockId] = useState<string | null>(() => {
    const header = blocks.find(b => b.type === 'header');
    return header ? header.id : null;
  });
  const userToggledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const validIds = new Set(blocks.map(b => b.id));
    setExpandedIds(prev => {
      const next = new Set(Array.from(prev).filter(id => validIds.has(id)));
      if (next.size === 0) {
        const header = blocks.find(b => b.type === 'header');
        if (header) next.add(header.id);
      }
      return next;
    });
    setActiveBlockId(prev => {
      if (prev && validIds.has(prev)) return prev;
      const header = blocks.find(b => b.type === 'header');
      return header ? header.id : null;
    });
  }, [blocks]);

  const [activeDragBlock, setActiveDragBlock] = useState<ResumeBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const toggleCollapse = useCallback((id: string) => {
    userToggledRef.current.add(id);
    setActiveBlockId(id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = blocks.find(b => b.id === event.active.id);
    if (block) setActiveDragBlock(block);
  }, [blocks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragBlock(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = blocks.findIndex(b => b.id === active.id);
    const toIndex = blocks.findIndex(b => b.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderBlocks(fromIndex, toIndex);
    }
  }, [blocks, reorderBlocks]);

  const handleDuplicate = useCallback((block: ResumeBlock) => {
    const newBlock: ResumeBlock = {
      ...block,
      id: generateId(),
      data: JSON.parse(JSON.stringify(block.data)),
    };
    const idx = blocks.findIndex(b => b.id === block.id);
    addBlock(newBlock, idx + 1);
    setExpandedIds(prev => new Set([...Array.from(prev), newBlock.id]));
    setActiveBlockId(newBlock.id);
  }, [blocks, addBlock]);

  const handleRemove = useCallback((id: string) => {
    removeBlock(id);
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setActiveBlockId(prev => (prev === id ? null : prev));
  }, [removeBlock]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    reorderBlocks(index, index - 1);
  }, [reorderBlocks]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= blocks.length - 1) return;
    reorderBlocks(index, index + 1);
  }, [blocks.length, reorderBlocks]);

  const getShortcutTarget = useCallback(() => {
    const fallbackId = Array.from(expandedIds).reverse().find(id => blocks.some(b => b.id === id));
    const targetId = activeBlockId && blocks.some(b => b.id === activeBlockId) ? activeBlockId : fallbackId;
    return blocks.find(b => b.id === targetId) || null;
  }, [activeBlockId, blocks, expandedIds]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTextInput = !!tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if ((isTextInput || target?.isContentEditable) && !(mod && ['z', 'y', 's', 'p'].includes(key))) return;

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        templateStore.undo();
        return;
      }
      if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        templateStore.redo();
        return;
      }
      if (mod && key === 's') {
        e.preventDefault();
        message.success('已保存');
        return;
      }
      if (mod && key === 'p') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-resume:export-pdf'));
        return;
      }
      if (mod && key === 'd') {
        const targetBlock = getShortcutTarget();
        if (targetBlock) {
          e.preventDefault();
          handleDuplicate(targetBlock);
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const targetBlock = getShortcutTarget();
        if (targetBlock) {
          e.preventDefault();
          handleRemove(targetBlock.id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [getShortcutTarget, handleDuplicate, handleRemove, templateStore]);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(blocks.map(b => b.id)));
  }, [blocks]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <div className="rs-block-editor">
      <div className="block-ai-helper">
        <RobotOutlined />
        <span>AI 润色选中文本</span>
        <em>先选中任意输入框里的文字，按钮会在文字附近出现。</em>
      </div>
      <div className="block-editor-actions">
        <button type="button" className="block-editor-actions__btn" onClick={expandAll}>
          全部展开
        </button>
        <button type="button" className="block-editor-actions__btn" onClick={collapseAll}>
          全部折叠
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <SortableBlock
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              collapsed={!expandedIds.has(block.id)}
              onToggleCollapse={() => toggleCollapse(block.id)}
              onUpdate={updateBlock}
              onRemove={handleRemove}
              onDuplicate={handleDuplicate}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeDragBlock ? <DragOverlayCard block={activeDragBlock} /> : null}
        </DragOverlay>
      </DndContext>

      <AddBlockMenu />
      <InlineAiRewrite />
    </div>
  );
});

export default BlockEditor;
