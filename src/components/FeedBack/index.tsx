import React from 'react';
import {
  Menu,
  Dropdown,
} from "antd";

const FeedBack = () => {
  const feedbackMenu = (
    <Menu>
      <Menu.Item>
        <div className="rs-feed-group">
          <div className="rs-feed-group__text">
            Issues: <a href="https://github.com/xjx954/open-resume/issues" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={feedbackMenu}>
      <a
        className="ant-dropdown-link rs-link"
        onClick={(e) => e.preventDefault()}
      >
        反馈
      </a>
    </Dropdown>
  )
}

export default FeedBack;
