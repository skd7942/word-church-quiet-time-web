// src/pages/Write.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { adminEmails } from "../adminEmails";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import Quill from "quill";

// 기존 글(plain text) 호환용: 줄바꿈 포함 텍스트를 HTML로 변환
function plainToHtml(text) {
  const escaped = (text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br/>");
}

// 저장된 content가 HTML처럼 보이는지 대략 판별
function looksLikeHtml(str) {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

function isQuillEmpty(html) {
  const v = (html ?? "").trim();
  return (
    v === "" ||
    v === "<p><br></p>" ||
    v === "<p><br></p>\n" ||
    v === "<p></p>"
  );
}

/**
 * ✅ attributor(class) 기반 등록 (size/font 안정)
 *  - font: 고딕(sans), 명조(myungjo)
 *  - size: 22~30
 */
const FontClass = Quill.import("attributors/class/font");
FontClass.whitelist = ["sans", "myungjo"];
Quill.register(FontClass, true);

const SizeClass = Quill.import("attributors/class/size");
SizeClass.whitelist = ["22", "24", "26", "28", "30"];
Quill.register(SizeClass, true);

function Write() {
  const [title, setTitle] = useState("");
  const [verse, setVerse] = useState("");
  const [content, setContent] = useState("");

  const [serviceDate, setServiceDate] = useState(() =>
    new Date().toLocaleDateString("sv-SE")
  );

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const quillRef = useRef(null);

  // ✅ 필요한 기능만: 굵게/기울임/밑줄/색상/글꼴(고딕·명조)/글자크기(22~30)
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ font: ["sans", "myungjo"] }],
        [{ size: ["22", "24", "26", "28", "30"] }],
        ["bold", "italic", "underline"],
        [{ color: [] }],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = useMemo(
    () => ["font", "size", "bold", "italic", "underline", "color"],
    []
  );

  // 로그인 / 관리자 여부 확인
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!(user && adminEmails.includes(user.email ?? "")));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 수정 모드 로딩 (?id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (!id) {
      // 새 글 작성 모드 초기화
      setEditingId(null);
      setTitle("");
      setVerse("");
      setContent("");
      setServiceDate(new Date().toLocaleDateString("sv-SE"));
      return;
    }

    setEditingId(id);

    const load = async () => {
      try {
        const ref = doc(db, "qt", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        setTitle(data.title ?? "");
        setVerse(data.verse ?? "");

        const raw = data.content ?? "";
        setContent(looksLikeHtml(raw) ? raw : plainToHtml(raw));

        if (data.serviceDate) setServiceDate(data.serviceDate);
      } catch (err) {
        console.error(err);
        alert("기존 묵상글을 불러오는 중 오류가 발생했습니다.");
      }
    };

    load();
  }, [location.search]);

  // ✅ 새 글 작성 기본값: 고딕 + 22 (mount 직후 리셋 대비 2회 적용)
  useEffect(() => {
    if (editingId) return;

    const applyDefaults = () => {
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;

      const isEmpty = quill.getLength() <= 1; // 빈 문서면 length=1(\n)
      if (!isEmpty) return;

      quill.setSelection(0, 0, "silent");
      quill.format("font", "sans", "silent");
      quill.format("size", "22", "silent");
      quill.formatLine(0, 1, { font: "sans", size: "22" }, "silent");
    };

    const t1 = window.setTimeout(applyDefaults, 0);
    const t2 = window.setTimeout(applyDefaults, 50);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [editingId]);

  // ✅ 붙여넣기(CTRL+V) 후 size가 떨어지는 현상 방지: size만 22로 통일
  // (폰트는 사용자가 선택한 상태를 존중)
  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;

    const handlePaste = () => {
      window.setTimeout(() => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;

        const len = editor.getLength();
        if (len > 1) {
          editor.formatText(0, len, { size: "22" }, "silent");
        }

        // 다음 입력도 22 유지
        editor.format("size", "22", "silent");
      }, 0);
    };

    quill.root.addEventListener("paste", handlePaste);
    return () => quill.root.removeEventListener("paste", handlePaste);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("관리자만 작성할 수 있습니다.");
      return;
    }

    if (
      !serviceDate ||
      !title.trim() ||
      !verse.trim() ||
      isQuillEmpty(content)
    ) {
      alert("날짜, 제목, 성경 구절, 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);

      const basePayload = {
        title: title.trim(),
        verse: verse.trim(),
        content: content.trim(),
        serviceDate,
      };

      if (editingId) {
        // ✅ 수정: views/createdAt 건드리지 않음
        const ref = doc(db, "qt", editingId);
        await updateDoc(ref, {
          ...basePayload,
          updatedAt: serverTimestamp(),
        });
      } else {
        // ✅ 신규 작성: createdAt + views 초기화
        await addDoc(collection(db, "qt"), {
          ...basePayload,
          createdAt: serverTimestamp(),
          views: 0,
          authorEmail: auth.currentUser?.email ?? null,
        });
      }

      alert("저장되었습니다.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f5e9]">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p>관리자만 묵상글을 작성할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5e9] py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow">
        <h1 className="text-3xl font-bold mb-6">
          {editingId ? "묵상 수정" : "새 묵상 작성"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-semibold mb-1">날짜</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm md:text-base"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold mb-1">제목</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm md:text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="말씀 제목"
            />
          </div>

          {/* 성경 구절 */}
          <div>
            <label className="block text-sm font-semibold mb-1">성경 구절</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm md:text-base"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              placeholder="태초에 하나님이 천지를 창조하시니라 [창 1:1]"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold mb-1">내용</label>
            <div className="border rounded-lg overflow-hidden">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
              />
            </div>

            {/* 기본 스타일: 줄간격/최소높이 (폰트크기 22는 전역 CSS에 적용한 상태) */}
            <style>{`
              .ql-editor {
                line-height: 1.8;
                min-height: 16rem;
              }
            `}</style>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Write;
