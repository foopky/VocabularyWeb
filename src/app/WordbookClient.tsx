"use client";

import React, { useState } from "react";
import { getCookie } from "cookies-next";

// 📚 단어 데이터 타입을 정의합니다.
interface WordEntry {
  id: number;
  language: string;
  pos: string;
  word: string;
  meaning: string;
  learned: boolean;
  kundoku: string;
  ondoku: string;
  pronunciation: string;
}

// 🗂️ 공유 폴더 데이터 타입을 정의합니다.
interface SharedFolder {
  id: number;
  folderName: string;
  author: string;
  createdDate: string;
}
interface WordbookClientProps {
  authToken: string;
  userId: string;
}

// 🗃️ 임시 데이터
const DUMMY_WORDS: WordEntry[] = [
  {
    id: 1,
    language: "Japanese",
    pos: "Noun",
    word: "学習",
    meaning: "학습",
    learned: true,
    kundoku: "まなび",
    ondoku: "がくしゅう",
    pronunciation: "Gakushū",
  },
  {
    id: 2,
    language: "Japanese",
    pos: "Verb",
    word: "書く",
    meaning: "쓰다",
    learned: false,
    kundoku: "かく",
    ondoku: "しょく",
    pronunciation: "Kaku",
  },
  {
    id: 3,
    language: "English",
    pos: "Adj",
    word: "Ubiquitous",
    meaning: "어디에나 있는",
    learned: true,
    kundoku: "-",
    ondoku: "-",
    pronunciation: "juːˈbɪkwɪtəs",
  },
  ...Array(15)
    .fill(null)
    .map((_, i) => ({
      id: i + 4,
      language: "Japanese",
      pos: "Noun",
      word: `単語 ${i + 1}`,
      meaning: `단어 뜻 ${i + 1}`,
      learned: i % 3 === 0,
      kundoku: "くんよみ",
      ondoku: "おんよみ",
      pronunciation: `Tango ${i + 1}`,
    })),
];

const DUMMY_FOLDERS: SharedFolder[] = [
  {
    id: 101,
    folderName: "JLPT N1 필수",
    author: "Minji",
    createdDate: "2025-10-01",
  },
  {
    id: 102,
    folderName: "비즈니스 영어 회화",
    author: "Tom",
    createdDate: "2025-09-15",
  },
];

const CURRENT_DIRECTORY = "나만의 일본어 필수 단어"; // ⬅️ 현재 디렉토리 이름

export default function WordbookPage({
  authToken,
  userId,
}: WordbookClientProps) {
  const [words, setWords] = useState<WordEntry[]>(DUMMY_WORDS);
  const [checkedWordIds, setCheckedWordIds] = useState<number[]>([]);

  // 💡 버튼 클릭 핸들러
  const handleAddWord = () => {
    alert("단어 추가 기능 구현 필요.");
  };
  const handleCreateDirectory = () => {
    alert("폴더 생성 기능 구현 필요.");
  };

  const handleDeleteWord = () => {
    if (checkedWordIds.length === 0) {
      alert("삭제할 단어를 하나 이상 선택해주세요.");
      return;
    }
    if (
      window.confirm(
        `선택된 단어 ${checkedWordIds.length}개를 정말로 삭제하시겠습니까?`
      )
    ) {
      // 선택된 ID를 제외한 단어 목록으로 상태 업데이트
      const newWords = words.filter(
        (word) => !checkedWordIds.includes(word.id)
      );
      setWords(newWords);
      setCheckedWordIds([]); // 체크박스 초기화
      alert("단어가 삭제되었습니다.");
    }
  };

  // 💡 체크박스 변경 핸들러
  const handleCheckboxChange = (id: number, checked: boolean) => {
    setCheckedWordIds((prevIds) => {
      if (checked) {
        return [...prevIds, id];
      } else {
        return prevIds.filter((wordId) => wordId !== id);
      }
    });
  };

  return (
    <div style={styles.container}>
      {/* ⏫ 상단 영역: 제목 및 버튼 */}
      <header style={styles.header}>
        <h1 style={styles.title}>단어장 관리 시스템</h1>
        <div style={styles.buttonGroup}>
          <button
            onClick={handleAddWord}
            style={{ ...styles.button, ...styles.addButton }}
          >
            ➕ Add Word
          </button>
          <button onClick={handleCreateDirectory} style={styles.button}>
            📁 Create Directory
          </button>
          <button
            onClick={handleDeleteWord}
            style={{ ...styles.button, ...styles.deleteButton }}
            disabled={checkedWordIds.length === 0}
          >
            🗑️ Delete Word ({checkedWordIds.length})
          </button>
        </div>
      </header>

      {/* 📖 단어 표시 영역 (테이블 및 스크롤) */}
      <section style={styles.wordTableContainer}>
        {/* 🌟 현재 디렉토리 표시 영역 */}
        <div style={styles.directoryDisplay}>
          <span style={styles.directoryText}>
            현재 Directory: <strong>{CURRENT_DIRECTORY}</strong>
          </span>
        </div>

        {/* 스크롤 가능한 테이블 컨테이너 */}
        <div style={styles.scrollWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{ ...styles.tableHeader, width: "3%" }}></th>{" "}
                {/* 체크박스 열 */}
                <th style={{ ...styles.tableHeader, width: "10%" }}>
                  Language
                </th>
                <th style={{ ...styles.tableHeader, width: "5%" }}>Pos</th>
                <th style={{ ...styles.tableHeader, width: "15%" }}>Word</th>
                <th style={{ ...styles.tableHeader, width: "25%" }}>Meaning</th>
                <th style={{ ...styles.tableHeader, width: "5%" }}>Learned</th>
                <th style={{ ...styles.tableHeader, width: "10%" }}>Kundoku</th>
                <th style={{ ...styles.tableHeader, width: "10%" }}>Ondoku</th>
                <th style={{ ...styles.tableHeader, width: "17%" }}>
                  Pronunciation
                </th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id} style={styles.dataRow}>
                  <td style={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={checkedWordIds.includes(word.id)}
                      onChange={(e) =>
                        handleCheckboxChange(word.id, e.target.checked)
                      }
                    />
                  </td>
                  <td style={styles.tableCell}>{word.language}</td>
                  <td style={styles.tableCell}>{word.pos}</td>
                  <td style={styles.tableCell}>{word.word}</td>
                  <td style={styles.tableCell}>{word.meaning}</td>
                  <td style={styles.tableCell}>{word.learned ? "✅" : "❌"}</td>
                  <td style={styles.tableCell}>{word.kundoku}</td>
                  <td style={styles.tableCell}>{word.ondoku}</td>
                  <td style={styles.tableCell}>{word.pronunciation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {words.length === 0 && (
          <div style={styles.noData}>현재 디렉토리에 단어가 없습니다.</div>
        )}
      </section>

      {/* ⬇️ 하단 영역: 공유 폴더 */}
      <section style={styles.sharedFolderContainer}>
        <h2 style={styles.sectionTitle}>Shared Folder 영역</h2>
        <div style={styles.folderList}>
          {DUMMY_FOLDERS.map((folder) => (
            <div key={folder.id} style={styles.folderCard}>
              <h3 style={styles.folderName}>{folder.folderName}</h3>
              <p style={styles.folderInfo}>**Author:** {folder.author}</p>
              <p style={styles.folderInfo}>
                **Created Date:** {folder.createdDate}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// 🎨 기본적인 CSS 스타일 정의 (인라인 스타일용)
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Nanum Gothic, Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "2px solid #eee",
    paddingBottom: "10px",
  },
  title: {
    fontSize: "28px",
    color: "#333",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
  },
  button: {
    padding: "10px 15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  addButton: {
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
  },
  sectionTitle: {
    fontSize: "22px",
    color: "#555",
    marginBottom: "15px",
    borderLeft: "4px solid #0070f3",
    paddingLeft: "10px",
  },

  // --- 단어 테이블 스타일 ---
  wordTableContainer: {
    marginBottom: "40px",
    position: "relative", // 디렉토리 표시를 위해 relative 설정
  },
  directoryDisplay: {
    textAlign: "right", // 우 상단에 표시
    marginBottom: "10px",
  },
  directoryText: {
    fontSize: "16px",
    color: "#0070f3",
    padding: "5px 10px",
    borderRadius: "4px",
    backgroundColor: "#e6f7ff",
  },
  scrollWrapper: {
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: "8px",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px", // 가로 스크롤을 위해 최소 너비 확보
  },
  headerRow: {
    backgroundColor: "#f4f4f4",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tableHeader: {
    padding: "12px 10px",
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    fontSize: "14px",
    color: "#333",
  },
  dataRow: {
    borderBottom: "1px solid #eee",
  },
  tableCell: {
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  checkboxCell: {
    padding: "10px",
    textAlign: "center",
    width: "3%",
  },
  noData: {
    textAlign: "center",
    padding: "50px",
    color: "#999",
    fontSize: "18px",
    border: "1px solid #eee",
    borderTop: "none",
  },

  // --- 공유 폴더 스타일 ---
  sharedFolderContainer: {
    paddingTop: "20px",
    borderTop: "2px dashed #eee",
  },
  folderList: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  folderCard: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "15px",
    width: "250px",
    boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#f9f9ff",
  },
  folderName: {
    fontSize: "18px",
    marginBottom: "10px",
    color: "#0070f3",
    borderBottom: "1px dotted #ccc",
    paddingBottom: "5px",
  },
  folderInfo: {
    fontSize: "12px",
    color: "#666",
    margin: "5px 0",
  },
};
