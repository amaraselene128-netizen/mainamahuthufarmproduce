import { useState, memo, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { CreateStoryForm } from "@/components/fun-circle/CreateStoryForm";
import { StoryCard } from "@/components/fun-circle/StoryCard";
import { FriendsPanel } from "@/components/fun-circle/FriendsPanel";
import { MessagesDrawer } from "@/components/fun-circle/MessagesDrawer";
import { MobileFriendsSheet } from "@/components/fun-circle/MobileFriendsSheet";
import { ProfileHeader } from "@/components/fun-circle/ProfileHeader";
import { FunCircleSettingsSheet } from "@/components/fun-circle/FunCircleSettingsSheet";
import { FunCircleSettingsProvider } from "@/contexts/FunCircleSettingsContext";
import { useFunCircleStories, ReactionType } from "@/hooks/useFunCircleStories";
import { useFunCircleMessages } from "@/hooks/useFunCircleMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, Users, Sparkles, LogIn, Bell, X, Home,
  Compass, UserPlus, Settings, TrendingUp, Search
} from "lucide-react";
import { Link } from "react-router-dom";

const StorySkeleton = memo(function StorySkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
});

const StorySkeletons = memo(function StorySkeletons() {
  return (
    <div className="space-y-4">
      <StorySkeleton />
      <StorySkeleton />
      <StorySkeleton />
    </div>
  );
});

