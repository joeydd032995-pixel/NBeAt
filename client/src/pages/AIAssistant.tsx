import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, User, Bot, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextData {
  type: "player" | "team" | "bet" | "stat";
  value: string;
  label: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your NBA betting assistant. I can help you analyze players, teams, betting odds, and statistics. Add context data below or just ask me anything!"
    }
  ]);
  const [input, setInput] = useState("");
  const [contextData, setContextData] = useState<ContextData[]>([]);
  const [newContext, setNewContext] = useState<Partial<ContextData>>({ type: "player" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch data for context suggestions
  const { data: liveOdds } = trpc.odds.getNBAOdds.useQuery();

  const chatMutation = trpc.ai.chat.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addContext = () => {
    if (newContext.value && newContext.label) {
      setContextData([
        ...contextData,
        {
          type: newContext.type || "player",
          value: newContext.value,
          label: newContext.label
        }
      ]);
      setNewContext({ type: "player" });
    }
  };

  const removeContext = (index: number) => {
    setContextData(contextData.filter((_, i) => i !== index));
  };

  const buildContextString = (): string => {
    if (contextData.length === 0) return "";
    
    let contextStr = "\n\nContext data:\n";
    for (const ctx of contextData) {
      contextStr += `- ${ctx.type.toUpperCase()}: ${ctx.label} (${ctx.value})\n`;
    }
    return contextStr;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input + buildContextString();
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input }
    ];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        messages: newMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        })),
        context: contextData.map(c => `${c.type}: ${c.label}`)
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: response.message }
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-primary neon-glow-pink mb-2">AI BETTING ASSISTANT</h1>
          <p className="text-muted-foreground mb-8">Get AI-powered insights with access to all platform data</p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Context Panel */}
            <div className="lg:col-span-1">
              <Card className="bg-card/50 backdrop-blur sticky top-8">
                <CardHeader>
                  <CardTitle className="text-secondary text-sm">Context Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Context Form */}
                  <div className="space-y-3">
                    <Select
                      value={newContext.type}
                      onValueChange={(value: any) => setNewContext({ ...newContext, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="bet">Bet</SelectItem>
                        <SelectItem value="stat">Stat</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Label (e.g., LeBron James)"
                      value={newContext.label || ""}
                      onChange={(e) => setNewContext({ ...newContext, label: e.target.value })}
                    />

                    <Input
                      placeholder="Value (e.g., 34.7 PPG)"
                      value={newContext.value || ""}
                      onChange={(e) => setNewContext({ ...newContext, value: e.target.value })}
                    />

                    <Button onClick={addContext} size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Context
                    </Button>
                  </div>

                  {/* Context List */}
                  {contextData.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      {contextData.map((ctx, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-2 bg-background/50 rounded border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-accent uppercase">
                              {ctx.type}
                            </div>
                            <div className="text-sm truncate">{ctx.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {ctx.value}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContext(idx)}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {contextData.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No context data added yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-3">
              <Card className="bg-card/50 backdrop-blur h-[calc(100vh-16rem)] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-primary">Chat</CardTitle>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/20 text-foreground"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <Streamdown>{message.content}</Streamdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about players, teams, odds, or betting strategies..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || chatMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {contextData.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {contextData.length} context item(s) will be included with your message
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
