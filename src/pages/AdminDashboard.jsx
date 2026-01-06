// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { adminEmails } from "../adminEmails";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && adminEmails.includes(u.email ?? "")) {
        setUser(u);
      } else {
        setUser(null);
      }
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // 로그인/권한 체크 중
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <div className="bg-white rounded-xl shadow-lg px-6 py-4">
          <p>관리자 정보를 확인하는 중입니다…</p>
        </div>
      </div>
    );
  }

  // 관리자가 아니면 로그인 안내
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <div className="bg-white rounded-xl shadow-lg px-6 py-4 text-center space-y-4">
          <p className="font-semibold">
            묵상 작성은 목사님/관리자만 사용하실 수 있습니다.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  // ✅ 관리자를 위한 “새 묵상 작성 전용” 화면
  return (
    <div className="min-h-screen bg-[#f8f5e9] py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
        <p className="text-xs text-gray-500">
          {user.email} 계정으로 로그인 중입니다.
        </p>

        <h1 className="text-2xl font-bold mb-2">새 묵상 작성</h1>

        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          아래 버튼을 누르시면 오늘 올리실 묵상 내용을 작성하는 화면으로
          이동합니다. 저장하시면 성도님들 화면에 바로 반영됩니다.
        </p>

        <Link
          to="/write"
          className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition"
        >
          새 묵상 작성 화면 열기
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
