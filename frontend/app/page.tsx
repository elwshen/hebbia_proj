"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Thread {
  id: string;
}

export default function Home() {
  const [threadIds, setThreadIds] = useState<Thread[]>([]);
  const router = useRouter();
  const createNewChat = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then(async (res) => {
        router.push(`/chat/${res.id}`);
      });
  };

  const getAllThreads = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/threads`)
      .then((res) => res.json())
      .then(async (res) => {
        setThreadIds(res);
      });
  };

  useEffect(() => {
    getAllThreads();
  }, []);

  return (
    <>
      {threadIds?.map((threadId) => (
        <div key={`${threadId.id}_thread`}>
          <button
            className="p-2 m-1 bg-slate-200 rounded-xl"
            onClick={() => router.push(`/chat/${threadId.id}`)}
          >
            Thread {threadId.id}
          </button>
        </div>
      ))}
      {/* TODO: chat history */}
      <button className="p-4 bg-lime-200 rounded-xl" onClick={createNewChat}>
        Start a new thread
      </button>
    </>
  );
}
