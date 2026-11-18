import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import PageVisitTabletBinder3 from './pages/visit/binder3/PageVisitTabletBinder3';

// YK-OS 상담실장이 「바인더 열기」로 태블릿에 여는 주소와 같은 쿼리. 고객 이름은 가명이다.
// 상담 변호사·사건 분야는 받아 둔 응답(public/ykos-snapshot)과 맞춘다.
const DEFAULT_QUERY = new URLSearchParams({
  engId: '991278',
  customerName: '김와이',
  visitAt: '2026-11-18 19:00',
  office: '서울 강남 주사무소',
  room: '상담실 301호',
  counsel: '395,69,1395',
  field: '형사',
  caseSmall: '일반사기',
  caseMiddle: '경제범죄',
}).toString();

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <Routes>
      <Route path="/visit-tablet/binder3" element={<PageVisitTabletBinder3 />} />
      <Route path="*" element={<Navigate to={`/visit-tablet/binder3?${DEFAULT_QUERY}`} replace />} />
    </Routes>
  </HashRouter>
);
