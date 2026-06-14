import React from 'react';
import { Dropdown, Menu } from 'antd';
import { PlusOutlined, UserOutlined, IdcardOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { ResumeBlock } from '@src/types/resume';
import { useStores } from '@src/store';
import { observer } from 'mobx-react';
import { generateId } from '@src/utils/id';

function createBlock(type: ResumeBlock['type']): ResumeBlock {
  const id = generateId();
  switch (type) {
    case 'header':
      return { id, type: 'header', data: { name: '', title: '' } };
    case 'two-column':
      return {
        id, type: 'two-column',
        data: {
          left: { text: '', contacts: [] },
          right: { text: '', contacts: [] },
        },
      };
    case 'section':
      return {
        id, type: 'section',
        data: { level: 2, title: '', items: [], entries: [] },
      };
    default:
      return { id, type: 'section', data: { level: 2, title: '', items: [], entries: [] } };
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
        基本信息
      </Menu.Item>
      <Menu.Item key="two-column" icon={<IdcardOutlined />} onClick={() => handleAdd('two-column')}>
        联系方式与简介
      </Menu.Item>
      <Menu.Item key="section" icon={<UnorderedListOutlined />} onClick={() => handleAdd('section')}>
        内容模块（工作经历、教育背景等）
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
