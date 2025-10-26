import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedQuestion } from "@/lib/types";
import { ExperimentSidebar } from "@/components/ExperimentSidebar";
import { ActiveUsers } from "@/components/ActiveUsers";
import { PlaybookCollaborators } from "@/components/PlaybookCollaborators";
import { useAuth } from "@/hooks/useAuth";
import { usePlaybook } from "@/hooks/usePlaybook";
import { ArrowLeft, UserPlus, MoreVertical, Trash2, History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playbook, isLoading, updatePlaybook, updateQuestions } = usePlaybook(id);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const debouncedUpdate = useCallback(
    (content: string) => {
      const timer = setTimeout(() => {
        updatePlaybook({ content });
      }, 500);
      return () => clearTimeout(timer);
    },
    [updatePlaybook]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your AI agent's knowledge base...",
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      debouncedUpdate(html);
    },
  });

  useEffect(() => {
    if (playbook) {
      setTitle(playbook.title);
      setEditorContent(playbook.content);
      if (editor && !editor.isFocused) {
        editor.commands.setContent(playbook.content);
      }
    }
  }, [playbook, editor]);

  useEffect(() => {
    if (!playbook) return;

    const timer = setTimeout(() => {
      updatePlaybook({ title });
    }, 500);

    return () => clearTimeout(timer);
  }, [title, playbook?.id]);

  const handleUpdateQuestions = (questions: SavedQuestion[]) => {
    updateQuestions(questions);
  };

  const handleUpdateDocuments = (docIds: string[]) => {
    // Document selection will be handled separately
    toast.info("Document selection coming soon");
  };

  const handlePreview = () => {
    if (!playbook?.questions || playbook.questions.length === 0) {
      toast.error("No questions to preview. Generate questions first.");
      return;
    }
    setShowPreview(true);
  };

  const handleDeletePlaybook = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("playbooks")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete playbook");
      return;
    }

    toast.success("Playbook deleted successfully");
    navigate('/playbooks');
  };

  const handleViewVersions = () => {
    toast.info("Version history coming soon");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Playbook not found</p>
          <Button onClick={() => navigate('/playbooks')}>Go to Playbooks</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 h-[72px]">
        <div className="max-w-[1800px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none focus-visible:ring-0 px-0 bg-transparent flex-1"
              placeholder="Untitled Plaibook"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <ActiveUsers plaibookId={id!} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCollaborators(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Collaborators
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewVersions}>
                    <History className="h-4 w-4 mr-2" />
                    See Versions
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Playbook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        <ResizablePanel defaultSize={65} minSize={30}>
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <EditorContent editor={editor} className="text-lg" />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="h-full border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">
              <ExperimentSidebar
                plaibook={{
                  ...playbook,
                  content: editorContent || playbook.content
                }}
                onUpdateQuestions={handleUpdateQuestions}
                onUpdateDocuments={handleUpdateDocuments}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{playbook?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {playbook?.questions?.map((question, idx) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm text-muted-foreground">Q{idx + 1}:</span>
                  <p className="font-medium">{question.question}</p>
                </div>
                {question.answer && (
                  <div className="flex items-start gap-2 pl-6">
                    <span className="font-semibold text-sm text-primary">A:</span>
                    <p className="text-sm text-muted-foreground">{question.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborators Dialog */}
      <Dialog open={showCollaborators} onOpenChange={setShowCollaborators}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Collaborators</DialogTitle>
          </DialogHeader>
          <PlaybookCollaborators 
            playbookId={playbook.id}
            ownerId={playbook.user_id}
            onClose={() => setShowCollaborators(false)}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCollaborators(false)}>
              Close
            </Button>
            <Button onClick={() => {
              // The Send functionality is handled inside PlaybookCollaborators
              const sendButton = document.querySelector('[data-send-invite]') as HTMLButtonElement;
              sendButton?.click();
            }}>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{playbook?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaybook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Editor;
