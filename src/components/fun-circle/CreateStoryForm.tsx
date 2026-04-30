import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImagePlus, X, Loader2, Send, Palette, Type } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFunCircleStories } from "@/hooks/useFunCircleStories";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/untyped-client";
import { useToast } from "@/hooks/use-toast";
import {
  STORY_BACKGROUND_COLORS,
  STORY_FONTS,
  STORY_TEXT_COLORS,
} from "@/contexts/FunCircleSettingsContext";

interface CreateStoryFormProps {
  onSuccess?: () => void;
}

export function CreateStoryForm({ onSuccess }: CreateStoryFormProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { createStory, remainingImages } = useFunCircleStories();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  // Canvas settings persist across posts
  const [storyBg, setStoryBg] = useState("transparent");
  const [storyFont, setStoryFont] = useState("Inter, sans-serif");
  const [storyTextColor, setStoryTextColor] = useState("inherit");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const filesToUpload = Array.from(files).slice(0, remainingImages - images.length);
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Image limit reached",
        description: `You can only upload ${remainingImages} more images today.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("fun-circle")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("fun-circle")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload some images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Empty story",
        description: "Please add some content or images",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    const result = await createStory(content.trim(), images);
    setIsPosting(false);

    if (!result.error) {
      // Clear content and images but keep canvas settings (bg, font, color)
      setContent("");
      setImages([]);
      onSuccess?.();
    }
  };

  return (
    <Card className="p-3 sm:p-4 space-y-4">
      {/* Preview with styling */}
      {(storyBg !== "transparent" || storyFont !== "Inter, sans-serif" || storyTextColor !== "inherit") && content.trim() && (
        <div
          className="p-4 rounded-lg min-h-[60px]"
          style={{
            background: storyBg,
            fontFamily: storyFont,
            color: storyTextColor === "inherit" ? undefined : storyTextColor,
          }}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Textarea
            placeholder="What's on your mind? Share something with your friends..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
            style={{
              fontFamily: storyFont,
              color: storyTextColor === "inherit" ? undefined : storyTextColor,
            }}
          />
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading || remainingImages <= images.length}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ImagePlus className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">Photo</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm"><Palette className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Theme</span></Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2">Background</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {STORY_BACKGROUND_COLORS.slice(0, 12).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setStoryBg(color.value)}
                        className={`h-7 w-7 rounded border transition-all ${storyBg === color.value ? "ring-2 ring-primary ring-offset-1" : "hover:scale-110"}`}
                        style={{ background: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium mt-3 mb-2">Gradients</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {STORY_BACKGROUND_COLORS.slice(12).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setStoryBg(color.value)}
                        className={`h-8 rounded border transition-all ${storyBg === color.value ? "ring-2 ring-primary ring-offset-1" : "hover:scale-105"}`}
                        style={{ background: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm"><Type className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Font</span></Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2">Font Style</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STORY_FONTS.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => setStoryFont(font.value)}
                        className={`p-2 rounded border text-left text-xs transition-all ${storyFont === font.value ? "border-primary bg-primary/5" : "hover:bg-accent"}`}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Text Color</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {STORY_TEXT_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setStoryTextColor(color.value)}
                        className={`h-8 rounded border flex items-center justify-center transition-all ${storyTextColor === color.value ? "ring-2 ring-primary ring-offset-1" : "hover:scale-105"}`}
                        title={color.name}
                      >
                        <span className="text-sm font-bold" style={{ color: color.value === "inherit" ? undefined : color.value }}>A</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            {remainingImages - images.length} images left
          </span>
        </div>

        <Button onClick={handleSubmit} disabled={isPosting || (!content.trim() && images.length === 0)} size="sm">
          {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
          Post
        </Button>
      </div>
    </Card>
  );
}
