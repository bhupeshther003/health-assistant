import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

interface MedicalDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  document_type: string | null;
  ai_summary: string | null;
  ai_extracted_data: any;
  uploaded_at: string;
  processed_at: string | null;
}

interface AnalysisResult {
  summary: string;
  extractedData: {
    medicines: Array<{
      name: string;
      dosage: string;
      frequency: string;
      instructions?: string;
    }>;
    diagnoses: string[];
    labValues: Array<{
      name: string;
      value: string;
      unit: string;
      status: string;
    }>;
    recommendations: string[];
    doctorNotes: string;
  };
  suggestedReminders: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    times: string[];
    instructions: string;
  }>;
}

export function useMedicalDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("medical_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    file: File,
    documentType: string = "general"
  ): Promise<MedicalDocument | null> => {
    if (!user) {
      toast.error("Please login to upload documents");
      return null;
    }

    setUploading(true);
    setAnalyzing(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from("medical_documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          document_type: documentType,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Read file content for analysis
      let documentContent = "";
      if (file.type.startsWith("text/") || file.type === "application/pdf") {
        documentContent = await file.text();
      } else if (file.type.startsWith("image/")) {
        // For images, we'll send a base64 representation
        documentContent = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Analyze document
      const analysisResult = await analyzeDocument(
        docData.id,
        documentContent,
        documentType,
        file.name
      );

      // Refresh to get updated document with AI summary
      await fetchDocuments();
      
      // Get the updated document
      const { data: updatedDoc } = await supabase
        .from("medical_documents")
        .select("*")
        .eq("id", docData.id)
        .single();

      toast.success("Document uploaded and analyzed");
      return updatedDoc || docData;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
      return null;
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const analyzeDocument = async (
    documentId: string,
    documentContent: string,
    documentType: string,
    fileName: string
  ): Promise<AnalysisResult | null> => {
    if (!user) return null;

    setAnalyzing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId,
            documentContent,
            documentType,
            fileName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const result = await response.json();

      // Refresh documents to get updated AI summary
      await fetchDocuments();

      toast.success("Document analyzed successfully");
      return result;
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("medical-documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting document URL:", error);
      return null;
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from("medical-documents").remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("medical_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  return {
    documents,
    loading,
    uploading,
    analyzing,
    uploadDocument,
    analyzeDocument,
    getDocumentUrl,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}
