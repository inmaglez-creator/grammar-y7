import { useState, useRef, useEffect } from "react";

const TOPIC_GROUPS = [
  {
    id: "parts_of_speech",
    label: "Parts of Speech",
    icon: "🏷️",
    color: "#7C3AED",
    light: "#F5F3FF",
    description: "Nouns, verbs, adjectives, adverbs & more",
    topics: ["Nouns & pronouns", "Verbs & adverbs", "Adjectives", "Prepositions & conjunctions", "Determiners & articles"],
  },
  {
    id: "sentences",
    label: "Sentences & Clauses",
    icon: "🔗",
    color: "#0369A1",
    light: "#F0F9FF",
    description: "Main clauses, subordinate clauses & sentence types",
    topics: ["Main & subordinate clauses", "Relative clauses", "Simple, compound & complex sentences", "Phrases vs clauses", "Sentence starters & variety"],
  },
  {
    id: "tenses",
    label: "Tenses",
    icon: "⏱️",
    color: "#059669",
    light: "#ECFDF5",
    description: "Present, past, future & perfect tenses",
    topics: ["Simple present & past", "Present & past continuous", "Present perfect", "Future tense", "Tense consistency"],
  },
  {
    id: "punctuation",
    label: "Punctuation",
    icon: "❕",
    color: "#BE185D",
    light: "#FDF2F8",
    description: "Commas, apostrophes, colons, semicolons & more",
    topics: ["Commas (lists & clauses)", "Apostrophes (possession & contraction)", "Colons & semicolons", "Speech marks & dialogue", "Dashes & brackets"],
  },
  {
    id: "voice_mood",
    label: "Voice & Mood",
    icon: "🎭",
    color: "#92400E",
    light: "#FFFBEB",
    description: "Active vs passive voice & subjunctive mood",
    topics: ["Active voice", "Passive voice", "Active vs passive (transforming)", "Subjunctive mood", "Formal vs informal register"],
  },
];

const SYSTEM_PROMPT = `You are a clear, encouraging KS3 Grammar tutor for an 11-year-old entering Year 7 at a British curriculum school.

Your role: teach and practise English grammar through varied, structured exercises. Use British English spelling and terminology always.

Key terminology to use correctly:
- Clause, phrase, subject, object, predicate
- Main clause, subordinate clause, relative clause
- Simple, compound, complex sentences
- Active/passive voice
- British tense names (present perfect, past continuous, etc.)

When generating exercises:
- Always start with a BRIEF, CLEAR explanation of the grammar point (3–4 lines max)
- Then give ONE exercise at a time. After the student answers, give feedback, then the next.
- Mix types: identify, correct the error, transform, fill the gap, write your own
- 💡 Grammar rule reminder at the end

Exercise types (vary them):
1. IDENTIFY: "Underline the [subordinate clause] in this sentence"
2. CORRECT THE ERROR: "Find and fix the grammar mistake"
3. TRANSFORM: "Rewrite in [passive/active/past perfect]"
4. FILL THE GAP: "Complete with the correct form of the verb"
5. WRITE YOUR OWN: "Write a sentence using [grammar feature]"

When correcting:
- ✅ or ❌ per answer
- Explain WHY with the grammar rule, not just the correct answer
- For "write your own" exercises, give constructive feedback on their sentence
- End with one key rule to remember, formatted as: 📌 RULE: ...

Keep explanations accessible — grammar should feel logical, not scary!

IMPORTANT FORMATTING RULE: Never use markdown. No asterisks, no hashtags, no backticks. Plain text only. Use numbered lists and emoji where helpful.`;

export default function GrammarApp() {
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("home");
  const [visitas, setVisitas] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => r.json())
      .then((d) => setVisitas(d.visitas))
      .catch(() => {});
  }, []);

  const startPractice = async (group, topic) => {
    setActiveGroup(group);
    setActiveTopic(topic);
    setMessages([]);
    setMode("chat");
    setLoading(true);

    const initMsg = `Teach and practise: "${topic}" (part of ${group.label}). Start with a brief explanation, then one exercise at a time (start with a single exercise). Student: age 11, entering Y7, British curriculum.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: initMsg }],
        }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.content?.[0]?.text || "Something went wrong." }]);
    } catch {
      setMessages([{ role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
    apiMessages[0] = {
      role: "user",
      content: `Grammar topic: ${activeGroup?.label} — ${activeTopic}\n\n${apiMessages[0].content}`,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content?.[0]?.text || "Something went wrong." }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
    }
    setLoading(false);
  };

  // HOME
  if (mode === "home") return (
    <div style={{ minHeight: "100vh", background: "#F5F3FF", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#3B0764", margin: 0 }}>Grammar Y7</h1>
          <p style={{ color: "#6B7280", marginTop: 6, fontSize: 14 }}>Clauses, tenses, punctuation, voice & more · KS3</p>
        </div>

        {TOPIC_GROUPS.map((group) => (
          <div key={group.id} style={{ background: "#fff", borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: `2px solid ${group.light}` }}>
            <div style={{ background: group.light, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>{group.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: group.color }}>{group.label}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{group.description}</div>
              </div>
            </div>
            <div style={{ padding: "12px 18px 14px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.topics.map(topic => (
                <button key={topic} onClick={() => startPractice(group, topic)} style={{ background: group.color, color: "#fff", border: "none", borderRadius: 18, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{topic}</button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: "#FEF9C3", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#713F12", border: "1.5px solid #FDE68A", marginTop: 8 }}>
          💡 <strong>Grammar tip:</strong> Every sentence needs a subject and a main verb. If it doesn't have both, it's a fragment — not a proper sentence!
        </div>
        {visitas !== null && (
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
            Visitas: {visitas}
          </div>
        )}
      </div>
    </div>
  );

  // CHAT
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: activeGroup.light, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: activeGroup.color, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={() => setMode("home")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{activeGroup.icon} {activeGroup.label}</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>{activeTopic}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 14, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: activeGroup.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>📝</div>
            )}
            <div style={{ background: msg.role === "user" ? activeGroup.color : "#fff", color: msg.role === "user" ? "#fff" : "#1F2937", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", maxWidth: "82%", fontSize: 13.5, lineHeight: 1.65, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: activeGroup.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📝</div>
            <div style={{ background: "#fff", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: activeGroup.color, animation: "bounce 1s infinite", animationDelay: `${i*0.2}s` }} />)}</div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "6px 16px 0", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 6, flexWrap: "wrap", boxSizing: "border-box" }}>
        {["Hint", "More exercises", "Explain the rule again", "Give me a harder one"].map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={{ background: "#fff", color: activeGroup.color, border: `1.5px solid ${activeGroup.color}40`, borderRadius: 14, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>
        ))}
      </div>

      <div style={{ padding: "10px 16px 16px", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8, boxSizing: "border-box" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder="Type your answers here... (Shift+Enter for new line)" rows={2} style={{ flex: 1, border: "2px solid #E5E7EB", borderRadius: 14, padding: "9px 14px", fontSize: 13.5, outline: "none", fontFamily: "inherit", resize: "none" }} onFocus={e => e.target.style.borderColor = activeGroup.color} onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ background: activeGroup.color, color: "#fff", border: "none", borderRadius: "50%", width: 42, height: 42, fontSize: 18, cursor: loading ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.45 : 1, flexShrink: 0, alignSelf: "flex-end" }}>↑</button>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
