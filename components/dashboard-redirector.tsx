"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardRedirector() {
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("nuru_userId");
    if (storedUserId) {
      router.replace(`/dashboard?userId=${storedUserId}`);
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      <p>Loading your dashboard...</p>
    </div>
  );
}
