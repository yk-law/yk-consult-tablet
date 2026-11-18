import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { getVisitBinderCaseBody, type VisitBinderCaseBody } from 'lib/api/api-visit-binder';

type LoadState = { caseId: number; body: VisitBinderCaseBody | null; failed: boolean };

/** 사례 본문을 바인더 글꼴·크기로 맞춘다 (yk-consult-tablet binder3-static 디자인, 2026-11-11). */
const CASE_BODY_STYLE = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2/fonts/variable/woff2/SUIT-Variable.css">
<style>
  body { margin: 0; }
  /* 태블릿·맥은 스크롤 막대를 숨겨 두어 더 내려 볼 수 있는지 모른다. 오른쪽에 회색 막대를 늘 보인다. */
  html { scrollbar-width: thin; scrollbar-color: #B8BEC9 #F1F3F7; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #F1F3F7; }
  ::-webkit-scrollbar-thumb { background: #B8BEC9; border-radius: 4px; }
  [data-embedded-case-html-root], [data-embedded-case-html-root] * {
    font-family: "SUIT Variable", system-ui, sans-serif !important;
  }
  [data-embedded-case-html-root] :is(.preview-header, .preview-container) {
    padding-inline: 24px !important;
  }
  [data-embedded-case-html-root] p {
    font-size: 16px !important;
    font-weight: 400 !important;
    line-height: 26px !important;
    margin: 0 0 12px !important;
  }
  [data-embedded-case-html-root] p.preview-lead {
    font-size: 24px !important;
    font-weight: 500 !important;
    line-height: 36px !important;
    margin: 0 !important;
  }
  [data-embedded-case-html-root] h2 {
    font-size: 20px !important;
    font-weight: 600 !important;
    line-height: 32px !important;
    margin-bottom: 12px !important;
  }
  [data-embedded-case-html-root] h3 {
    font-size: 18px !important;
    font-weight: 600 !important;
    line-height: 30px !important;
    margin-bottom: 12px !important;
  }
  [data-embedded-case-html-root] .section + .section {
    margin-top: 32px !important;
  }
</style>`;

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** 업무 사례 본문. 격리된 틀에 띄워 스크립트가 돌지 않고 본문 스타일이 바인더에 번지지 않는다. */
export default function Binder3CaseModal({
  caseId,
  title,
  body,
  onClose,
}: {
  caseId: number;
  title: string;
  /** 미리 받아 둔 본문. 없으면 여기서 받는다 */
  body?: VisitBinderCaseBody;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState<LoadState | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (body) return undefined;
    let alive = true;
    getVisitBinderCaseBody(caseId)
      .then((result) => alive && setLoaded({ caseId, body: result, failed: false }))
      .catch(() => alive && setLoaded({ caseId, body: null, failed: true }));
    return () => {
      alive = false;
    };
  }, [body, caseId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const current = loaded?.caseId === caseId ? loaded : null;
  const shown = body ?? current?.body ?? null;

  const modal = (
    <div className="b3-case-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onClose}>
      <div className="b3-case-modal-panel" onClick={(event) => event.stopPropagation()}>
        <header className="b3-case-modal-bar">
          <h2 className="b3-case-modal-title" id={titleId}>
            {title}
          </h2>
          <button type="button" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        {shown ? (
          <iframe title={title} sandbox="" srcDoc={`<!doctype html><meta charset="utf-8">${CASE_BODY_STYLE}${shown.html}`} />
        ) : (
          <p className="b3-case-modal-message">
            {current?.failed ? '사례를 불러오지 못했습니다' : '사례를 불러오고 있습니다'}
          </p>
        )}
      </div>
    </div>
  );
  // 내용 영역 안에 두면 위쪽 머리글이 모달을 덮는다. 바인더 맨 위에 붙인다.
  const root = document.querySelector('.yk-binder3');
  return root ? createPortal(modal, root) : modal;
}
