"use client";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMessagesBoxHeight } from "@/app/useMessagesBoxHeight";
import { ContextDialog } from "@/app/components/ContextDialog";

enum Role {
  HUMAN,
  AI,
}

interface Message {
  role: Role;
  content: string;
  source?: AnswerSource;
}

interface AnswerSource {
  title: string;
  text: string;
}

export default function Chatbot({ params }: { params: { id: string } }) {
  useMessagesBoxHeight();
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [AITyping, setAITyping] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogContent, setDialogContent] = useState<string>("");
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const threadId = params.id;

  const getMessageHistory = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${threadId}`)
      .then((res) => res.json())
      .then(async (res) => {
        console.log(res);
        setMessages(
          res.map((messageInfo: any) => {
            return {
              role: messageInfo.sender == 0 ? Role.HUMAN : Role.AI,
              content: messageInfo.content,
            };
          })
        );
      });
  };

  useEffect(() => {
    getMessageHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input;
    setAITyping(true);
    setInput("");
    setMessages(messages.concat([{ role: Role.HUMAN, content: query }]));

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${threadId}/${query}`
      )
        .then((res) => res.json())
        .then(async (res) => {
          console.log(res);
          let source = undefined;
          if (
            res.intermediate_steps.length > 0 &&
            res.intermediate_steps[0].length > 1
          ) {
            let info = res.intermediate_steps[0][1];
            console.log(info);
            source = { title: info.title, text: info["_highlightResult"].text.value };
          }
          setMessages(
            messages.concat([
              { role: Role.HUMAN, content: query },
              { role: Role.AI, content: res.output, source: source },
            ])
          );
          setAITyping(false);
        });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="messages" id="messages-box">
        <ContextDialog open={dialogOpen} content={dialogContent} title={dialogTitle} onClose={() => setDialogOpen(false)}/>
        {messages.map((message, index) => (
          <div
            className={`message-bubble ${
              message.role == Role.AI ? "ai-message-bubble" : null
            }`}
            key={`${index}_message`}
          >
            {message.content}
            {message.source && (
              <div>
                <button className="p-2 m-1 bg-lime-200 rounded-xl"
                  onClick={() => {
                    setDialogOpen(true);
                    setDialogContent(message.source!.text);
                    setDialogTitle(message.source!.title);
                  }}
                >See context</button>
              </div>
            )}
          </div>
        ))}
        {AITyping ? (
          <div className="dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        ) : null}
      </div>
      <div id="chat-field" className="chat-field">
        <form onSubmit={handleSubmit}>
          <input
            autoComplete="off"
            placeholder="Message"
            className="chat-field-input"
            type="text"
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            disabled={input.length == 0}
            className="send-chat-button"
            type="submit"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
