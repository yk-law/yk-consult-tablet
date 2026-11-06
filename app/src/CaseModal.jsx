import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** title에 ` | `가 있으면 앞은 제목, 뒤는 부제. */
function splitTitle(raw) {
  const text = (raw || "").trim();
  if (!text) return { title: "", subtitle: "" };
  const sep = " | ";
  const at = text.indexOf(sep);
  if (at < 0) return { title: text, subtitle: "" };
  return { title: text.slice(0, at).trim(), subtitle: text.slice(at + sep.length).trim() };
}

/**
 * 업무사례를 태블릿 안 모달로만 보여 준다.
 * href·외부 링크 UI는 띄우지 않는다(결정 4).
 * 스크롤 패인에 갇히지 않도록 #tabDev(.viewtab)에 포털한다.
 */
export default function CaseModal({ item, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const [host, setHost] = useState(null);

  const rawTitle = item?.t || item?.title || "";
  const { title, subtitle } = splitTitle(rawTitle);
  const tag = item?.tag || "";
  const summary = item?.s || "";
  const result = item?.r || "";

  useEffect(() => {
    setHost(document.getElementById("tabDev"));
  }, []);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!item) return undefined;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 포털 마운트 직후 닫기 버튼에 포커스
    const focusTimer = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", onKey);
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [item]);

  if (!item || !host) return null;

  return createPortal(
    <div
      className="xmodal case-modal"
      role="presentation"
      onClick={onClose}
    >
      <article
        className="case-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal-head">
          <button
            ref={closeRef}
            type="button"
            className="case-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            닫기
          </button>
        </header>
        <div className="case-modal-body">
          {tag ? <p className="case-modal-tag">{tag}</p> : null}
          <h2 id={titleId} className="case-modal-title">{title || "업무 사례"}</h2>
          {subtitle ? <p className="case-modal-sub">{subtitle}</p> : null}
          {result ? <p className="case-modal-result">{result}</p> : null}
          <p className="case-modal-summary">
            {summary || "자세한 내용은 상담에서 안내해 드립니다."}
          </p>
        </div>
      </article>
    </div>,
    host,
  );
}
