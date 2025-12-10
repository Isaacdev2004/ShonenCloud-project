import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { resolveProfileImage } from "@/lib/profileImageResolver";

const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(500, { message: "Comment must be less than 500 characters" })
});

interface BlogPostProps {
  post: any;
  currentUserId: string;
  isAdmin: boolean;
  onUpdate: () => void;
}

const BlogPost = ({ post, currentUserId, isAdmin, onUpdate }: BlogPostProps) => {
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<any>(null);

  useEffect(() => {
    fetchLikes();
    fetchComments();
    fetchAuthor();

    // Real-time updates for likes on this post
    const likesChannel = supabase
      .channel(`post_${post.id}_likes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${post.id}`
        },
        () => fetchLikes()
      )
      .subscribe();

    // Real-time updates for comments on this post
    const commentsChannel = supabase
      .channel(`post_${post.id}_comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${post.id}`
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [post.id]);

  const fetchLikes = async () => {
    const { data } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", post.id);
    setLikes(data || []);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select(`
        *,
        profiles:user_id (username, profile_picture_url)
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const fetchAuthor = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username, profile_picture_url")
      .eq("id", post.author_id)
      .single();
    setAuthorProfile(data);
  };

  const handleLike = async () => {
    const existingLike = likes.find((like) => like.user_id === currentUserId);

    if (existingLike) {
      await supabase.from("post_likes").delete().eq("id", existingLike.id);
      toast.success("Like removed");
    } else {
      await supabase.from("post_likes").insert({
        post_id: post.id,
        user_id: currentUserId,
      });
      toast.success("Post liked!");
    }
    fetchLikes();
  };

  const handleComment = async () => {
    const validation = commentSchema.safeParse({ content: newComment });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: currentUserId,
      content: validation.data.content,
    });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted!");
      setNewComment("");
      fetchComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      fetchComments();
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      toast.success("Post deleted");
      onUpdate();
    }
  };

  const isLiked = likes.some((like) => like.user_id === currentUserId);

  return (
    <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
      <div className="flex items-start gap-4">
        {authorProfile?.profile_picture_url && (
          <img
            src={resolveProfileImage(authorProfile?.profile_picture_url, authorProfile?.username)}
            alt={authorProfile?.username}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-bold">{authorProfile?.username || "Admin"}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeletePost}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div 
        className="prose prose-sm max-w-none mb-4"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          {likes.length}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {comments.length}
        </Button>
      </div>

      {showComments && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="space-y-2">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex items-start gap-2 text-sm">
                <img
                  src={resolveProfileImage(comment.profiles?.profile_picture_url, comment.profiles?.username)}
                  alt={comment.profiles?.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-bold">{comment.profiles?.username}</p>
                  <p>{comment.content}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-col">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
            />
            <div className="flex items-center justify-between">
              <p className={`text-xs ${newComment.trim().length > 500 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {newComment.trim().length} / 500 characters
              </p>
              <Button onClick={handleComment} disabled={newComment.trim().length > 500}>Post</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
