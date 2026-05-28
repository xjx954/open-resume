import React, { useLayoutEffect, useRef, useState } from 'react';
import { observer } from "mobx-react";
import { useStores } from "@src/store";
import { sanitizeHtml } from '@utils/helper';

interface ViewProps {
  zoom?: number;
}

const PAPER_WIDTH = 794;

const View: React.FC<ViewProps> = observer(({ zoom = 100 }) => {
  const { templateStore } = useStores();
  const scale = zoom / 100;
  const innerRef = useRef<HTMLDivElement>(null);
  const [paperHeight, setPaperHeight] = useState(0);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const updateHeight = () => {
      setPaperHeight(inner.scrollHeight * scale);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [scale, templateStore.html]);

  return (
    <div
      className="rs-view-zoom-shell"
      style={{ width: PAPER_WIDTH * scale, minHeight: paperHeight }}
    >
      <div
        ref={innerRef}
        className="rs-view-inner"
        style={{
          marginLeft: 0,
          marginRight: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="rs-view" dangerouslySetInnerHTML={{ __html: sanitizeHtml(templateStore.html) }}>
        </div>
      </div>
    </div>
  )
})

export default View;
