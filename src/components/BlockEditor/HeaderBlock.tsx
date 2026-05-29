import React from 'react';
import { Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { HeaderData } from '@src/types/resume';

interface Props {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

const HeaderBlock: React.FC<Props> = ({ data, onChange }) => {
  const sanitizedData = {
    name: String(data.name || '').replace(/<[^>]*>/g, ''),
    title: String(data.title || '').replace(/<[^>]*>/g, ''),
  };

  return (
    <div>
      <div className="block-field">
        <label className="block-label">姓名</label>
        <Input
          value={sanitizedData.name}
          placeholder="你的姓名"
          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
          style={{ width: '100%' }}
          onChange={e => onChange({ name: e.target.value.replace(/<[^>]*>/g, ''), title: sanitizedData.title })}
        />
      </div>
      <div className="block-field">
        <label className="block-label">求职岗位</label>
        <Input
          value={sanitizedData.title}
          placeholder="如：前端工程师"
          style={{ width: '100%' }}
          onChange={e => onChange({ name: sanitizedData.name, title: e.target.value.replace(/<[^>]*>/g, '') })}
        />
      </div>
    </div>
  );
};

export default HeaderBlock;
