import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  Heart,
  Dumbbell,
  Apple,
  Moon,
  Hospital,
  UtensilsCrossed,
  ExternalLink,
  Youtube,
  Navigation,
  RefreshCw,
  FileUp,
  Calendar,
  Pill,
  Download,
  Plus,
  History,
   X,
   PanelLeftClose,
} from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useChatThreads } from "@/hooks/use-chat-threads";
import ReactMarkdown from "react-markdown";
import ChatThreadSidebar from "@/components/assistant/ChatThreadSidebar";
import DocumentUploader from "@/components/assistant/DocumentUploader";
import HealthPlanDialog from "@/components/assistant/HealthPlanDialog";
import MedicineReminderDialog from "@/components/assistant/MedicineReminderDialog";
 import GlobalAlarmOverlay from "@/components/dashboard/GlobalAlarmOverlay";

const quickActions = [
  { icon: Heart, label: "Check heart health", prompt: "Based on my profile and recent data, how is my heart health?" },
  { icon: Dumbbell, label: "Exercise plan", prompt: "What exercises would you recommend for me based on my health conditions?" },
  { icon: Apple, label: "Diet tips", prompt: "Can you give me personalized diet tips based on my health data?" },
  { icon: Moon, label: "Sleep advice", prompt: "How can I improve my sleep quality based on my wellness data?" },
  { icon: Hospital, label: "Find clinic", prompt: "Find nearby clinic for my health needs" },
  { icon: UtensilsCrossed, label: "Healthy recipes", prompt: "Suggest healthy recipes suitable for my dietary preferences with YouTube links" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-assistant`;

const Assistant = () => {
  const navigate = useNavigate();
  const { location, startTracking } = useGeoLocation();
  const { user, session, profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    threads,
    activeThread,
    messages,
    loading: threadsLoading,
    loadingMessages,
    createThread,
    selectThread,
    addMessage,
    updateLastMessage,
    updateThreadTitle,
    deleteThread,
    setMessages,
    addToGlobalMemory,
  } = useChatThreads();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDocUploader, setShowDocUploader] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  useEffect(() => {
    startTracking();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-create first thread and show greeting
  useEffect(() => {
    if (profile && !activeThread && !threadsLoading && threads.length === 0) {
      createThread("New Chat").then((thread) => {
        if (thread) {
          const greeting = `Hello${profile.first_name ? ` ${profile.first_name}` : ""}! 👋 I'm your personal health AI assistant.

I have access to your complete health profile and can help you with:
- 📄 **Analyze medical reports** - Upload PDFs, images, or prescriptions
- 📋 **Create health plans** - 7, 14, or 30-day personalized plans
- 💊 **Set medicine reminders** - Alarm-style alerts until you acknowledge
- 🏥 **Find nearby clinics** with directions
- 🍽️ **Healthy recipes** with video tutorials
- 🏋️ **Exercise plans** safe for your conditions

How can I help you today?`;

          setMessages([{
            id: "initial",
            role: "assistant",
            content: greeting,
            created_at: new Date().toISOString(),
          }]);
        }
      });
    } else if (profile && activeThread && messages.length === 0) {
      // Show greeting for existing empty thread
      const greeting = `Welcome back${profile.first_name ? `, ${profile.first_name}` : ""}! How can I help you today?`;
      setMessages([{
        id: "initial",
        role: "assistant",
        content: greeting,
        created_at: new Date().toISOString(),
      }]);
    }
  }, [profile, activeThread, threadsLoading, threads.length]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !session || !activeThread) return;

    // Add user message to local state immediately
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Save user message to DB
    await addMessage(content.trim(), "user");

    // Build conversation history
    const conversationHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          conversationId: activeThread.id,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast({ title: "Rate limit exceeded", description: "Please wait a moment.", variant: "destructive" });
        } else if (response.status === 402) {
          toast({ title: "Credits exhausted", description: "AI credits used up.", variant: "destructive" });
        } else {
          throw new Error(errorData.error || "Failed to get response");
        }
        setIsTyping(false);
        return;
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "", created_at: new Date().toISOString() },
      ]);
      setIsTyping(false);

      if (reader) {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Save assistant message to DB
      if (assistantContent) {
        await addMessage(assistantContent, "assistant");

        // Update thread title if it's the first real conversation
        if (messages.length <= 2 && content.length > 5) {
          const title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
          updateThreadTitle(activeThread.id, title);
        }
      }
    } catch (error) {
      console.error("AI error:", error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleNewChat = async () => {
    const thread = await createThread();
    if (thread) {
      setSidebarOpen(false);
    }
  };

   const handleCloseConversation = () => {
     setSidebarOpen(true);
   };
 
  const handleDocumentUploaded = (summary: string) => {
    // Add AI response about the uploaded document
    const response = `📄 **Document Analyzed Successfully!**\n\n${summary}\n\nI've saved this information to your health profile. Feel free to ask me any questions about this report or how it relates to your health.`;
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "assistant", content: response, created_at: new Date().toISOString() },
    ]);
    
    // Add to global memory
    addToGlobalMemory("reportSummaries", summary);
  };

  const handlePlanGenerated = (summary: string) => {
    const response = `📋 **Health Plan Created!**\n\n${summary}\n\nYou can download this plan as a PDF anytime. Would you like me to explain any part of the plan in detail?`;
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "assistant", content: response, created_at: new Date().toISOString() },
    ]);
  };

  const handleReminderCreated = (message: string) => {
    const response = `💊 **Reminder Set!**\n\n${message}\n\nI'll make sure you don't miss your medicine. The alarm will repeat until you acknowledge it.`;
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "assistant", content: response, created_at: new Date().toISOString() },
    ]);
  };

  const getLinkIcon = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return <Youtube className="h-4 w-4" />;
    if (url.includes("maps.google") || url.includes("goo.gl/maps")) return <Navigation className="h-4 w-4" />;
    return <ExternalLink className="h-4 w-4" />;
  };

  const getLinkColor = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "text-red-500 hover:text-red-600";
    if (url.includes("maps.google") || url.includes("goo.gl/maps")) return "text-green-500 hover:text-green-600";
    return "text-primary hover:text-primary/80";
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Please log in to use the AI assistant.</p>
          <Button onClick={() => navigate("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Alarm Notification Overlay */}
       <GlobalAlarmOverlay />

      {/* Chat Thread Sidebar */}
      <ChatThreadSidebar
        threads={threads}
        activeThread={activeThread}
        onSelectThread={selectThread}
        onCreateThread={handleNewChat}
        onDeleteThread={deleteThread}
        onUpdateTitle={updateThreadTitle}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setSidebarOpen(!sidebarOpen)} 
             className="lg:hidden"
             title={sidebarOpen ? "Close conversations" : "View conversations"}
           >
             {sidebarOpen ? <X className="h-5 w-5" /> : <History className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" asChild className="hidden lg:flex">
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">AI Health Assistant</span>
              <p className="text-xs text-muted-foreground">
                {activeThread?.title || "New Chat"}
              </p>
            </div>
          </div>
           <div className="ml-auto flex items-center gap-2">
             {location && (
               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                 <Navigation className="h-3 w-3" />
                 {location.city || "Tracking..."}
               </div>
             )}
             {activeThread && (
               <Button 
                 variant="outline" 
                 size="sm"
                 className="gap-1 hidden sm:flex"
                 onClick={handleCloseConversation}
               >
                 <PanelLeftClose className="h-4 w-4" />
                 Conversations
               </Button>
             )}
           </div>
        </div>
      </header>

      {/* Messages */}
      <main className={`flex-1 overflow-y-auto pb-44 lg:pb-36 ${sidebarOpen ? "lg:ml-72" : ""}`}>
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === "user" ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-foreground" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 underline ${getLinkColor(href || "")}`}
                              >
                                {children}
                                {getLinkIcon(href || "")}
                              </a>
                            ),
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <p className="mt-2 text-xs opacity-60">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick Actions - show when few messages */}
      {messages.length <= 2 && (
        <div className={`fixed bottom-44 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-8 lg:bottom-36 ${sidebarOpen ? "lg:ml-72" : ""}`}>
          <div className="container mx-auto max-w-3xl px-4">
            <p className="mb-3 text-sm text-muted-foreground">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(action.prompt)}
                  className="gap-2"
                  disabled={isTyping}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className={`fixed bottom-24 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-2 lg:bottom-16 ${sidebarOpen ? "lg:ml-72" : ""}`}>
        <div className="container mx-auto max-w-3xl flex items-center gap-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setShowDocUploader(true)}
          >
            <FileUp className="h-4 w-4" />
            Upload Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setShowPlanDialog(true)}
          >
            <Calendar className="h-4 w-4" />
            Health Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setShowReminderDialog(true)}
          >
            <Pill className="h-4 w-4" />
            Medicine Reminder
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className={`fixed bottom-20 left-0 right-0 z-20 border-t border-border bg-card p-4 lg:bottom-0 ${sidebarOpen ? "lg:ml-72" : ""}`}>
        <form onSubmit={handleSubmit} className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about health, reports, recipes, exercises..."
              className="flex-1"
              disabled={isTyping || !activeThread}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping || !activeThread}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Dialogs */}
      <DocumentUploader
        isOpen={showDocUploader}
        onClose={() => setShowDocUploader(false)}
        onUploadComplete={handleDocumentUploaded}
      />
      <HealthPlanDialog
        isOpen={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        onPlanGenerated={handlePlanGenerated}
      />
      <MedicineReminderDialog
        isOpen={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
        onReminderCreated={handleReminderCreated}
      />

      <MobileNav />
    </div>
  );
};

export default Assistant;
