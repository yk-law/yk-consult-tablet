// 공식 사례 URL의 명시된 분류만 사용한다. 미분류·분야 미지정은 숨긴다.
const CATEGORY_FIELDS = {
  detective: "A",
  "sexual-assault": "B",
  traffic: "E",
  estate: "I",
  divorce: "J",
  civil: "K",
  inherit: "L",
  military: "M",
};

export function relatedCaseWorks(works, field) {
  if (!field) return [];
  return (works || []).filter((work) => {
    try {
      const url = new URL(work.href);
      if (url.hostname !== "www.yklawfirm.co.kr") return false;
      const category = url.pathname.match(/^\/case\/([^/]+)\/[^/]+\/?$/)?.[1];
      return CATEGORY_FIELDS[category] === field;
    } catch {
      return false;
    }
  });
}
