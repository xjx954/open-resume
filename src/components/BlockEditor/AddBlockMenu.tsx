import React from 'react';
import { Dropdown, Menu } from 'antd';
import { PlusOutlined, UserOutlined, IdcardOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { ResumeBlock, HeaderData, TwoColumnData, SectionData } from '@src/types/resume';
import { useStores } from '@src/store';
import { observer } from 'mobx-react';

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function createBlock(type: ResumeBlock['type']): ResumeBlock {
  const id = generateId();
  switch (type) {
    case 'header':
      return { id, type: 'header', data: { name: '', title: '' } as HeaderData };
    case 'two-column':
      return {
        id, type: 'two-column',
        data: {
          left: { text: '', contacts: [] },
          right: { text: '', contacts: [] },
        } as TwoColumnData,
      };
    case 'section':
      return {
        id, type: 'section',
        data: { level: 2, title: '', items: [] } as SectionData,
      };
    default:
      return { id, type: 'section', data: { level: 2, title: '', items: [] } as SectionData };
  }
}

const AddBlockMenu: React.FC = observer(() => {
  const { templateStore } = useStores();
  const { addBlock, blocks } = templateStore;

  const handleAdd = (type: ResumeBlock['type']) => {
    const block = createBlock(type);
    addBlock(block, blocks.length);
  };

  const menu = (
    <Menu className="block-add-dropdown">
      <Menu.Item key="header" icon={<UserOutlined />} onClick={() => handleAdd('header')}>
        基本信息（姓名 + 岗位）
      </Menu.Item>
      <Menu.Item key="two-column" icon={<IdcardOutlined />} onClick={() => handleAdd('two-column')}>
        联系与简介
      </Menu.Item>
      <Menu.Item key="section" icon={<UnorderedListOutlined />} onClick={() => handleAdd('section')}>
        简历模块（工作经历、技能等）
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="block-add-menu">
      <Dropdown overlay={menu} trigger={['click']} placement="bottomCenter">
        <button type="button" className="block-add-trigger">
          <PlusOutlined />
          添加模块
        </button>
      </Dropdown>
    </div>
  );
});

export default AddBlockMenu;
