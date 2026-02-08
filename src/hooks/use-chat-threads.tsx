import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: any;
}

export interface ChatThread {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalHealthMemory {
  conditions: string[];
  insights: string[];
  reportSummaries: string[];
  lifestylePatterns: string[];
  importantDates: { date: string; event: string }[];
  lastUpdated: string;
}

export function useChatThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [globalMemory, setGlobalMemory] = useState<GlobalHealthMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch all threads
  const fetchThreads = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch global health memory
  const fetchGlobalMemory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("health_memory")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      if (data?.health_memory && typeof data.health_memory === "object") {
        const memory = data.health_memory as Record<string, unknown>;
        setGlobalMemory({
          conditions: (memory.conditions as string[]) || [],
          insights: (memory.insights as string[]) || [],
          reportSummaries: (memory.reportSummaries as string[]) || [],
          lifestylePatterns: (memory.lifestylePatterns as string[]) || [],
          importantDates: (memory.importantDates as { date: string; event: string }[]) || [],
          lastUpdated: (memory.lastUpdated as string) || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching global memory:", error);
    }
  }, [user]);

  // Fetch messages for a thread
  const fetchMessages = useCallback(async (threadId: string) => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(
        (data || []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          created_at: m.created_at,
          metadata: m.metadata,
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  // Create a new thread
  const createThread = useCallback(async (title?: string): Promise<ChatThread | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newThread = data as ChatThread;
      setThreads((prev) => [newThread, ...prev]);
      setActiveThread(newThread);
      setMessages([]);
      return newThread;
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to create conversation");
      return null;
    }
  }, [user]);

  // Select a thread
  const selectThread = useCallback(async (thread: ChatThread) => {
    setActiveThread(thread);
    await fetchMessages(thread.id);
  }, [fetchMessages]);

  // Add message to current thread
  const addMessage = useCallback(async (
    content: string,
    role: "user" | "assistant",
    metadata?: any
  ): Promise<ChatMessage | null> => {
    if (!user || !activeThread) return null;

    try {
      const { data, error } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: activeThread.id,
          user_id: user.id,
          role,
          content,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread's updated_at
      await supabase
        .from("ai_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeThread.id);

      const newMessage: ChatMessage = {
        id: data.id,
        role: data.role as "user" | "assistant",
        content: data.content,
        created_at: data.created_at,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  }, [user, activeThread]);

  // Update the last assistant message (for streaming)
  const updateLastMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
      }
      return prev;
    });
  }, []);

  // Update thread title
  const updateThreadTitle = useCallback(async (threadId: string, title: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("ai_conversations")
        .update({ title })
        .eq("id", threadId);

      if (error) throw error;
      
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title } : t))
      );
      if (activeThread?.id === threadId) {
        setActiveThread((prev) => prev ? { ...prev, title } : null);
      }
    } catch (error) {
      console.error("Error updating thread title:", error);
    }
  }, [user, activeThread]);

  // Delete a thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!user) return;

    try {
      // Delete messages first
      await supabase.from("ai_messages").delete().eq("conversation_id", threadId);
      
      // Delete thread
      const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", threadId);

      if (error) throw error;
      
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThread?.id === threadId) {
        setActiveThread(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast.error("Failed to delete conversation");
    }
  }, [user, activeThread]);

  // Update global health memory
  const updateGlobalMemory = useCallback(async (updates: Partial<GlobalHealthMemory>) => {
    if (!user) return;

    try {
      const newMemory = {
        ...globalMemory,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          health_memory: newMemory,
          health_memory_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      setGlobalMemory(newMemory as GlobalHealthMemory);
    } catch (error) {
      console.error("Error updating global memory:", error);
    }
  }, [user, globalMemory]);

  // Add insight to global memory
  const addToGlobalMemory = useCallback(async (
    type: keyof Pick<GlobalHealthMemory, "insights" | "reportSummaries" | "lifestylePatterns">,
    value: string
  ) => {
    if (!globalMemory) {
      await updateGlobalMemory({
        conditions: [],
        insights: type === "insights" ? [value] : [],
        reportSummaries: type === "reportSummaries" ? [value] : [],
        lifestylePatterns: type === "lifestylePatterns" ? [value] : [],
        importantDates: [],
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const current = globalMemory[type] || [];
      // Keep last 50 items max
      const updated = [...current, value].slice(-50);
      await updateGlobalMemory({ [type]: updated });
    }
  }, [globalMemory, updateGlobalMemory]);

  useEffect(() => {
    fetchThreads();
    fetchGlobalMemory();
  }, [fetchThreads, fetchGlobalMemory]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_conversations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchThreads]);

  return {
    threads,
    activeThread,
    messages,
    globalMemory,
    loading,
    loadingMessages,
    createThread,
    selectThread,
    addMessage,
    updateLastMessage,
    updateThreadTitle,
    deleteThread,
    updateGlobalMemory,
    addToGlobalMemory,
    setMessages,
    setActiveThread,
    fetchMessages,
  };
}
