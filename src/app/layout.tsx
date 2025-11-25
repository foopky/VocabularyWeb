// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "AI 단어장",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-black m-[40px]">{children}</body>
    </html>
  );
}
