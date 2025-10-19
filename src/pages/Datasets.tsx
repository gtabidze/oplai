import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Import logos
import dropboxLogo from "@/assets/logos/dropbox.png";
import googleDriveLogo from "@/assets/logos/google-drive.png";
import onedriveLogo from "@/assets/logos/onedrive.png";
import boxLogo from "@/assets/logos/box.png";
import awsS3Logo from "@/assets/logos/aws-s3.png";
import icloudLogo from "@/assets/logos/icloud.png";
import notionLogo from "@/assets/logos/notion.png";
import confluenceLogo from "@/assets/logos/confluence.png";
import sharepointLogo from "@/assets/logos/sharepoint.png";
import githubLogo from "@/assets/logos/github.png";
import evernoteLogo from "@/assets/logos/evernote.png";

interface StorageProvider {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
}

const storageProviders: StorageProvider[] = [
  {
    id: "dropbox",
    name: "Dropbox",
    logo: dropboxLogo,
    description: "Cloud storage and file synchronization",
    category: "Cloud Storage"
  },
  {
    id: "google-drive",
    name: "Google Drive",
    logo: googleDriveLogo,
    description: "Google's cloud storage service",
    category: "Cloud Storage"
  },
  {
    id: "onedrive",
    name: "OneDrive",
    logo: onedriveLogo,
    description: "Microsoft's cloud storage platform",
    category: "Cloud Storage"
  },
  {
    id: "box",
    name: "Box",
    logo: boxLogo,
    description: "Enterprise cloud content management",
    category: "Cloud Storage"
  },
  {
    id: "aws-s3",
    name: "Amazon S3",
    logo: awsS3Logo,
    description: "Amazon's object storage service",
    category: "Cloud Storage"
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    logo: icloudLogo,
    description: "Apple's cloud storage service",
    category: "Cloud Storage"
  },
  {
    id: "notion",
    name: "Notion",
    logo: notionLogo,
    description: "All-in-one workspace and documentation",
    category: "Documentation"
  },
  {
    id: "confluence",
    name: "Confluence",
    logo: confluenceLogo,
    description: "Team collaboration and documentation",
    category: "Documentation"
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    logo: sharepointLogo,
    description: "Microsoft's collaboration platform",
    category: "Documentation"
  },
  {
    id: "github",
    name: "GitHub",
    logo: githubLogo,
    description: "Code hosting and version control",
    category: "Development"
  },
  {
    id: "evernote",
    name: "Evernote",
    logo: evernoteLogo,
    description: "Note-taking and organization",
    category: "Documentation"
  }
];

export default function Datasets() {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<StorageProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('data_sources')
      .select('provider, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!error && data) {
      setConnectedProviders(new Set(data.map(d => d.provider)));
    }
  };

  const handleGoogleDriveConnect = async () => {
    setIsConnecting(true);
    try {
      const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should be retrieved from backend
      const redirectUri = `${window.location.origin}/datasets`;
      const scope = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `prompt=consent`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      toast.error('Failed to initiate Google Drive connection');
      setIsConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/datasets`;
      
      const { data, error } = await supabase.functions.invoke('google-drive-oauth', {
        body: { code, redirect_uri: redirectUri }
      });

      if (error) throw error;

      toast.success('Google Drive connected successfully!');
      await loadConnections();
      
      // Clear the code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast.error('Failed to connect Google Drive: ' + error.message);
    }
  };

  const handleSync = async (provider: string) => {
    if (!connectedProviders.has(provider)) {
      toast.error('Please connect to this provider first');
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-sync');

      if (error) throw error;

      toast.success(`Synced ${data.syncedFiles} files from ${data.totalFiles} total files`);
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Failed to sync files: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProviderClick = async (provider: StorageProvider) => {
    if (provider.id === 'google-drive') {
      if (connectedProviders.has(provider.id)) {
        // Already connected, show sync option
        await handleSync(provider.id);
      } else {
        // Not connected, initiate OAuth
        await handleGoogleDriveConnect();
      }
    } else {
      // Show coming soon dialog for other providers
      setSelectedProvider(provider);
      setIsDialogOpen(true);
    }
  };

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && user) {
      handleOAuthCallback(code);
    }
  }, [user]);

  const groupedProviders = storageProviders.reduce((acc, provider) => {
    if (!acc[provider.category]) {
      acc[provider.category] = [];
    }
    acc[provider.category].push(provider);
    return acc;
  }, {} as Record<string, StorageProvider[]>);

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Datasets</h1>
          <p className="text-muted-foreground mt-2">
            Connect and sync your data from cloud storage providers and collaboration tools
          </p>
        </div>

        {/* Introduction Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-semibold">Connect Your Data Sources</h2>
                <p className="text-sm text-muted-foreground">
                  Sync your documents and data from popular cloud storage providers and collaboration tools. 
                  Select a provider below to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Providers by Category */}
        {Object.entries(groupedProviders).map(([category, providers]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{category}</h3>
              <Badge variant="secondary" className="text-xs">
                {providers.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group relative"
                  onClick={() => handleProviderClick(provider)}
                >
                  {connectedProviders.has(provider.id) && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <img
                          src={provider.logo}
                          alt={`${provider.name} logo`}
                          className="h-12 w-12 object-cover rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {provider.description}
                        </p>
                      </div>
                      {connectedProviders.has(provider.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSyncing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSync(provider.id);
                          }}
                          className="w-full"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sync Files
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              {selectedProvider?.name} Integration
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p className="text-base">
                Integration with <span className="font-semibold text-foreground">{selectedProvider?.name}</span> is coming soon!
              </p>
              <p className="text-sm">
                We're working on bringing you seamless data synchronization from {selectedProvider?.name}. 
                Stay tuned for updates.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setIsDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
