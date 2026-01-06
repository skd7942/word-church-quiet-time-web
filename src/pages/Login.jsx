// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";
import { adminEmails } from "../adminEmails";

function Login() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // 이미 로그인 되어 있으면 바로 /admin 으로 보내기
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && adminEmails.includes(user.email ?? "")) {
        navigate("/admin", { replace: true });
      }
      setChecking(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async () => {
    const ua = navigator.userAgent || "";
    const isKakaoInApp = /KAKAOTALK/i.test(ua);

    // 🔸 카카오톡 인앱 브라우저에서는 Google 로그인 차단 안내
    if (isKakaoInApp) {
      alert(
        [
          "카카오톡 안에서는 Google 로그인이 되지 않습니다.",
          "",
          "오른쪽 아래 ⋮ 를 누르신 후",
          "『다른 브라우저에서 열기』를 선택하시고,",
          "로그인해 주세요.",
        ].join("\n")
      );
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      navigate("/write");
    } catch (err) {
      console.error(err);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <div className="bg-white rounded-xl shadow-lg px-6 py-4">
          <p>로그인 상태를 확인하는 중입니다…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
             
        <button
  onClick={handleLogin}
  className="w-full py-3 rounded-xl bg-white border border-gray-300 shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition"
>
  <img
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google Logo"
    className="w-5 h-5"
  />
  <span className="text-gray-700 text-base font-medium">
    Google 계정으로 로그인
  </span>
</button>

        <p className="mt-4 text-sm text-gray-800 leading-relaxed">
          카카오톡 안에서는 <b>Google 로그인</b>이 되지 않습니다.
          <br />
          오른쪽 아래 ⋮ 를 누르신 후 <b>다른 브라우저로 열기</b>를<br />
          선택하시고 로그인해 주세요.
        </p>
      </div>
    </div>
  );
}

export default Login;
