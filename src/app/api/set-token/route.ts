// app/api/set-token/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { jwt, userId } = await request.json();

  if (!jwt || !userId) {
    return NextResponse.json(
      { message: "Token or User ID is missing." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();

  // authToken 설정
  cookieStore.set("authToken", jwt, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });

  // userId 설정 (문자열로 변환)
  cookieStore.set("userId", String(userId), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({
    success: true,
    message: "Token set successfully.",
  });
}
