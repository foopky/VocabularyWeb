// app/wordbook/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WordbookClient from "./WordbookClient";

export default async function Page() {
  // 서버에서 쿠키 읽기
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;
  const userId = cookieStore.get("userId")?.value;

  console.log("Server - authToken:", authToken);
  console.log("Server - userId:", userId);

  // 인증 체크 (선택사항)
  if (!authToken || !userId) {
    redirect("/login"); // 로그인 페이지로 리다이렉트
  }

  // 클라이언트 컴포넌트에 props 전달
  return <WordbookClient authToken={authToken} userId={userId} />;
}
