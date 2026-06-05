import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { observer } from "mobx-react";
import { useStores } from "@src/store";
import { sanitizeHtml } from '@utils/helper';
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  RESUME_DENSITY_ORDER,
  MeasuredResumeBlock,
  ResumePageHtml,
  ResumeDensityHeights,
  chooseResumeDensity,
  getResumeDensityClass,
  paginateMeasuredBlocks,
} from '@src/service/pdfExportHtml';

interface ViewProps {
  zoom?: number;
}

const View: React.FC<ViewProps> = observer(({ zoom = 100 }) => {
  const { templateStore } = useStores();
  const scale = zoom / 100;
  const isSmartOnePage = templateStore.pdfLayoutMode === 'smart-one-page';
  const selectedDensity = isSmartOnePage ? templateStore.pdfDensity : 'normal';
  const measureRef = useRef<HTMLDivElement>(null);
  const [paperHeight, setPaperHeight] = useState(0);
  const [pages, setPages] = useState<ResumePageHtml[]>([{ html: templateStore.html, height: 0 }]);

  const getElementHeight = useCallback((el: Element) => {
    const rect = el.getBoundingClientRect();
    return rect.height || (el as HTMLElement).scrollHeight;
  }, []);

  const getWrapperAttributes = useCallback((el: Element) => {
    return Array.from(el.attributes)
      .map(attr => `${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`)
      .join(' ');
  }, []);

  const getMeasuredBlock = useCallback(function measureBlock(el: Element): MeasuredResumeBlock {
    const candidates = Array.from(el.children).filter(child => {
      return child.matches(
        'h1, h2, h3, h4, h5, p, ul, ol, li, .block, .h1_block, .h2_block, .h3_block, .entry-header, .lr-container, .resume-layout'
      );
    });
    return {
      html: el.outerHTML,
      height: getElementHeight(el),
      children: candidates.map(child => measureBlock(child)),
      wrapperTag: el.tagName.toLowerCase(),
      wrapperAttributes: getWrapperAttributes(el),
    };
  }, [getElementHeight, getWrapperAttributes]);

  const getTopLevelBlocks = useCallback((content: HTMLElement): MeasuredResumeBlock[] => {
    const candidates = Array.from(content.children).filter(child => {
      return child.classList.contains('block') || child.classList.contains('lr-container') || child.classList.contains('resume-layout');
    });
    const blocks = candidates.length ? candidates : Array.from(content.children);
    return blocks.map(block => getMeasuredBlock(block));
  }, [getMeasuredBlock]);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;

    const updateHeight = () => {
      const content = measure.querySelector('.rs-view') as HTMLElement | null;
      if (!content) return;

      const resetDensityClasses = () => {
        RESUME_DENSITY_ORDER.forEach(density => {
          content.classList.remove(getResumeDensityClass(density));
        });
      };

      if (templateStore.pdfLayoutMode === 'smart-one-page') {
        const heights = RESUME_DENSITY_ORDER.reduce((acc, density) => {
          resetDensityClasses();
          content.classList.add(getResumeDensityClass(density));
          acc[density] = content.scrollHeight;
          return acc;
        }, {} as ResumeDensityHeights);
        const result = chooseResumeDensity(heights);
        resetDensityClasses();
        content.classList.add(getResumeDensityClass(result.density));
        templateStore.setPdfLayoutMetrics(result.contentHeight, result.density, result.canFitOnePage);
        if (result.canFitOnePage) {
          setPages([{ html: content.innerHTML, height: result.contentHeight }]);
          setPaperHeight(A4_HEIGHT_PX * scale);
          return;
        }
        const nextPages = paginateMeasuredBlocks(getTopLevelBlocks(content), A4_HEIGHT_PX);
        setPages(nextPages);
        setPaperHeight(nextPages.length * A4_HEIGHT_PX * scale + Math.max(0, nextPages.length - 1) * 32 * scale);
        return;
      }

      resetDensityClasses();
      content.classList.add(getResumeDensityClass('normal'));
      templateStore.setPdfLayoutMetrics(content.scrollHeight, 'normal', true);
      const nextPages = paginateMeasuredBlocks(getTopLevelBlocks(content), A4_HEIGHT_PX);
      setPages(nextPages);
      setPaperHeight(nextPages.length * A4_HEIGHT_PX * scale + Math.max(0, nextPages.length - 1) * 32 * scale);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [
    scale,
    templateStore,
    templateStore.html,
    templateStore.pdfLayoutMode,
    templateStore.pdfCanFitOnePage,
    templateStore.pdfDensity,
    getTopLevelBlocks,
  ]);

  return (
    <>
      <div className="rs-view-measure" ref={measureRef} aria-hidden="true">
        <div
          className={`rs-view ${getResumeDensityClass(selectedDensity)}`}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(templateStore.html) }}
        />
      </div>
      <div
        className="rs-view-zoom-shell"
        style={{ width: A4_WIDTH_PX * scale, minHeight: paperHeight }}
      >
        <div
          className="resume-pages"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {pages.map((page, index) => (
            <div className="resume-page" key={`${selectedDensity}-${index}`}>
              <div
                className={`rs-view ${getResumeDensityClass(selectedDensity)}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.html) }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
})

export default View;
