import { useEffect } from 'react';
import { Binder3WelcomeBrand } from './binder3Common';

/** 상담 준비 화면을 보여 준 뒤 소개 영상으로 넘어가기까지 (프로토타입 PREP_MS) */
export const BINDER3_PREP_MS = 2200;

/** 상담 준비: 잠시 로딩을 보여 준 뒤 소개 영상으로 넘긴다. */
export default function Binder3Prep({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, BINDER3_PREP_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <section className="b3-confirm b3-prep">
      <div className="b3-confirm-main">
        <Binder3WelcomeBrand />
        <h2 className="b3-prep-title">상담을 준비하고 있습니다.</h2>
        <p className="b3-prep-description">잠시 후 법무법인 YK 소개 영상이 시작됩니다.</p>
        <div className="b3-prep-loading" role="status" aria-label="상담 준비 중">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

/** 바인더#3 를 누른 직후: AI 문항·상담 변호사·전문 인력 등을 모두 받을 때까지 보인다. */
export function Binder3Loading() {
  return (
    <section className="b3-confirm b3-prep">
      <div className="b3-confirm-main">
        <Binder3WelcomeBrand />
        <h2 className="b3-prep-title">상담 화면을 준비하고 있습니다.</h2>
        <div className="b3-prep-loading" role="status" aria-label="상담 화면 준비 중">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
