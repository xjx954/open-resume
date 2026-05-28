import React from 'react';
import { Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { HeaderData } from '@src/types/resume';

interface Props {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

const HeaderBlock: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div>
      <div className="block-field">
        <label className="block-label">姓名</label>
        <Input
          value={data.name}
          placeholder="你的姓名"
          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
          onChange={e => onChange({ ...data, name: e.target.value })}
        />
      </div>
      <div className="block-field">
        <label className="block-label">求职岗位</label>
        <Input
          value={data.title}
          placeholder="如：前端工程师"
          onChange={e => onChange({ ...data, title: e.target.value })}
        />
      </div>
    </div>
  );
};

export default HeaderBlock;
