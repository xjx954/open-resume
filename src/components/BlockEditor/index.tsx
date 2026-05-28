import React, { useState, useCallback } from 'react';
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
import { Dropdown, Menu } from 'antd';
import {
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  UpOutlined,
  DownOutlined,
  DragOutlined,
  UserOutlined,
  LayoutOutlined,
  UnorderedListOutlined,
  CodeOutlined,
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
import './BlockEditor.less';

// ============================================================
// Block type icon mapping
// ============================================================

const BLOCK_META: Record<ResumeBlock['type'], { icon: React.ReactNode; label: string }> = {
  'header': { icon: <UserOutlined />, label: '基本信息' },
  'two-column': { icon: <LayoutOutlined />, label: '双栏布局' },
  'section': { icon: <UnorderedListOutlined />, label: '章节' },
  'raw-markdown': { icon: <CodeOutlined />, label: '原始 Markdown' },
};

function getItemCount(block: ResumeBlock): number | null {
  if (block.type === 'section') {
    return (block.data as SectionData).items.length;
  }
  if (block.type === 'two-column') {
    const d = block.data as TwoColumnData;
    return d.left.contacts.length + d.right.contacts.length;
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

  const meta = BLOCK_META[block.type];
  const itemCount = getItemCount(block);

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
      className={`block-card ${isDragging ? 'block-card--dragging' : ''}`}
    >
      {/* Title row */}
      <div className="block-card-title" onClick={onToggleCollapse}>
        <span className="block-card-title__grip" {...attributes} {...listeners}>
          <DragOutlined />
        </span>
        <span className="block-card-title__icon">{meta.icon}</span>
        <span className="block-card-title__label">{meta.label}</span>
        {itemCount != null && itemCount > 0 && (
          <span className="block-card-title__count">{itemCount}</span>
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
  const meta = BLOCK_META[block.type];
  return (
    <div className="block-card block-card--overlay" style={{ width: 360 }}>
      <div className="block-card-title">
        <span className="block-card-title__grip" style={{ opacity: 1 }}>
          <DragOutlined />
        </span>
        <span className="block-card-title__icon">{meta.icon}</span>
        <span className="block-card-title__label">{meta.label}</span>
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

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [activeDragBlock, setActiveDragBlock] = useState<ResumeBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds(prev => {
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
  }, [blocks, addBlock]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    reorderBlocks(index, index - 1);
  }, [reorderBlocks]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= blocks.length - 1) return;
    reorderBlocks(index, index + 1);
  }, [blocks.length, reorderBlocks]);

  return (
    <div className="rs-block-editor">
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
              collapsed={collapsedIds.has(block.id)}
              onToggleCollapse={() => toggleCollapse(block.id)}
              onUpdate={updateBlock}
              onRemove={removeBlock}
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
    </div>
  );
});

export default BlockEditor;
