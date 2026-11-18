import { useEffect, useState } from 'react';
import { BINDER3_YOUTUBE_PLAYLIST, BINDER3_YOUTUBE_VIDEOS, type Binder3YoutubeVideo } from './binder3YoutubeVideos';
import { Binder3NavLinks } from './binder3Common';

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
    </svg>
  );
}

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

/**
 * 사이드바 YK 변호사 이야기 탭 — 법무법인 YK 변호사 소개 영상 모음.
 * 처음에는 목록만 보인다. 카드를 고르면 업무 사례 팝업과 같은 모양으로 화면 가운데에 띄워 소리를 켠 채 재생한다
 * (고객이 누른 뒤라 소리 재생이 허용된다). 화면 비율과 상관없이 16:9 로 가로·세로 가운데에 맞춘다.
 */
export default function Binder3YoutubeTab({ onPrevious }: { onPrevious?: () => void } = {}) {
  const [current, setCurrent] = useState<Binder3YoutubeVideo | null>(null);
  const params = new URLSearchParams({ autoplay: '1', mute: '0', playsinline: '1', rel: '0', modestbranding: '1' });

  useEffect(() => {
    if (!current) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCurrent(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current]);

  return (
    <section className="b3-youtube" aria-label="YK 변호사 이야기">
      <div className="b3-youtube-scroll">
        <div className="b3-youtube-body">
          <header className="b3-youtube-head">
            <h2>{BINDER3_YOUTUBE_PLAYLIST.title}</h2>
            <p className="b3-youtube-description">
              {BINDER3_YOUTUBE_PLAYLIST.description.map((line, index) => (
                <span key={line}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>
          </header>

          <h3 className="b3-youtube-list-title">
            변호사 소개 영상 <span>{BINDER3_YOUTUBE_VIDEOS.length}편</span>
          </h3>
          <ul className="b3-youtube-list">
            {BINDER3_YOUTUBE_VIDEOS.map((video) => {
              const playing = video.id === current?.id;
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    className={`b3-youtube-card${playing ? ' is-playing' : ''}`}
                    aria-pressed={playing}
                    aria-label={`${video.lawyer} 영상 보기`}
                    onClick={() => setCurrent(video)}
                  >
                    <span className="b3-youtube-thumb">
                      <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" />
                      <span className="b3-youtube-badge">
                        <PlayIcon />
                        보기
                      </span>
                    </span>
                    <span className="b3-youtube-card-lawyer">{video.lawyer}</span>
                    <span className="b3-youtube-card-line">{video.headline}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* 마지막 탭이라 다음은 없다(2차 내부 피드백 6) */}
      <Binder3NavLinks previous={onPrevious ? { label: '전문 인력으로', onClick: onPrevious } : undefined} />

      {current ? (
        <div
          className="b3-youtube-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`${current.lawyer} 영상`}
          onClick={() => setCurrent(null)}
        >
          <button type="button" className="b3-youtube-close" aria-label="영상 닫기" onClick={() => setCurrent(null)}>
            <CloseIcon />
          </button>
          <div className="b3-youtube-stage" onClick={(event) => event.stopPropagation()}>
            <div className="b3-youtube-player">
              <iframe
                key={current.id}
                title={`재생 중: ${current.lawyer}`}
                src={`https://www.youtube-nocookie.com/embed/${current.id}?${params.toString()}`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                // 「YouTube에서 보기」·로고 등으로 새 창이나 최상위 이동을 하면 태블릿 앱이 오류를 낸다(1차 내부 피드백 4).
                // 팝업·최상위 이동을 허용하지 않아 눌러도 앱 안에 머문다. 바인더#3 예시와 같은 값.
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
