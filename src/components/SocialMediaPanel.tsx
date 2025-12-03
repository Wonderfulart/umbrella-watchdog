import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  Loader2, 
  Send, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  Linkedin,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  created_at: string;
  published_at: string | null;
}

export const SocialMediaPanel = () => {
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "linkedin", name: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, enabled: true },
    { id: "facebook", name: "Facebook", icon: <Facebook className="h-4 w-4" />, enabled: true },
    { id: "instagram", name: "Instagram", icon: <Instagram className="h-4 w-4" />, enabled: false },
    { id: "twitter", name: "X (Twitter)", icon: <Twitter className="h-4 w-4" />, enabled: true },
  ]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSettings();
    fetchRecentPosts();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("social_settings")
        .select("*")
        .limit(1)
        .single();

      if (data && !error) {
        setWebhookUrl(data.zapier_webhook_url || "");
      }
    } catch (error) {
      console.log("No social settings found, using defaults");
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { data: existing } = await supabase
        .from("social_settings")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        await supabase
          .from("social_settings")
          .update({ zapier_webhook_url: webhookUrl })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("social_settings")
          .insert({ zapier_webhook_url: webhookUrl, created_by: user?.id });
      }

      toast({
        title: "Settings Saved",
        description: "Zapier webhook URL has been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(platforms.map(p => 
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content to publish",
        variant: "destructive",
      });
      return;
    }

    const selectedPlatforms = platforms.filter(p => p.enabled).map(p => p.id);
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!webhookUrl) {
      toast({
        title: "Webhook Not Configured",
        description: "Please configure your Zapier webhook URL in settings",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      // Save post to database
      const { data: post, error: postError } = await supabase
        .from("social_posts")
        .insert({
          content,
          platforms: selectedPlatforms,
          status: "publishing",
          created_by: user?.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Send to Zapier webhook
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          post_id: post.id,
          content,
          platforms: selectedPlatforms,
          timestamp: new Date().toISOString(),
          source: "policy-renewal-dashboard",
        }),
      });

      // Update post status
      await supabase
        .from("social_posts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", post.id);

      toast({
        title: "Post Sent!",
        description: `Your post has been sent to ${selectedPlatforms.length} platform(s) via Zapier`,
      });

      setContent("");
      fetchRecentPosts();
    } catch (error) {
      console.error("Publishing error:", error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please check your webhook configuration.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const characterCount = content.length;
  const maxChars = 280; // Twitter limit as reference

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose" className="w-full">
        <TabsList>
          <TabsTrigger value="compose">Compose Post</TabsTrigger>
          <TabsTrigger value="history">Post History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Compose Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Create Social Post
                </CardTitle>
                <CardDescription>
                  Write your post and publish to multiple platforms at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Post Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Share insurance tips, company updates, or industry news..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[150px] resize-none"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tip: Keep posts concise and engaging!</span>
                    <span className={characterCount > maxChars ? "text-destructive" : ""}>
                      {characterCount}/{maxChars}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={isPublishing || !content.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publish to Selected Platforms
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <Checkbox
                      checked={platform.enabled}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {platform.icon}
                      <span className="font-medium">{platform.name}</span>
                    </div>
                    {platform.enabled && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected: {platforms.filter(p => p.enabled).length} platform(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>View your publishing history</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No posts yet. Create your first post!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm line-clamp-2 flex-1">{post.content}</p>
                        <Badge variant={post.status === "published" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {post.platforms.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Zapier Integration
              </CardTitle>
              <CardDescription>
                Connect your Zapier webhook to publish posts to social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">Zapier Webhook URL</Label>
                <Input
                  id="webhook"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Create a Zap with a "Webhooks by Zapier" trigger, then paste the webhook URL here.
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <h4 className="font-medium mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">zapier.com</a> and create a new Zap</li>
                  <li>Choose "Webhooks by Zapier" as the trigger</li>
                  <li>Select "Catch Hook" as the event</li>
                  <li>Copy the webhook URL and paste it above</li>
                  <li>Add actions for each social platform (LinkedIn, Facebook, etc.)</li>
                  <li>Use the "content" and "platforms" fields from the webhook data</li>
                </ol>
              </div>

              <Button onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};