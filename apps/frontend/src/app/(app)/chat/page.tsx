"use client";

import { ArrowUp, Bot, Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_CHAT } from "@/lib/mock";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Find fintech startups in Europe",
  "Generate 100 qualified leads",
  "Show me everything above 85",
  "Prepare outreach for the top 20",
];

/**
 * The supervisor's work, made visible. A chat that only streams prose hides
 * which agents ran; this is how the user knows research happened before a score.
 */
function AgentTrace({ outputs }: { outputs: NonNullable<ChatMessage["agent_outputs"]> }) {
  return (
    <ul className="mb-3 space-y-1.5">
      {outputs.map((output) => (
        <li key={output.agent} className="flex items-center gap-2 text-xs">
          {output.status === "done" ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          <span className="font-medium">{output.agent} Agent</span>
          {output.detail && <span className="text-muted-foreground">{output.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const messages = MOCK_CHAT;

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="bg-muted max-w-lg rounded-2xl px-4 py-2.5 text-sm">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <div className="bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-full">
                  <Bot className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {message.agent_outputs && <AgentTrace outputs={message.agent_outputs} />}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AgentSDR to find, research, qualify or write…"
              className="max-h-48 min-h-20 resize-none pr-12"
            />
            <Button size="icon" className="absolute right-2 bottom-2 size-8" disabled={!input}>
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Chat is wired in Phase 4. Messages here are a preview.
          </p>
        </div>
      </div>
    </div>
  );
}
