// src/pages/MeditationDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import churchImg from "../assets/church-illustration.gif";

// 텍스트(줄바꿈 포함)를 HTML로 변환 (기존 글 호환)
function plainToHtml(text) {
  const escaped = (text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br/>");
}

// 저장된 content가 HTML처럼 보이는지 간단 판별
function looksLikeHtml(str) {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

function MeditationDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timerId = null;
    let canceled = false;

    const fetchOne = async () => {
      try {
        const ref = doc(db, "qt", id);
        const snap = await getDoc(ref);

        if (canceled) return;

        if (snap.exists()) {
          setItem({ id: snap.id, ...snap.data() });

          // 🔥 30초 뒤 조회수 증가 예약
          timerId = window.setTimeout(async () => {
            try {
              await updateDoc(ref, { views: increment(1) });
              console.log("조회수 +1 (30초 머무름)");
            } catch (err) {
              console.error("조회수 증가 실패:", err);
            }
          }, 30000);
        } else {
          setItem(null);
        }
      } catch (err) {
        console.error(err);
        setItem(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchOne();

    return () => {
      canceled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <p>해당 묵상글을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const created =
    item.createdAt && item.createdAt.toDate ? item.createdAt.toDate() : null;

  const displayDate =
    item.serviceDate || (created ? created.toLocaleDateString("ko-KR") : "");

  const bodyFontSize = typeof item.fontSize === "number" ? item.fontSize : 22;

  // Quill HTML 또는 기존 텍스트를 화면 출력용 HTML로 정리
  const contentHtml = (() => {
    const raw = item?.content ?? "";
    return looksLikeHtml(raw) ? raw : plainToHtml(raw);
  })();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f5e9]">
      <div className="flex-1 flex items-start justify-center py-10 px-2">
        <div className="relative bg-white shadow-lg rounded-xl p-3 max-w-3xl w-full leading-relaxed overflow-hidden">
          <div className="relative z-10">
            <div className="mb-4">
              <div className="text-base text-gray-500">{displayDate}</div>
              <h1 className="text-3xl font-bold mt-1">{item.title}</h1>
              <br />
              <div className="mt-2 text-xl font-semibold text-gray-600">
                {item.verse}
              </div>
            </div>

            {/* Quill HTML 렌더링 */}
            <div
              className="leading-relaxed text-gray-800"
              style={{ fontSize: `${bodyFontSize}px` }}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          <img
            src={churchImg}
            alt="교회 일러스트"
            className="pointer-events-none select-none absolute bottom-4 right-4 w-[370px] md:w-[740px] opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default MeditationDetail;
