import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { File, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DocumentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocIds: string[];
  onSelectDocuments: (docIds: string[]) => void;
}

interface SyncedFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  synced_at: string;
  content: string;
}

export function DocumentSelector({ 
  open, 
  onOpenChange, 
  selectedDocIds, 
  onSelectDocuments 
}: DocumentSelectorProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SyncedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedDocIds);

  useEffect(() => {
    if (open && user) {
      loadDocuments();
    }
    setTempSelected(selectedDocIds);
  }, [open, user, selectedDocIds]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('synced_files')
        .select('*')
        .eq('user_id', user!.id)
        .order('synced_at', { ascending: false });

      if (error) throw error;

      // Filter for documents with content
      const docsWithContent = (data || []).filter(doc => 
        doc.content && doc.content.trim().length > 0
      );

      setDocuments(docsWithContent);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const toggleDocument = (docId: string) => {
    setTempSelected(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSave = () => {
    onSelectDocuments(tempSelected);
    onOpenChange(false);
    toast.success(`${tempSelected.length} document(s) selected`);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('text') || fileType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Documents</DialogTitle>
          <DialogDescription>
            Choose documents from your inventory to use as knowledge base
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No documents with content found in your inventory
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Sync documents from your cloud providers first
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleDocument(doc.id)}
                  >
                    <Checkbox
                      checked={tempSelected.includes(doc.id)}
                      onCheckedChange={() => toggleDocument(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getFileIcon(doc.file_type)}
                        <span className="font-medium text-sm truncate">
                          {doc.file_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(doc.file_size)}
                        </Badge>
                        <span>•</span>
                        <span>
                          {new Date(doc.synced_at).toLocaleDateString()}
                        </span>
                        {doc.content && (
                          <>
                            <span>•</span>
                            <span>{doc.content.length} chars</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {tempSelected.length} document(s) selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Selection
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}