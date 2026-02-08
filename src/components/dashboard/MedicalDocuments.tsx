import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  X,
  File,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Brain,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMedicalDocuments } from "@/hooks/use-medical-documents";
import { useMedicineReminders } from "@/hooks/use-medicine-reminders";
import { toast } from "sonner";

interface MedicalDocumentsProps {
  onAnalysisComplete?: (result: any) => void;
}

const documentTypes = [
  { value: "prescription", label: "Prescription" },
  { value: "lab_report", label: "Lab Report" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "imaging", label: "Imaging/X-Ray" },
  { value: "other", label: "Other" },
];

const MedicalDocuments = ({ onAnalysisComplete }: MedicalDocumentsProps) => {
  const {
    documents,
    loading,
    uploading,
    analyzing,
    uploadDocument,
    analyzeDocument,
    getDocumentUrl,
    deleteDocument,
  } = useMedicalDocuments();
  const { createReminder } = useMedicineReminders();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("prescription");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a PDF, image, or text file");
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const doc = await uploadDocument(selectedFile, selectedType);
    if (doc) {
      setSelectedFile(null);
      setIsUploadOpen(false);

      // Auto-analyze text files
      if (selectedFile.type === "text/plain") {
        const text = await selectedFile.text();
        const result = await analyzeDocument(doc.id, text, selectedType, selectedFile.name);
        if (result) {
          setAnalysisResult(result);
          onAnalysisComplete?.(result);
        }
      }
    }
  };

  const handleAnalyze = async (doc: any) => {
    // For images and PDFs, we'd need OCR or PDF parsing
    // For now, we'll prompt the user to provide text content
    const text = prompt("Please paste the text content from this document for AI analysis:");
    if (text) {
      const result = await analyzeDocument(doc.id, text, doc.document_type, doc.file_name);
      if (result) {
        setAnalysisResult(result);
        onAnalysisComplete?.(result);
      }
    }
  };

  const handleCreateReminders = async (suggestedReminders: any[]) => {
    for (const reminder of suggestedReminders) {
      await createReminder({
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        frequency: reminder.frequency as any,
        timesOfDay: reminder.times,
        instructions: reminder.instructions,
      });
    }
    toast.success(`${suggestedReminders.length} reminders created from document`);
    setAnalysisResult(null);
  };

  const handleView = async (doc: any) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    return FileText;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Medical Documents
          </h2>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Medical Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Document Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-2">
                    <File className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      Click to upload or drag and drop
                      <br />
                      PDF, Images, or Text files (max 10MB)
                    </p>
                  </>
                )}
              </div>

              <Button
                className="w-full"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
          <p className="text-xs text-muted-foreground">
            Upload prescriptions, lab reports, or medical records
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.file_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{doc.document_type?.replace("_", " ")}</span>
                    {doc.processed_at && (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-3 w-3" />
                        Analyzed
                      </span>
                    )}
                  </div>
                  {doc.ai_summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {doc.ai_summary}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleView(doc)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!doc.processed_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAnalyze(doc)}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDocument(doc.id, doc.file_path)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Analysis Result Dialog */}
      <AnimatePresence>
        {analysisResult && (
          <Dialog open={!!analysisResult} onOpenChange={() => setAnalysisResult(null)}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Document Analysis</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-1 font-medium">Summary</h4>
                  <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                </div>

                {analysisResult.extractedData?.medicines?.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">Medicines</h4>
                    <div className="space-y-1">
                      {analysisResult.extractedData.medicines.map((med: any, i: number) => (
                        <div key={i} className="rounded-lg bg-muted/50 p-2 text-sm">
                          <span className="font-medium">{med.name}</span>
                          {med.dosage && <span> - {med.dosage}</span>}
                          {med.frequency && (
                            <span className="text-muted-foreground"> ({med.frequency})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.extractedData?.diagnoses?.length > 0 && (
                  <div>
                    <h4 className="mb-1 font-medium">Diagnoses</h4>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {analysisResult.extractedData.diagnoses.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.suggestedReminders?.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-medium">Suggested Medicine Reminders</h4>
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleCreateReminders(analysisResult.suggestedReminders)}
                    >
                      <Pill className="h-4 w-4" />
                      Create {analysisResult.suggestedReminders.length} Reminders
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalDocuments;
