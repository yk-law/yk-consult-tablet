import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const YOUTUBE_VIDEOS = [
    { id: 't8sQ_SUJpFU', headline: '감정을 흔드는 가사사건, 균형 있는 판단으로 답합니다', lawyer: '김윤정 파트너변호사' },
    { id: 'OTCXZQqCUNM', headline: '전쟁 같은 기업분쟁, 최적의 전략으로 답합니다', lawyer: '강진구 변호사' },
    { id: 'DM5CgyjVDFs', headline: '노동법은 누군가를 처벌하기 위한 법이 아닙니다', lawyer: '조인선 변호사' },
    { id: 'IcFO4GfHYsI', headline: '부동산 분쟁은 단순히 자산의 이야기가 아닙니다', lawyer: '이민우 변호사' },
    { id: 'ShbgBc3HX5A', headline: '주·야를 가리지 않는 형사사건, 그래서 저는 먼저 움직입니다', lawyer: '조규원 변호사' },
    { id: '7g5PmEu2R0U', headline: '의뢰인의 두려움, 외면하지 않겠습니다', lawyer: '천기홍 변호사' },
    { id: '07ESKzrFfJU', headline: '형사사건의 골든타임, 놓치지 않습니다', lawyer: '이준혁 변호사' },
    { id: '18J-Ly04YWY', headline: '가장 불안한 순간, 가장 든든한 동반자', lawyer: '홍성준 변호사' },
    { id: '8RRF-Y6yhtI', headline: '이혼 후 어떤 삶을 원하시나요? 그 답이 곧 전략과 방향이 됩니다', lawyer: '조한나 변호사' },
];
const YOUTUBE_PARAMS = new URLSearchParams({ autoplay: '1', mute: '0', playsinline: '1', rel: '0', modestbranding: '1' }).toString();

export default function YoutubeStories() {
  const [video, setVideo] = useState(null);
  const trigger = useRef(null);
  const closeButton = useRef(null);
  const host = document.getElementById("tabDev");

  useEffect(() => {
    if (!video) return;
    const opener = trigger.current;
    closeButton.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setVideo(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, [video]);

  return (
    <section className="youtube-stories" aria-label="YK 변호사 이야기">
      <div className="youtube-scroll">
        <div className="youtube-body">
          <header className="youtube-head">
            <h2>The Lawyer On Your Side</h2>
            <p className="youtube-description">
              YK 변호사들이 사건을 바라보는 관점과 상담에서 중요하게 생각하는 점을 이야기합니다.<br />
              관심 있는 영상을 선택해 편하게 살펴보세요.
            </p>
          </header>
          <ul className="youtube-list">
            {YOUTUBE_VIDEOS.map((item) => (
              <li key={item.id}>
                <button type="button" className="youtube-card" aria-label={`${item.lawyer} 영상 보기`} aria-haspopup="dialog"
                  onClick={(event) => { trigger.current = event.currentTarget; setVideo(item); }}>
                  <span className="youtube-thumb">
                    <img src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" loading="lazy" />
                    <span className="youtube-badge"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></svg>보기</span>
                  </span>
                  <span className="youtube-card-lawyer">{item.lawyer}</span>
                  <span className="youtube-card-line">{item.headline}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {video && host && createPortal(
        <div className="youtube-layer" role="dialog" aria-modal="true" aria-label={`${video.lawyer} 영상`}
          onClick={(event) => { if (event.target === event.currentTarget) setVideo(null); }}>
          <button ref={closeButton} type="button" className="youtube-close" aria-label="영상 닫기" onClick={() => setVideo(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
          <div className="youtube-stage">
            <div className="youtube-player">
              <iframe title={`재생 중: ${video.lawyer}`} src={`https://www.youtube-nocookie.com/embed/${video.id}?${YOUTUBE_PARAMS}`}
                allow="autoplay; encrypted-media; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </div>
        </div>, host)}
    </section>
  );
}
