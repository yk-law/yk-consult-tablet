const text = (value) => typeof value === "string" ? value.trim() : "";
const lines = (values) => (values || []).map(text).filter(Boolean);

export function profileCategories(person, fields) {
  const groups = (person.areas || []).map((area) => text(area?.group)).filter(Boolean);
  return [...new Set(groups.length ? groups : (person.f || []).map((code) => text(fields[code]?.[0])).filter(Boolean))];
}

export function cleanProfileContent(person) {
  return {
    ...person,
    career: lines(person.career), awards: lines(person.awards),
    papers: lines(person.papers), cases: lines(person.cases),
    areas: (person.areas || []).filter((area) => text(area?.group)).map((area) => ({...area, group:text(area.group)})),
    works: (person.works || []).filter((work) => text(work?.title) && text(work?.href)),
  };
}
