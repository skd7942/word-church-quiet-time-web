// src/pages/List.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc as docRef,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { adminEmails } from "../adminEmails";

function List() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // 로그인 상태에 따라 관리자 여부 판별
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

  // 목록 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "qt"));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // serviceDate(yyyy-mm-dd) 기준 내림차순 정렬
        list.sort((a, b) => {
          if (a.serviceDate && b.serviceDate) {
            return b.serviceDate.localeCompare(a.serviceDate);
          }
          const aDate =
            a.createdAt && a.createdAt.toDate
              ? a.createdAt.toDate().getTime()
              : 0;
          const bDate =
            b.createdAt && b.createdAt.toDate
              ? b.createdAt.toDate().getTime()
              : 0;
          return bDate - aDate;
        });

        setItems(list);
      } catch (err) {
        console.error(err);
        alert("목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("정말 이 묵상글을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(docRef(db, "qt", id));
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (id) => {
    if (!isAdmin) return;
    navigate(`/write?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* 타이틀 글자 크기 한 단계 줄임 */}
        <h1 className="text-2xl font-bold mb-4">목록</h1>

        {loading ? (
          <p>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p>등록된 묵상글이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => {
              const dateLabel =
                item.serviceDate ||
                (item.createdAt &&
                  item.createdAt.toDate &&
                  item.createdAt.toDate().toLocaleDateString("ko-KR"));

              return (
                <li key={item.id} className="py-2">
                  <div className="flex justify-between items-start">
                    {/* 클릭 시 상세 페이지로 이동 */}
                    <Link
                      to={`/meditation/${item.id}`}
                      className="block flex-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition"
                    >
                      {/* 날짜 먼저 */}
                      <div className="text-sm text-gray-500 mb-1">
                        {dateLabel}
                      </div>
                      <div className="font-semibold text-base">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {item.verse}
                      </div>
                    </Link>

                    {/* 관리자 전용 수정/삭제 버튼 */}
                    {isAdmin && (
                      <div className="ml-2 flex flex-col space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          className="px-2 py-1 border rounded-md bg-white hover:bg-slate-100"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 border rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          삭제
                        </button>
                          {/* 🔥 삭제 버튼 바로 아래 조회수 표시 */}
                          {auth.currentUser && (
                            <div className="text-gray-500 mt-1">
                            조회수 {item.views ?? 0}
                           </div>
                          )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default List;
