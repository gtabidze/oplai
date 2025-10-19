import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Share2, Copy, Check, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface PlaybookCollaboratorsProps {
  playbookId: string;
  ownerId: string;
}

export const PlaybookCollaborators = ({ playbookId, ownerId }: PlaybookCollaboratorsProps) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState("");

  const isOwner = user?.id === ownerId;

  useEffect(() => {
    loadCollaborators();
    loadShareLink();

    // Subscribe to collaborator changes
    const channel = supabase
      .channel(`playbook-collaborators-${playbookId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playbook_collaborators',
          filter: `playbook_id=eq.${playbookId}`
        },
        () => {
          loadCollaborators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playbookId]);

  const loadCollaborators = async () => {
    const { data, error } = await supabase
      .from('playbook_collaborators')
      .select('id, user_id, role')
      .eq('playbook_id', playbookId);

    if (error) {
      console.error('Error loading collaborators:', error);
      return;
    }

    if (!data) {
      setCollaborators([]);
      return;
    }

    // Fetch profiles separately
    const userIds = data.map(c => c.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const collaboratorsWithProfiles = data.map(collab => ({
      ...collab,
      profiles: profilesData?.find(p => p.id === collab.user_id) || null
    }));

    setCollaborators(collaboratorsWithProfiles);
  };

  const loadShareLink = async () => {
    if (!isOwner) return;

    const { data, error } = await supabase
      .from('playbook_shares')
      .select('token')
      .eq('playbook_id', playbookId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error loading share link:', error);
      return;
    }

    if (data) {
      setShareLink(`${window.location.origin}/join/${data.token}`);
    }
  };

  const generateShareLink = async () => {
    const { data, error } = await supabase
      .from('playbook_shares')
      .insert({
        playbook_id: playbookId,
        created_by: user!.id
      })
      .select('token')
      .single();

    if (error) {
      toast.error('Failed to generate share link');
      console.error(error);
      return;
    }

    const link = `${window.location.origin}/join/${data.token}`;
    setShareLink(link);
    toast.success('Share link generated');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const addCollaboratorByEmail = async () => {
    if (!emailToAdd.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Find user by email
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailToAdd.trim())
      .single();

    if (searchError || !profiles) {
      toast.error('User not found');
      return;
    }

    // Add as collaborator
    const { error: addError } = await supabase
      .from('playbook_collaborators')
      .insert({
        playbook_id: playbookId,
        user_id: profiles.id,
        role: 'editor'
      });

    if (addError) {
      if (addError.code === '23505') {
        toast.error('User is already a collaborator');
      } else {
        toast.error('Failed to add collaborator');
      }
      console.error(addError);
      return;
    }

    toast.success('Collaborator added');
    setEmailToAdd("");
    setShowShareDialog(false);
  };

  const removeCollaborator = async (collaboratorId: string) => {
    const { error } = await supabase
      .from('playbook_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) {
      toast.error('Failed to remove collaborator');
      console.error(error);
      return;
    }

    toast.success('Collaborator removed');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
          {isOwner && (
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Playbook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Add by Email</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="email"
                        placeholder="colleague@example.com"
                        value={emailToAdd}
                        onChange={(e) => setEmailToAdd(e.target.value)}
                      />
                      <Button onClick={addCollaboratorByEmail}>Add</Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <div>
                    <Label>Share Link</Label>
                    {shareLink ? (
                      <div className="flex gap-2 mt-2">
                        <Input value={shareLink} readOnly />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyShareLink}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={generateShareLink}
                        className="w-full mt-2"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Generate Share Link
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {collaborators.map((collab) => (
          <div key={collab.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {collab.profiles?.full_name?.[0] || collab.profiles?.email?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium">
                  {collab.profiles?.full_name || collab.profiles?.email || 'Unknown'}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{collab.role}</div>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeCollaborator(collab.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {collaborators.length === 0 && isOwner && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowShareDialog(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Collaborators
          </Button>
        )}
      </CardContent>
    </Card>
  );
};