import { useState } from 'react';
import { Binder3ArrowIcon } from './binder3Common';

/** 소개 영상: 전체 화면 무음 재생, 반복하지 않는다. 끝나거나 건너뛰면 YK 소개로. */
export default function Binder3Film({ src, onDone }: { src: string; onDone: () => void }) {
  const [failed, setFailed] = useState(false);

  return (
    <section className="b3-film">
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        src={src}
        onEnded={onDone}
        onError={() => setFailed(true)}
      />
      <div className="b3-film-vignette" />
      <button type="button" className={`b3-film-skip${failed ? ' fail' : ''}`} onClick={onDone}>
        <span>{failed ? '영상을 불러오지 못했습니다 · 법무법인 YK 소개로' : '영상 건너뛰기'}</span>
        <Binder3ArrowIcon direction="right" />
      </button>
    </section>
  );
}
