// src/App.jsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { adminEmails } from "./adminEmails";

import Latest from "./pages/Latest";
import List from "./pages/List";
import Login from "./pages/Login";
import Write from "./pages/Write";
import MeditationDetail from "./pages/MeditationDetail";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  // 로그인 상태 감시 → 관리자 여부 판단
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && adminEmails.includes(user.email ?? "")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 되었습니다.");
      setIsAdmin(false);
      // 간단히 메인으로 이동
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* 상단 헤더 */}
        <header className="bg-slate-800 text-white py-3 px-4 flex justify-between items-center">
          <Link to="/" className="font-bold text-lg">
            말씀교회 오늘의 말씀
          </Link>

          <nav className="space-x-4 text-sm flex items-center">
            <Link to="/list" className="hover:underline">
              목록
            </Link>

            {!isAdmin ? (
              // 관리자 로그인 전: 관리자 메뉴만
              <Link to="/login" className="hover:underline">
                관리자
              </Link>
            ) : (
              // 관리자 로그인 후: 추가 / 로그아웃
              <>
                <Link to="/write" className="hover:underline">
                  추가
                </Link>
                <button onClick={handleLogout} className="hover:underline">
                  로그아웃
                </button>
              </>
            )}
          </nav>
        </header>

        {/* 본문 영역 */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Latest />} />
            <Route path="/latest" element={<Latest />} />
            <Route path="/login" element={<Login />} />
            <Route path="/write" element={<Write />} />
            <Route path="/list" element={<List />} />
            <Route path="/meditation/:id" element={<MeditationDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
