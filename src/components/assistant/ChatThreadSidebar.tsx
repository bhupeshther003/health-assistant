import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  X,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatThread } from "@/hooks/use-chat-threads";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";

interface ChatThreadSidebarProps {
  threads: ChatThread[];
  activeThread: ChatThread | null;
  onSelectThread: (thread: ChatThread) => void;
  onCreateThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onUpdateTitle: (threadId: string, title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatThreadSidebar = ({
  threads,
  activeThread,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onUpdateTitle,
  isOpen,
  onToggle,
}: ChatThreadSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const groupThreadsByDate = (threads: ChatThread[]) => {
    const groups: { label: string; threads: ChatThread[] }[] = [];
    const today: ChatThread[] = [];
    const yesterday: ChatThread[] = [];
    const thisWeek: ChatThread[] = [];
    const older: ChatThread[] = [];

    threads.forEach((thread) => {
      const date = new Date(thread.updated_at);
      if (isToday(date)) {
        today.push(thread);
      } else if (isYesterday(date)) {
        yesterday.push(thread);
      } else if (isThisWeek(date)) {
        thisWeek.push(thread);
      } else {
        older.push(thread);
      }
    });

    if (today.length > 0) groups.push({ label: "Today", threads: today });
    if (yesterday.length > 0) groups.push({ label: "Yesterday", threads: yesterday });
    if (thisWeek.length > 0) groups.push({ label: "This Week", threads: thisWeek });
    if (older.length > 0) groups.push({ label: "Older", threads: older });

    return groups;
  };

  const handleStartEdit = (thread: ChatThread) => {
    setEditingId(thread.id);
    setEditTitle(thread.title || "");
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const groupedThreads = groupThreadsByDate(threads);

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-20 z-40 h-8 w-8 rounded-full bg-card shadow-md lg:hidden"
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <History className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={onToggle}
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 border-r border-border bg-card shadow-xl lg:top-0 lg:h-screen lg:shadow-none"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Conversations</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={onCreateThread}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={onToggle}
                      className="lg:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Thread List */}
                <ScrollArea className="flex-1 p-2">
                  {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={onCreateThread}
                        className="mt-2"
                      >
                        Start a new chat
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedThreads.map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                            {group.label}
                          </p>
                          <div className="space-y-1">
                            {group.threads.map((thread) => (
                              <motion.div
                                key={thread.id}
                                layout
                                className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                                  activeThread?.id === thread.id
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                }`}
                              >
                                {editingId === thread.id ? (
                                  <div className="flex flex-1 items-center gap-1">
                                    <Input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="h-7 text-sm"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit();
                                        if (e.key === "Escape") handleCancelEdit();
                                      }}
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={handleSaveEdit}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      className="flex-1 truncate text-left text-sm"
                                      onClick={() => onSelectThread(thread)}
                                    >
                                      {thread.title || "Untitled Chat"}
                                    </button>
                                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEdit(thread);
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteThread(thread.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Footer */}
                <div className="border-t border-border p-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={onCreateThread}
                  >
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop toggle */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-20 z-40 hidden h-10 w-10 rounded-full bg-card shadow-md lg:flex"
          onClick={onToggle}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};

export default ChatThreadSidebar;