function FunCircleContent() {
  const { user } = useAuth();
  const { stories, isLoading, addReaction, deleteStory } = useFunCircleStories();
  const {
    startConversation,
    conversations,
    openConversation,
    currentConversation
  } = useFunCircleMessages();
  const [showMessages, setShowMessages] = useState(false);
  const [showMobileFriends, setShowMobileFriends] = useState(false);
  const [feedTab, setFeedTab] = useState("feed");

  const unreadCount = useMemo(() =>
    conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations]
  );

  const handleStartChat = useCallback(async (userId: string) => {
    const conv = await startConversation(userId);
    if (conv) {
      const fullConv = conversations.find(c => c.id === conv.id);
      if (fullConv) await openConversation(fullConv);
      else await openConversation(conv);
      setShowMessages(true);
    }
  }, [startConversation, conversations, openConversation]);

  const handleReact = useCallback((storyId: string, reactionType: ReactionType) => {
    addReaction(storyId, reactionType);
  }, [addReaction]);

  const handleDelete = useCallback((storyId: string) => {
    deleteStory(storyId);
  }, [deleteStory]);

  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Sokoni Fun Circle</h1>
            <p className="text-muted-foreground mb-6">
              Connect with friends, share stories, and have fun! Sign in to join the community.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/login"><LogIn className="h-4 w-4 mr-2" />Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Top Navigation Bar - Social style */}
      <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold hidden sm:block">Fun Circle</h1>
            </div>

            {/* Center Nav */}
            <div className="flex items-center gap-1">
              <Button
                variant={feedTab === "feed" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFeedTab("feed")}
                className="gap-1.5"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Feed</span>
              </Button>
              <Button
                variant={feedTab === "discover" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFeedTab("discover")}
                className="gap-1.5"
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFriends(true)}
                className="lg:hidden gap-1.5"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              <FunCircleSettingsSheet />
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/fun-circle/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowMessages(true)}
              >
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="grid lg:grid-cols-[280px_1fr_300px] gap-6">
          {/* Left Sidebar - Profile & Quick Links */}
          <div className="hidden lg:block space-y-4">
            <ProfileHeader />

            <Card className="p-3">
              <nav className="space-y-1">
                <SidebarLink icon={Home} label="News Feed" active={feedTab === "feed"} onClick={() => setFeedTab("feed")} />
                <SidebarLink icon={Users} label="Friends" onClick={() => setShowMobileFriends(true)} />
                <SidebarLink icon={MessageCircle} label="Messages" badge={unreadCount} onClick={() => setShowMessages(true)} />
                <SidebarLink icon={Compass} label="Discover" active={feedTab === "discover"} onClick={() => setFeedTab("discover")} />
                <SidebarLink icon={Bell} label="Notifications" href="/fun-circle/notifications" />
              </nav>
            </Card>

            <Card className="p-3">
              <p className="text-xs text-muted-foreground px-2 mb-2 font-medium">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-primary">{stories.length}</p>
                  <p className="text-xs text-muted-foreground">Stories</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold text-primary">{conversations.length}</p>
                  <p className="text-xs text-muted-foreground">Chats</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="space-y-4 min-w-0">
            {/* Mobile Profile Header */}
            <div className="lg:hidden">
              <ProfileHeader />
            </div>

            {/* Stories Bar - Facebook style */}
            <StoriesBar stories={stories} />

            {/* Create Story */}
            <CreateStoryForm />

            {/* Stories Feed */}
            {feedTab === "feed" && (
              <>
                {isLoading ? (
                  <StorySkeletons />
                ) : stories.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">No stories yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Add friends to see their stories, or be the first to share something!
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        onReact={handleReact}
                        onDelete={handleDelete}
                        onStartChat={handleStartChat}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {feedTab === "discover" && (
              <Card className="p-8 text-center">
                <Compass className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                <h3 className="font-semibold mb-1">Discover People & Stories</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find new friends and explore trending stories from the community
                </p>
                <Button variant="outline" onClick={() => setShowMobileFriends(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block space-y-4">
            <FriendsPanel onStartChat={handleStartChat} />
          </div>
        </div>
      </div>

      {/* Desktop Messages Drawer */}
      {showMessages && (
        <div className="hidden lg:block fixed inset-y-0 right-0 w-[380px] z-50 shadow-xl bg-background border-l">
          <MessagesDrawer isOpen={showMessages} onClose={() => setShowMessages(false)} />
          <button
            className="absolute top-4 left-4 p-2 rounded-full bg-background shadow hover:bg-accent"
            onClick={() => setShowMessages(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile FABs */}
      <div className="lg:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg relative"
          onClick={() => setShowMessages(true)}
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Friends Sheet */}
      <MobileFriendsSheet
        isOpen={showMobileFriends}
        onClose={() => setShowMobileFriends(false)}
        onStartChat={(userId) => {
          setShowMobileFriends(false);
          handleStartChat(userId);
        }}
      />

      {/* Mobile Messages Drawer */}
      {showMessages && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <MessagesDrawer isOpen={showMessages} onClose={() => setShowMessages(false)} />
          <button
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg"
            onClick={() => setShowMessages(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </Layout>
  );
}

function StoriesBar({ stories }: { stories: Story[] }) {
  // Get unique users with their latest story
  const userStories = useMemo(() => {
    const map = new Map<string, Story>();
    for (const s of stories) {
      if (!map.has(s.user_id)) map.set(s.user_id, s);
    }
    return Array.from(map.values()).slice(0, 12);
  }, [stories]);

  if (userStories.length === 0) return null;

  return (
    <Card className="p-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {userStories.map((story) => (
          <Link
            key={story.id}
            to={`/profile/${story.user_id}`}
            className="flex flex-col items-center gap-1 shrink-0 w-[72px]"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary via-accent to-primary">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-card">
                  {story.profile?.avatar_url ? (
                    <img src={story.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                      {story.profile?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {story.profile?.username || "User"}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
  href,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const className = `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left ${
    active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <Badge variant="default" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
          {badge}
        </Badge>
      )}
    </>
  );

  if (href) {
    return <Link to={href} className={className}>{content}</Link>;
  }

  return <button onClick={onClick} className={className}>{content}</button>;
}

export default function FunCircle() {
  return (
    <FunCircleSettingsProvider>
      <FunCircleContent />
    </FunCircleSettingsProvider>
  );
}
