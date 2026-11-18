import { useEffect, useRef } from 'react';

export const BINDER3_ASSET_BASE = '/assets/visit-binder3';

/** 공식 국문 CI (원본 색·비율 유지) */
export function Binder3Logo({ className }: { className: string }) {
  return (
    <span className={className} role="img" aria-label="법무법인 YK">
      <img src={`${BINDER3_ASSET_BASE}/yk-ci-korean-primary.svg`} alt="" aria-hidden="true" />
    </span>
  );
}

/** 내방·상담 준비 공통: CI + 감사 문구 */
export function Binder3WelcomeBrand() {
  return (
    <div className="b3-welcome-brand">
      <Binder3Logo className="b3-ci b3-welcome-ci" />
      <p className="b3-sub">법무법인 YK를 찾아주셔서 감사합니다.</p>
    </div>
  );
}

/** 내방·상담 준비 배경 영상. 프로필 히어로 뒤에도 쓴다. 동작 줄이기 설정이면 멈춘다. */
export function Binder3WelcomeBackdrop({ className = 'b3-backdrop' }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    // 오래된 웹뷰·테스트 환경에는 matchMedia 가 없을 수 있다. 그때는 그냥 재생한다.
    const motion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const sync = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = true;
      if (motion?.matches) video.pause();
      else video.play()?.catch(() => {});
    };
    sync();
    motion?.addEventListener('change', sync);
    return () => motion?.removeEventListener('change', sync);
  }, []);
  return (
    <div className={className} aria-hidden="true">
      <video
        ref={videoRef}
        src={`${BINDER3_ASSET_BASE}/welcome-abstract-loop.mp4`}
        poster={`${BINDER3_ASSET_BASE}/welcome-abstract-poster.png`}
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      />
    </div>
  );
}

/** Lucide arrow-left / arrow-right (20px, stroke 1.5) */
export function Binder3ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      className="b3-icon"
      xmlns="http://www.w3.org/2000/svg"
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
      {direction === 'left' ? (
        <>
          <path d="m12 19-7-7 7-7" />
          <path d="M5 12h14" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </>
      )}
    </svg>
  );
}

/**
 * 사진이 없는 구성원 자리. 옅은 남색 바탕에 YK 마크(images/YK-Symbol-White.svg 와 같은 모양)를 흐리게 둔다.
 * 이름 첫 글자는 사진 사이에서 빈칸처럼 보여 바꿨다(2차 내부 피드백 5).
 */
export function Binder3NoPhoto() {
  return (
    <span className="b3-no-photo" aria-hidden="true">
      <svg viewBox="0 0 47 32" fill="currentColor" focusable="false">
        <path d="M31.9077 25.2921L36.3365 32H46.7823L37.1288 17.3813L31.9077 25.2921Z" />
        <path d="M11.3045 32H0.858643L18.7703 4.87415H29.2162L11.3045 32Z" />
        <path d="M10.4459 0H0L9.65351 14.6187L14.8764 6.70974L10.4459 0Z" />
        <path d="M28.0119 27.1259H17.5679L35.4777 0H45.9236L28.0119 27.1259Z" />
      </svg>
    </span>
  );
}

type Binder3NavTarget = { label: string; onClick: () => void };

/**
 * 탭 하단 이전·다음 버튼 줄. 본문 영역 바닥의 같은 자리에 뜬다(.b3-counsel-links 규칙, 1차 내부 피드백 1).
 * 상담 변호사 등은 직접 그리고, 전문 인력·YK 변호사 이야기가 이걸 쓴다(2차 내부 피드백 6).
 */
export function Binder3NavLinks({ previous, next }: { previous?: Binder3NavTarget; next?: Binder3NavTarget }) {
  if (!previous && !next) return null;
  return (
    <div className="b3-counsel-links">
      {previous ? (
        <button type="button" className="b3-counsel-previous" onClick={previous.onClick}>
          <Binder3ArrowIcon direction="left" />
          <span>{previous.label}</span>
        </button>
      ) : null}
      {next ? (
        <button type="button" className="b3-counsel-next" onClick={next.onClick}>
          <span>{next.label}</span>
          <Binder3ArrowIcon direction="right" />
        </button>
      ) : null}
    </div>
  );
}
