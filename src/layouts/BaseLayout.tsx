import React from "react";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="h-screen p-2 bg-background text-foreground">{children}</main>
    </>
  );
}
