import { useEffect, useState } from 'react';
import { BINDER3_ASSET_BASE } from './binder3Common';

export const BINDER3_FILM_SRC = `${BINDER3_ASSET_BASE}/yk-brand-film.mp4`;
/** 느린 네트워크에서 시작을 막지 않는다. 넘기면 영상은 파일에서 바로 스트리밍한다. */
export const FILM_WAIT_MS = 20000;

/** 소개 영상을 시작 로딩 때 내려받아, 영상 화면에서 끊기지 않게 한다. 실패해도 파일 주소로 재생을 시도한다. */
export function useBinder3FilmPreload(needed: boolean) {
  const [state, setState] = useState({ src: BINDER3_FILM_SRC, done: !needed });

  useEffect(() => {
    if (!needed) return undefined;
    let alive = true;
    let objectUrl: string | null = null;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FILM_WAIT_MS);
    fetch(BINDER3_FILM_SRC, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`film ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ src: objectUrl, done: true });
      })
      .catch(() => {
        if (alive) setState({ src: BINDER3_FILM_SRC, done: true });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      alive = false;
      window.clearTimeout(timer);
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [needed]);

  return state;
}
