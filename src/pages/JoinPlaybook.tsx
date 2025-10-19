import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const JoinPlaybook = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [playbookId, setPlaybookId] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error('Please sign in to join this playbook');
      navigate('/auth');
      return;
    }

    joinPlaybook();
  }, [user, authLoading, token]);

  const joinPlaybook = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('join-playbook', {
        body: { token }
      });

      if (error) throw error;

      if (data.success) {
        setPlaybookId(data.playbookId);
        setStatus('success');
        toast.success(data.message || 'Successfully joined playbook');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/doc/${data.playbookId}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error joining playbook:', error);
      setStatus('error');
      toast.error(error.message || 'Failed to join playbook');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Joining playbook...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Success!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Failed to Join
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <>
              <p className="text-sm text-muted-foreground">
                You've successfully joined the playbook. Redirecting...
              </p>
              <Button
                className="w-full"
                onClick={() => navigate(`/doc/${playbookId}`)}
              >
                Go to Playbook
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This share link may be invalid, expired, or you may not have permission to access it.
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Go Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinPlaybook;