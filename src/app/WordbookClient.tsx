"use client";

import React, { FormEvent, useEffect, useState, useRef } from "react";
import axios from "axios";
import type {
  WordEntry,
  WordFolder,
  WordInput,
  SharedFolder,
  WordbookClientProps,
} from "../../types/contents";

const CURRENT_DIRECTORY = "나만의 일본어 필수 단어"; // ⬅️ 현재 디렉토리 이름

export default function WordbookPage({
  authToken,
  userId,
}: WordbookClientProps) {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [addWord, setAddWord] = useState<WordInput | null>(null);
  const [checkedWordIds, setCheckedWordIds] = useState<number[]>([]);
  const [folders, setFolders] = useState<WordFolder[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]); // show shared folders area
  const [shareFolderWords, setShareFolderWords] = useState<WordEntry[]>([]); // words in selected shared folder
  const [showViewSharedModal, setShowViewSharedModal] = useState(false);
  const [selectedSharedFolderName, setSelectedSharedFolderName] = useState<
    string | null
  >(null);
  const [mySharedFolders, setMySharedFolders] = useState<SharedFolder[]>([]);
  const [showMySharedModal, setShowMySharedModal] = useState(false);

  // ref for header checkbox (to support indeterminate state)
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const allChecked = words.length > 0 && checkedWordIds.length === words.length;

  // keep header checkbox indeterminate when some items are selected
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        checkedWordIds.length > 0 && checkedWordIds.length < words.length;
    }
  }, [checkedWordIds, words]);

  // Share Folder UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCreating, setShareCreating] = useState(false);
  const [shareForm, setShareForm] = useState<{
    name: string;
    language: string;
    folderId?: number;
  }>({
    name: "",
    language: "english",
    folderId: undefined,
  });
  const openShareModal = () => {
    setShareForm({
      name: folders.find((f) => f.id === currentFolderId)?.name ?? "",
      language:
        folders.find((f) => f.id === currentFolderId)?.language ?? "english",
      folderId: currentFolderId ?? folders[0]?.id,
    });
    setShowShareModal(true);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setCheckedWordIds(words.map((w) => w.id));
    } else {
      setCheckedWordIds([]);
    }
  };
  // handle share modal form field changes
  const handleShareFormChange = (field: "name" | "language", value: string) => {
    setShareForm((prev) => ({ ...prev, [field]: value }));
  };

  // submit shared folder to backend
  const submitShareFolder = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!shareForm.name.trim()) {
      alert("공유폴더 이름을 입력하세요.");
      return;
    }
    try {
      setShareCreating(true);
      const folderIdToShare =
        shareForm.folderId ?? currentFolderId ?? folders[0]?.id ?? 1;
      const body = {
        userId: Number(userId) || 1,
        folderId: folderIdToShare,
        name: shareForm.name,
        language: shareForm.language,
      };
      const resp = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/sharedFolder`,
        body,
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (resp?.data) {
        setSharedFolders((prev) => [resp.data, ...prev]);
      }
      setShowShareModal(false);
      alert("Shared folder created.");
    } catch (err) {
      console.error("submitShareFolder failed:", err);
      alert("Shared folder 생성 실패.");
    } finally {
      setShareCreating(false);
    }
  };

  // current directory/folder shown in the table
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  // when adding a word, choose which folder to add it to
  const [addWordFolderId, setAddWordFolderId] = useState<number | null>(null);

  // show/hide Add Word modal
  const [showAddForm, setShowAddForm] = useState(false);

  // Create Directory modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [folderForm, setFolderForm] = useState<{
    name: string;
    language: string;
  }>({
    name: "",
    language: "japanese",
  });

  // fetch folders for initial load (extracted so it can be reused)
  const fetchFolders = async (): Promise<WordFolder[] | undefined> => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/getfolderUser/${userId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const folderList: WordFolder[] = response.data;
      setFolders(folderList);
      if (folderList && folderList.length > 0) {
        // set current folder to first when loaded
        setCurrentFolderId(folderList[0].id);
      } else {
        setCurrentFolderId(null);
      }
      return folderList;
    } catch (error) {
      console.error("폴더 불러오기 오류: ", error);
      alert("폴더 불러오기 실패.");
    }
  };

  // fetch words for a given folder id (can be reused)
  const fetchWords = async (folderId: number | null) => {
    if (!folderId) {
      setWords([]);
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/getwords/${folderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const wordEntries: WordEntry[] = response.data;
      setWords(wordEntries);
    } catch (error) {
      console.error("단어 불러오기 오류: ", error);
      alert("단어 불러오기 실패.");
    }
  };

  // create a shared folder on first load (uses curl body you provided)
  const fetchSharedFolder = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/sharedFolder`,
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // backend returns created shared folder -> merge into state
      if (response?.data) {
        console.log(response.data);
        setSharedFolders(response.data);
        console.log("fetchSharedFolder response:", response.data);
      }
    } catch (err) {
      console.error("fetchSharedFolder failed:", err);
    }
  };

  useEffect(() => {
    fetchFolders().then((folders) => {
      if (folders && folders.length > 0) {
        // fetch words for the first folder (or currentFolderId if already set)
        const initialFolderId = currentFolderId ?? folders[0].id;
        setCurrentFolderId(initialFolderId);
        fetchWords(initialFolderId);
        // create/load a shared folder on first load (non-blocking)
        fetchSharedFolder();
      }
    });
  }, [authToken, userId]);

  // 💡 버튼 클릭 핸들러
  const handleAddWord = (e?: FormEvent) => {
    // when Add button clicked: open modal and initialize form model
    if (e) e.preventDefault();
    const initial: WordInput = {
      language: "japanese",
      pos: "",
      word: "",
      meaning: "",
      learned: false,
      kundoku: "",
      ondoku: "",
      pronunciation: "",
      example: "",
    };
    setAddWord(initial);
    // default target folder for new word -> currently selected folder
    setAddWordFolderId(currentFolderId ?? folders[0]?.id ?? null);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setAddWord(null);
  };

  const handleFormChange = (
    field: keyof WordInput,
    value: string | boolean | number
  ) => {
    if (!addWord) return;
    setAddWord({ ...addWord, [field]: value } as WordInput);
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!addWord) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/words`,
        addWord,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const created: WordEntry = response?.data || {
        id: Date.now(),
        ...addWord,
      };
      // if user selected a folder to attach this word to, call addwordtofolder
      if (addWordFolderId) {
        try {
          const lang = (created.language || addWord.language || "english")
            .toString()
            .toLowerCase();
          await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_HOST
            }/folder/addwordtofolder/${encodeURIComponent(lang)}/${
              created.id
            }/${addWordFolderId}`,
            {},
            {
              headers: {
                Accept: "*/*",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          // if the created word was added to the currently displayed folder, refresh list
          if (addWordFolderId === currentFolderId && currentFolderId) {
            await fetchWords(currentFolderId);
          }
        } catch (err) {
          console.error("addwordtofolder failed:", err);
          alert("단어를 폴더에 추가하는데 실패했습니다.");
        }
      }
      // setWords((prev) => [created, ...prev]);
      setShowAddForm(false);
      setAddWord(null);
      alert("Word successfully added.");
    } catch (error) {
      console.error("Word add error: ", error);
      alert("Word add failed.");
    }
  };

  // when user selects a folder to view, update currentFolderId and reload words
  const handleSelectFolderForView = async (folderId: number | null) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setWords([]);
      return;
    }
    await fetchWords(folderId);
  };

  // --- Create Directory handlers ---
  const handleCreateDirectory = () => {
    setFolderForm({ name: "", language: "japanese" });
    setShowCreateModal(true);
  };

  const handleCreateFormChange = (
    field: "name" | "language",
    value: string
  ) => {
    setFolderForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitCreateDirectory = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!folderForm.name.trim()) {
      alert("폴더 이름을 입력하세요.");
      return;
    }
    try {
      setCreating(true);
      // POST to backend (matches the curl you provided)
      const url = `${
        process.env.NEXT_PUBLIC_API_HOST
      }/folder/wordfolder?user_id=${encodeURIComponent(userId)}`;
      const response = await axios.post(
        url,
        {
          name: folderForm.name,
          language: folderForm.language,
        },
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // refresh folder list after creation
      await fetchFolders();
      setShowCreateModal(false);
      alert("Directory created.");
    } catch (error) {
      console.error("Create directory error:", error);
      alert("Directory creation failed.");
    } finally {
      setCreating(false);
    }
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
      // 선택된 단어 ID들에 대해 DELETE 요청을 보냄
      for (const id of checkedWordIds) {
        axios.delete(`${process.env.NEXT_PUBLIC_API_HOST}/words`, {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            wordId: id,
            folderId: currentFolderId,
          },
        });
      }

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

  const handleDeleteDirectory = async () => {
    if (!currentFolderId) {
      alert("No directory to delete.");
      return;
    }
    const folder = folders.find((f) => f.id === currentFolderId);
    const folderName = folder?.name ?? `folder ${currentFolderId}`;
    if (words.length > 0) {
      alert("Please delete all words in the directory before deleting it.");
      return;
    }
    const ok = window.confirm(
      `Are you sure you want to delete the directory "${folderName}"?`
    );
    if (!ok) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/${currentFolderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const updated = await fetchFolders();
      if (updated && updated.length > 0) {
        const newId = updated[0].id;
        setCurrentFolderId(newId);
      } else {
        setCurrentFolderId(null);
        setWords([]);
      }
      alert("Directory deleted.");
    } catch (err) {
      console.error("Delete directory failed:", err);
      alert("Directory deletion failed.");
    }
  };

  // fetch and show words for a shared folder (opens modal)
  const viewSharedFolderWords = async (sharedFolder: SharedFolder) => {
    // sharedFolder.id shape may vary; support either { folderId } or number
    const folderId = sharedFolder.id.folderId;
    if (!folderId) {
      alert("Invalid shared folder id.");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/getwords/${folderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const data = response?.data ?? [];
      if (!data || data.length === 0) {
        // still show modal but inform user
        setShareFolderWords([]);
        alert("No words in this shared folder.");
      } else {
        setShareFolderWords(data);
      }
      setSelectedSharedFolderName(
        sharedFolder.wordFolder?.name ?? "Shared Folder"
      );
      setShowViewSharedModal(true);
    } catch (error) {
      console.error("View shared folder words error:", error);
      alert("Failed to load shared folder words.");
    }
  };

  const viewMySharedFolders = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_HOST}/sharedFolder/${userId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (!response?.data) {
        alert("No shared folders found for user.");
        return;
      }
      setMySharedFolders(response.data);
    } catch (error) {
      console.error("View my shared folders error:", error);
      alert("Failed to load my shared folders.");
    }
  };

  const deleteMySharedFolder = async (sharedFolderId: number) => {
    const ok = window.confirm(
      "Are you sure you want to delete this shared folder?"
    );
    if (!ok) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_HOST}/sharedFolder/${userId}/${sharedFolderId}`,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      await viewMySharedFolders(); // Refresh the list after deletion
      setSharedFolders((prev) =>
        prev.filter((sf) => sf.id.folderId !== sharedFolderId)
      );
      alert("Shared folder deleted.");
    } catch (error) {
      console.error("Delete shared folder error:", error);
      alert("Failed to delete shared folder.");
    }
  };

  const openMySharedModal = async () => {
    await viewMySharedFolders();
    setShowMySharedModal(true);
  };

  const addSharedFolderToMyFolders = async (wordFolder: WordFolder) => {
    const ok = window.confirm("Add this shared folder to my word folders?");
    if (!ok) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_HOST}/folder/SharedFolderToMyWordFolder?userId=${userId}`,
        wordFolder,
        {
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
    } catch (error) {
      console.error("Add shared folder to my folders error:", error);
      alert("Failed to add shared folder to my folders.");
    }
    await fetchFolders();
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
            onClick={handleDeleteDirectory}
            style={{ ...styles.button, ...styles.deleteButton }}
            disabled={!currentFolderId}
            title={
              currentFolderId
                ? "Delete current directory"
                : "No directory to delete"
            }
          >
            🗑️ Delete Directory
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

      {/* Create Directory Modal */}
      {showCreateModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowCreateModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>새 Directory 생성</h3>
            </div>
            <form onSubmit={submitCreateDirectory}>
              <div style={{ ...styles.modalBody, gridTemplateColumns: "1fr" }}>
                <label style={styles.label}>
                  Name
                  <input
                    style={styles.input}
                    value={folderForm.name}
                    onChange={(e) =>
                      handleCreateFormChange("name", e.target.value)
                    }
                    required
                    placeholder="예: my-japanese-list"
                  />
                </label>
                <label style={styles.label}>
                  Language
                  <input
                    style={styles.input}
                    value={folderForm.language}
                    onChange={(e) =>
                      handleCreateFormChange("language", e.target.value)
                    }
                    placeholder="japanese"
                    required
                  />
                </label>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.button}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddForm && addWord && (
        <div style={styles.modalOverlay} onMouseDown={handleCloseForm}>
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              // prevent overlay click from closing when interacting inside modal
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>새 단어 추가</h3>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div style={styles.modalBody}>
                <label style={styles.label}>
                  Folder
                  <select
                    style={styles.input}
                    value={addWordFolderId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAddWordFolderId(v === "" ? null : parseInt(v, 10));
                    }}
                  >
                    <option value="">-- 선택하세요 --</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.language})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={styles.label}>
                  Language
                  <input
                    style={styles.input}
                    value={addWord.language}
                    onChange={(e) =>
                      handleFormChange("language", e.target.value)
                    }
                  />
                </label>
                <label style={styles.label}>
                  POS
                  <input
                    style={styles.input}
                    value={addWord.pos}
                    onChange={(e) => handleFormChange("pos", e.target.value)}
                  />
                </label>
                <label style={styles.label}>
                  Word
                  <input
                    style={styles.input}
                    value={addWord.word}
                    onChange={(e) => handleFormChange("word", e.target.value)}
                    required
                  />
                </label>
                <label style={styles.label}>
                  Meaning
                  <textarea
                    style={styles.textarea}
                    value={addWord.meaning}
                    onChange={(e) =>
                      handleFormChange("meaning", e.target.value)
                    }
                  />
                </label>
                <label style={styles.inlineLabel}>
                  <input
                    type="checkbox"
                    checked={addWord.learned}
                    onChange={(e) =>
                      handleFormChange("learned", e.target.checked)
                    }
                  />{" "}
                  Learned
                </label>
                <label style={styles.label}>
                  Kundoku
                  <input
                    style={styles.input}
                    value={addWord.kundoku}
                    onChange={(e) =>
                      handleFormChange("kundoku", e.target.value)
                    }
                  />
                </label>
                <label style={styles.label}>
                  Ondoku
                  <input
                    style={styles.input}
                    value={addWord.ondoku}
                    onChange={(e) => handleFormChange("ondoku", e.target.value)}
                  />
                </label>
                <label style={styles.label}>
                  Pronunciation
                  <input
                    style={styles.input}
                    value={addWord.pronunciation}
                    onChange={(e) =>
                      handleFormChange("pronunciation", e.target.value)
                    }
                  />
                </label>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={styles.button}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Folder Modal */}
      {showShareModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowShareModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>현재 폴더를 공유할까요?</h3>
            </div>
            <form onSubmit={submitShareFolder}>
              <div style={{ ...styles.modalBody, gridTemplateColumns: "1fr" }}>
                <div style={styles.label}>
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Name
                  </span>
                  <div
                    style={{
                      ...styles.input,
                      backgroundColor: "#f5f5f5",
                      color: "#333",
                    }}
                  >
                    {shareForm.name || "(empty)"}
                  </div>
                </div>
                <div style={styles.label}>
                  <span style={{ fontWeight: "bold", marginBottom: 6 }}>
                    Language
                  </span>
                  <div
                    style={{
                      ...styles.input,
                      backgroundColor: "#f5f5f5",
                      color: "#333",
                    }}
                  >
                    {shareForm.language}
                  </div>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={styles.button}
                  disabled={shareCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.addButton }}
                  disabled={shareCreating}
                >
                  {shareCreating ? "Creating..." : "Create Shared"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Shared Folder Words Modal */}
      {showViewSharedModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => {
            setShowViewSharedModal(false);
            setShareFolderWords([]);
            setSelectedSharedFolderName(null);
          }}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>{selectedSharedFolderName ?? "Shared Folder"} - Words</h3>
            </div>
            <div style={{ padding: 12 }}>
              {shareFolderWords.length === 0 ? (
                <div style={{ padding: 20, color: "#666" }}>
                  No words in this folder.
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Word</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Meaning
                        </th>
                        <th style={{ padding: 8, textAlign: "left" }}>POS</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Pronunciation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareFolderWords.map((w) => (
                        <tr key={w.id}>
                          <td style={{ padding: 8 }}>{w.word}</td>
                          <td style={{ padding: 8 }}>{w.meaning}</td>
                          <td style={{ padding: 8 }}>{w.pos}</td>
                          <td style={{ padding: 8 }}>{w.pronunciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => {
                  setShowViewSharedModal(false);
                  setShareFolderWords([]);
                  setSelectedSharedFolderName(null);
                }}
                style={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* folder chooser / quick switch (optional) */}
      {folders.length > 0 && (
        <div style={{ margin: "10px 0", textAlign: "left" }}>
          <label style={{ marginRight: 8 }}>Show folder:</label>
          <select
            value={currentFolderId ?? ""}
            onChange={(e) =>
              handleSelectFolderForView(
                e.target.value === "" ? null : parseInt(e.target.value, 10)
              )
            }
          >
            <option value="">-- none --</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
                <th style={{ ...styles.tableHeader, width: "3%" }}>
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={allChecked}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  />
                </th>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={styles.sectionTitle}>Shared Folder</h2>
          <button
            onClick={openShareModal}
            title="Create Shared Folder"
            style={{ ...styles.button, ...styles.addButton }}
          >
            ➕ Create Shared Folder
          </button>
          <button onClick={openMySharedModal} style={{ ...styles.button }}>
            My Shared Folders
          </button>
        </div>
        <div style={styles.folderList}>
          {sharedFolders.map((folder) => (
            <div
              key={
                typeof folder.id === "object" ? folder.id.folderId : folder.id
              }
              style={styles.folderCard}
            >
              <h3 style={styles.folderName}>
                {folder.wordFolder?.name ?? folder.wordFolder.name}
              </h3>
              <p style={styles.folderInfo}>
                Author: {folder.user?.name ?? "unknown"}
              </p>
              <p style={styles.folderInfo}>Created Date: {folder.createDate}</p>
              <p style={styles.folderInfo}>Likes: {folder.likes}</p>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => viewSharedFolderWords(folder)}
                  style={{
                    ...styles.button,
                    backgroundColor: "#6c757d",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => addSharedFolderToMyFolders(folder.wordFolder)}
                  style={{
                    ...styles.button,
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  Add to My Folders
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* My Shared Folders Modal */}
      {showMySharedModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => setShowMySharedModal(false)}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>My Shared Folders</h3>
            </div>
            <div style={{ padding: 12 }}>
              {mySharedFolders.length === 0 ? (
                <div style={{ padding: 12, color: "#666" }}>
                  No shared folders found.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {mySharedFolders.map((sf: SharedFolder) => {
                    const sid = sf.id.folderId;
                    return (
                      <div key={sid} style={styles.folderCard}>
                        <h4 style={{ margin: 0 }}>
                          {sf.wordFolder?.name ??
                            sf.wordFolder?.name ??
                            "Untitled"}
                        </h4>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => deleteMySharedFolder(Number(sid))}
                            style={{ ...styles.button, ...styles.deleteButton }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowMySharedModal(false)}
                style={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Shared Folder Words Modal */}
      {showViewSharedModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => {
            setShowViewSharedModal(false);
            setShareFolderWords([]);
            setSelectedSharedFolderName(null);
          }}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={styles.modalHeader}>
              <h3>{selectedSharedFolderName ?? "Shared Folder"} - Words</h3>
            </div>
            <div style={{ padding: 12 }}>
              {shareFolderWords.length === 0 ? (
                <div style={{ padding: 20, color: "#666" }}>
                  No words in this folder.
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f4f4f4" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>Word</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Meaning
                        </th>
                        <th style={{ padding: 8, textAlign: "left" }}>POS</th>
                        <th style={{ padding: 8, textAlign: "left" }}>
                          Pronunciation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareFolderWords.map((w) => (
                        <tr key={w.id}>
                          <td style={{ padding: 8 }}>{w.word}</td>
                          <td style={{ padding: 8 }}>{w.meaning}</td>
                          <td style={{ padding: 8 }}>{w.pos}</td>
                          <td style={{ padding: 8 }}>{w.pronunciation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => {
                  setShowViewSharedModal(false);
                  setShareFolderWords([]);
                  setSelectedSharedFolderName(null);
                }}
                style={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    backgroundColor: "#03a9fc",
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

  // --- 모달 스타일 ---
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 680,
    maxWidth: "95%",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    padding: 0,
  },
  modalHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
  },
  modalBody: {
    padding: "12px 16px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    maxHeight: 420,
    overflowY: "auto",
  },
  modalFooter: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    borderTop: "1px solid #eee",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#333",
  },
  inlineLabel: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    paddingTop: 6,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 6,
  },
  textarea: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 6,
    minHeight: 60,
    resize: "vertical",
  },
};
