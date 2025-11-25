export interface User {
  id: number;
  name: string;
  password: string;
  role: string;
  description: string;
}

export interface WordEntry {
  id: number;
  language: string;
  pos: string;
  word: string;
  meaning: string;
  learned: boolean;
  kundoku: string;
  ondoku: string;
  pronunciation: string;
  example: string;
}

export interface WordInput {
  language: string;
  pos: string;
  word: string;
  meaning: string;
  learned: boolean;
  kundoku: string;
  ondoku: string;
  pronunciation: string;
  example: string;
}

// 🗂️ 공유 폴더 데이터 타입을 정의합니다.
export interface SharedFolder {
  id: {
    userId: number;
    folderId: number;
  };
  user: User;
  wordFolder: WordFolder;
  createDate: string;
  likes: number;
}

export interface WordbookClientProps {
  authToken: string;
  userId: string;
}

export interface WordFolder {
  id: number;
  user: User;
  name: string;
  language: string;
}
