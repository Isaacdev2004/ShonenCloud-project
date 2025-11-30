import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.png";
import homeButton from "@/assets/buttons/home-button.png";
import { RichTextEditor } from "@/components/RichTextEditor";

const postSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Post content cannot be empty" })
    .max(5000, { message: "Post must be less than 5000 characters" })
});

const CreatePost = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    setUserId(session.user.id);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied: Admin only");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const handlePost = async () => {
    const validation = postSchema.safeParse({ content });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setPosting(true);

    const { error } = await supabase
      .from("blog_posts")
      .insert({
        author_id: userId,
        content: validation.data.content,
      });

    if (error) {
      toast.error("Failed to create post");
    } else {
      toast.success("Post created successfully!");
      navigate("/dashboard");
    }

    setPosting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ShonenCloud" className="w-24 h-24 mx-auto animate-pulse" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ShonenCloud" className="h-12 cursor-pointer" onClick={() => navigate("/dashboard")} />
            <div className="h-8 w-px bg-border" />
            <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
          </div>
          <button onClick={() => navigate("/dashboard")} className="transition-transform hover:scale-105 cursor-pointer">
            <img src={homeButton} alt="Home" className="h-12" />
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Create New Post</h2>
          <p className="text-muted-foreground">Share updates, announcements, or news with the community</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-card/50">
            <CardTitle className="text-xl">Post Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Content</label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your post content here... You can write multiple paragraphs, share updates, or make announcements."
              />
              <p className="text-sm text-muted-foreground">
                Rich text enabled - Add bold, italic text and images
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handlePost} 
                className="flex-1" 
                disabled={posting || !content.trim()}
                size="lg"
              >
                {posting ? "Publishing..." : "Publish Post"}
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")} 
                variant="outline"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
