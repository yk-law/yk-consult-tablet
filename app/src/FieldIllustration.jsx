/** Neutral, monochrome field illustrations. Labels provide the accessible meaning. */
export default function FieldIllustration({ name }) {
  let drawing;
  if (/성범죄/.test(name)) drawing = <><path d="M24 5 39 11v12c0 10-7 16-15 20C16 39 9 33 9 23V11Z"/><circle cx="24" cy="19" r="5"/><path d="M16 32c1-7 15-7 16 0"/></>;
  else if (/군/.test(name)) drawing = <><path d="m24 5 15 6v12c0 10-8 17-15 20C17 40 9 33 9 23V11Z"/><path d="m24 14 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/></>;
  else if (/마약/.test(name)) drawing = <><path d="M16 7h16M19 7v12L9 36c-2 3 0 6 4 6h22c4 0 6-3 4-6L29 19V7M14 29h20"/><circle cx="22" cy="35" r="1.5"/><path d="M28 33h2"/></>;
  else if (/지식|특허/.test(name)) drawing = <><path d="M17 29c0-5-6-7-6-14a13 13 0 0 1 26 0c0 7-6 9-6 14M17 30h14M18 35h12M21 40h6M24 8v3M18 18l6 5 6-5M24 23v7"/></>;
  else if (/의료/.test(name)) drawing = <><rect x="8" y="12" width="32" height="29" rx="3"/><path d="M18 12V7h12v5M21 20h6v5h5v6h-5v5h-6v-5h-5v-6h5Z"/></>;
  else if (/해양/.test(name)) drawing = <><circle cx="24" cy="9" r="4"/><path d="M24 13v26M15 19h18M8 28c0 8 7 13 16 13s16-5 16-13M8 28l-3 5M8 28l5 3M40 28l3 5M40 28l-5 3"/></>;
  else if (/형사|소송|민사|행정/.test(name)) drawing = <><path d="M24 7v32M12 41h24M8 15h32M12 15 6 29h12Zm24 0-6 14h12Z"/><circle cx="24" cy="11" r="3"/></>;
  else if (/부동산|건설/.test(name)) drawing = <><path d="m5 23 19-16 19 16M10 20v22h28V20M20 42V28h8v14M17 20h2M29 20h2"/></>;
  else if (/가사|상속|이혼|학교/.test(name)) drawing = <><circle cx="17" cy="14" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 39v-6c0-12 24-12 24 0v6M31 27c7 0 12 4 12 10v2"/></>;
  else drawing = <><path d="M12 5h17l8 8v30H12ZM29 5v9h8M18 22h13M18 29h13M18 36h8"/></>;
  return <svg className="field-illustration" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawing}</svg>;
}
