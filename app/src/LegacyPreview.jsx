import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Tablet from "./legacy/Tablet.jsx";
import css from "./legacy/styles.css?raw";

/** Historical design and data are both frozen at the pre-light-theme revision. */
export default function LegacyPreview({ data, ...props }) {
  const host = useRef(null);
  const [root, setRoot] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(false);
  const id = data.booking.id;
  useLayoutEffect(() => {
    setRoot(host.current.shadowRoot || host.current.attachShadow({ mode: "open" }));
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`${import.meta.env.BASE_URL}legacy-snapshot/${encodeURIComponent(id)}.json?v=a4da329`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Historical snapshot unavailable");
        return response.json();
      })
      .then((historical) => { if (!controller.signal.aborted) setSnapshot({ id, data: historical }); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [id]);
  return <div ref={host} className="legacy-preview">{root && createPortal(<>
    <style>{css}</style>
    {snapshot?.id === id ? <Tablet {...props} data={snapshot.data} />
      : <p role="status" style={{ padding: 24, color: "#F4EFE6" }}>{error ? "초기 시안 데이터를 불러오지 못했습니다. 새로고침해 주세요." : "초기 시안을 불러오고 있습니다."}</p>}
  </>, root)}</div>;
}
