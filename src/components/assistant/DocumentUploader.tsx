import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  FileText,
  Image,
  X,
  Loader2,
  Check,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useMedicalDocuments } from "@/hooks/use-medical-documents";

interface DocumentUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (summary: string) => void;
}

const DocumentUploader = ({ isOpen, onClose, onUploadComplete }: DocumentUploaderProps) => {
  const { uploadDocument, documents, analyzing } = useMedicalDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      setError("Please upload a PDF, image (JPG/PNG), or text file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await uploadDocument(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result?.ai_summary) {
        setTimeout(() => {
          onUploadComplete(result.ai_summary);
          setSelectedFile(null);
          setUploadProgress(0);
          onClose();
        }, 500);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError("Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!acceptedTypes.includes(file.type)) {
        setError("Please upload a PDF, image, or text file");
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Upload Medical Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              selectedFile
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <FileUp className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-foreground">
                    Drop your document here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PDF, JPG, PNG, or TXT (max 10MB)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {uploadProgress < 90
                  ? "Uploading..."
                  : uploadProgress < 100
                  ? "Analyzing document..."
                  : "Complete!"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleUpload}
              disabled={!selectedFile || uploading || analyzing}
            >
              {uploading || analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {analyzing ? "Analyzing..." : "Uploading..."}
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </div>

          {/* Recent Documents */}
          {documents.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                RECENT UPLOADS
              </p>
              <div className="space-y-2">
                {documents.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-sm"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate">{doc.file_name}</span>
                    {doc.ai_summary && (
                      <Check className="h-4 w-4 text-success" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploader;
