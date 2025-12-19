import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Send, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function BettingChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI betting strategy advisor. I can help you with:\n\n- **Kelly Criterion** calculations and optimal bet sizing\n- **Expected Value (EV)** analysis\n- **Bankroll management** strategies\n- **NBA player statistics** and trends\n- **Parlay construction** and probability math\n- **Risk management** and fractional Kelly multipliers\n\nWhat would you like to know about NBA betting?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: (data) => {
      const responseContent = typeof data.response === 'string' ? data.response : String(data.response);
      setMessages((prev) => [...prev, { role: "assistant" as const, content: responseContent }]);
    },
    onError: () => {
      toast.error("Failed to get response. Please try again.");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Send to API
    chatMutation.mutate({
      message: userMessage,
      conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              AI BETTING ASSISTANT
            </h1>
            <p className="text-lg text-muted-foreground">
              LLM-powered chatbot for strategy advice and personalized recommendations
            </p>
          </div>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Betting Strategy Advisor
              </CardTitle>
              <CardDescription>
                Ask me anything about Kelly Criterion, EV calculations, bankroll management, or NBA betting strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages Container */}
              <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto pr-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
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
                      className={`rounded-lg px-4 py-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Streamdown>{message.content}</Streamdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-secondary" />
                      </div>
                    )}
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="rounded-lg px-4 py-3 bg-muted">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Input
                  placeholder="Ask about betting strategies, Kelly criterion, EV calculations..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={chatMutation.isPending || !input.trim()}
                  className="px-6"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className="bg-card/30 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setInput("Explain the Kelly Criterion and how to use it for bet sizing")}
            >
              <CardHeader>
                <CardTitle className="text-sm">What is Kelly Criterion?</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className="bg-card/30 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setInput("How do I calculate expected value for a bet?")}
            >
              <CardHeader>
                <CardTitle className="text-sm">How to calculate EV?</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className="bg-card/30 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setInput("What's a safe bankroll management strategy for NBA betting?")}
            >
              <CardHeader>
                <CardTitle className="text-sm">Bankroll management tips?</CardTitle>
              </CardHeader>
            </Card>
            <Card
              className="bg-card/30 backdrop-blur cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setInput("Should I use full Kelly or fractional Kelly? What's the difference?")}
            >
              <CardHeader>
                <CardTitle className="text-sm">Full vs Fractional Kelly?</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
