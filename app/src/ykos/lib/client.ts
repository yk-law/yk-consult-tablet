// POC 에는 YK-OS 백엔드가 없다. 바인더#3 가 부르는 주소를 로컬 YK-OS 에서 받아 둔 응답
// (public/ykos-snapshot/*.json)으로 돌려준다. 받아 둔 응답이 없으면 YK-OS 의 404 처럼 실패한다.
// 위쪽 binder3·api-visit-binder 는 YK-OS 원본 그대로 두고 이 파일만 POC 용이다.

const PREFIX = '/v1/visit/binder/';

function snapshotName(url: string) {
  return url.replace(PREFIX, '').replace(/\//g, '__');
}

async function load<T>(url: string): Promise<{ data: T }> {
  const res = await fetch(`${import.meta.env.BASE_URL}ykos-snapshot/${snapshotName(url)}.json?v=${__BUILD__}`);
  if (!res.ok) {
    throw Object.assign(new Error(`snapshot ${res.status}`), { response: { status: 404 } });
  }
  return { data: (await res.json()) as T };
}

const client = {
  get: <T>(url: string, _config?: unknown) => load<T>(url),
  post: <T>(url: string, _body?: unknown, _config?: unknown) => load<T>(url),
};

export default client;
