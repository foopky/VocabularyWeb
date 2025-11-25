"use client";

import axios from "axios";
import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";

interface SignUpFormData {
  name: string;
  password: string;
  description: string;
  role: number;
}

const styles: Record<string, React.CSSProperties> = {
  // 여기에 위에서 사용한 CSS 스타일 객체 (styles)를 붙여넣으세요.
  // ... (이전에 제공된 styles 객체를 여기에 그대로 붙여넣습니다)
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
  },
  textarea: {
    resize: "vertical",
    minHeight: "80px",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  switchLink: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#0070f3",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default function Page() {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    password: "",
    description: "",
    role: 1,
  });

  // ChangeEvent 타입을 명시하여 타입 안정성 확보
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // FormEvent 타입을 명시하고 event.preventDefault()를 호출
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("회원가입 정보 (TSX):", formData);
    const signup = async () => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_HOST}/api/users`,
          formData
        );
        alert("Sign up completed.");
      } catch (error) {
        console.error("Sign up error: ", error);
        alert("Sign up failed.(already username exist)");
      }
    };
    // TODO: 여기에 실제 회원가입 API 호출 로직을 구현합니다.
    alert("회원가입 시도! (콘솔 확인)");
    signup();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>회원가입 🚀</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="username" style={styles.label}>
            유저 이름
          </label>
          <input
            type="text"
            id="username"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="사용할 이름 입력"
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="비밀번호 입력"
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="description" style={styles.label}>
            설명 (선택)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={{ ...styles.input, ...styles.textarea }}
            placeholder="간단한 자기소개를 입력하세요."
          />
        </div>

        <button type="submit" style={styles.button}>
          가입하기
        </button>
      </form>
      <p style={styles.switchLink}>
        이미 계정이 있으신가요?{" "}
        <Link href="/login" style={styles.link}>
          로그인
        </Link>
      </p>
    </div>
  );
}
