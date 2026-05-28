import React, { useState } from "react";
import { Modal, message } from "antd";
import svgMap, { SvgType } from "@src/utils/svgMap";
import { copyText, sanitizeHtml } from "@src/utils/helper";
import "./index.less";

interface Props {
  visible?: boolean;
  onClose?: () => void;
}

const Shortcuts: React.FC<Props> = ({ visible: controlledVisible, onClose }) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const isControlled = controlledVisible !== undefined;
  const isModalVisible = isControlled ? controlledVisible : internalVisible;

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalVisible(false);
    }
  };

  const handleOpen = () => {
    if (isControlled) {
      onClose?.(); // no-op for open, parent handles it
    } else {
      setInternalVisible(true);
    }
  };

  const handleCopy = (value: string) => {
    copyText(value, () => {
      message.success("复制成功，快去粘贴吧~");
    });
  };

  return (
    <>
      <Modal
        title="图标快捷写法(点击可快捷复制)"
        visible={isModalVisible}
        width={540}
        onOk={handleClose}
        okText={"我知道了"}
        cancelText={"取消"}
        onCancel={handleClose}
      >
        {(Object.keys(svgMap) as Array<SvgType>).map((item) => {
          return (
            <div
              key={item}
              className="rs-shortcuts-item"
              onClick={() => {
                handleCopy(`icon:${item}`);
              }}
            >
              <p
                className="rs-shortcuts-item__icon"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(svgMap[item]),
                }}
              ></p>
              <p className="rs-shortcuts-item__text"> icon:{item}</p>
            </div>
          );
        })}
      </Modal>
      {!isControlled && (
        <a
          className="ant-dropdown-link rs-link"
          onClick={(e) => {
            e.preventDefault();
            handleOpen();
          }}
        >
          icon快捷键
        </a>
      )}
    </>
  );
};

export default Shortcuts;
