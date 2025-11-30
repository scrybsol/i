import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Image, Headphones, ShoppingBag, Heart, Share2, Filter, Search, Star, Download, Rss, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useMediaPageLike, useMediaPageFollow } from '../hooks/useMediaPageInteraction';
import { useContentDeletion } from '../hooks/useContentDeletion';
import { trackVideoView } from '../hooks/useVideoViewTracking';
import { updateDurationInDatabase } from '../lib/updateDurationInDatabase';
import DeleteFromDestinationModal from '../components/DeleteFromDestinationModal';
import VideoPlaybackModal from '../components/VideoPlaybackModal';
import VideoUploadWithMux from '../components/VideoUploadWithMux';

interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  creator: string;
  description?: string;
  thumbnail_url: string;
  content_url: string;
  like_count: number;
  views_count?: number;
  duration?: string;
  read_time?: string;
  category?: string;
  is_premium: boolean;
  type: string;
  created_at: string;
}

const categories = {
  stream: ['all', 'movie', 'music-video', 'documentaries', 'lifesyle', 'Go Live'],
  listen: ['all', 'greatest-of-all-time', 'latest-release', 'new-talent', 'DJ-mixtapes', 'UG-Unscripted', 'Afrobeat', 'hip-hop', 'RnB', 'Others'],
  blog: ['all', 'interviews', 'lifestyle', 'product-reviews', 'others'],
  gallery: ['all', 'design', 'photography', 'art', 'others'],
  resources: ['all', 'templates', 'ebooks', 'software', 'presets'],
};

const tabs = [
  { id: 'stream', label: 'Stream', icon: <Play className="w-5 h-5" /> },
  { id: 'listen', label: 'Listen', icon: <Headphones className="w-5 h-5" /> },
  { id: 'blog', label: 'Blog', icon: <Rss className="w-5 h-5" /> },
  { id: 'gallery', label: 'Gallery', icon: <Image className="w-5 h-5" /> },
  { id: 'resources', label: 'Resources', icon: <ShoppingBag className="w-5 h-5" /> },
];

export default function Media() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userFollows, setUserFollows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('stream');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contentId: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [playingContent, setPlayingContent] = useState<ContentItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const { toggleLike } = useMediaPageLike();
  const { toggleFollow } = useMediaPageFollow();
  const { deleteFromDestination } = useContentDeletion();

  useEffect(() => {
    // Try to load cached content first for instant display
    const cached = sessionStorage.getItem('media_content_cache');
    let hasCache = false;
    if (cached) {
      try {
        setContentItems(JSON.parse(cached));
        setLoading(false);
        hasCache = true;
      } catch {}
    }
    // Fetch fresh content in background (set loading only if no cache)
    if (!hasCache) setLoading(true);
    fetchContent();
    if (user) fetchUserInteractions();
  }, [user]);

  useEffect(() => {
    setSelectedCategory('all');
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToRealTimeUpdates();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase.rpc('get_content_by_destination', {
        destination: 'media'
      });

      if (error) {
        console.error('Error fetching content:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setContentItems(data);
        // Cache for instant load next time
        sessionStorage.setItem('media_content_cache', JSON.stringify(data));

        // Auto-update durations for videos with "0:00" in background (non-blocking)
        data.forEach((item) => {
          if ((item.duration === '0:00' || !item.duration) && (item.type === 'music-video' || item.type === 'movie' || item.type === 'audio-music')) {
            updateDurationInDatabase(item.id, item.content_url)
              .then((newDuration) => {
                if (newDuration) {
                  setContentItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, duration: newDuration } : i))
                  );
                }
              })
              .catch((err) => {
                console.error(`Failed to auto-update duration for ${item.id}:`, err);
              });
          }
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user) return;

    try {
      const { data: likes } = await supabase
        .from('media_page_likes')
        .select('content_id')
        .eq('user_id', user.id);

      if (likes) {
        setUserLikes(new Set(likes.map((l: any) => l.content_id)));
      }

      const { data: follows } = await supabase
        .from('media_page_follows')
        .select('creator_name')
        .eq('follower_id', user.id);

      if (follows) {
        setUserFollows(new Set(follows.map((f: any) => f.creator_name)));
      }
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const subscribeToRealTimeUpdates = () => {
    const contentChannel = supabase
      .channel('public:media_page_content')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'media_page_content',
        },
        (payload: any) => {
          setContentItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? {
                    ...item,
                    like_count: payload.new.like_count,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel('public:media_page_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_page_likes',
        },
        () => {
          if (user) {
            fetchUserInteractions();
          }
        }
      )
      .subscribe();

    return () => {
      contentChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  };

  const handleToggleLike = useCallback(
    async (contentId: string) => {
      if (!user) {
        navigate('/signin');
        return;
      }

      const isCurrentlyLiked = userLikes.has(contentId);
      const previousLikes = userLikes;
      const previousItems = contentItems;

      setUserLikes((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.delete(contentId);
        } else {
          next.add(contentId);
        }
        return next;
      });

      setContentItems((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? { ...item, like_count: isCurrentlyLiked ? item.like_count - 1 : item.like_count + 1 }
            : item
        )
      );

      const result = await toggleLike(contentId, isCurrentlyLiked, user.id);

      if (!result.success) {
        setUserLikes(previousLikes);
        setContentItems(previousItems);
      }
    },
    [user, userLikes, contentItems, toggleLike, navigate]
  );

  const handleToggleFollow = useCallback(
    async (creatorName: string) => {
      if (!user) {
        navigate('/signin');
        return;
      }

      const isCurrentlyFollowing = userFollows.has(creatorName);
      const previousFollows = userFollows;

      setUserFollows((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(creatorName);
        } else {
          next.add(creatorName);
        }
        return next;
      });

      const result = await toggleFollow(creatorName, isCurrentlyFollowing, user.id);

      if (!result.success) {
        setUserFollows(previousFollows);
      }
    },
    [user, userFollows, toggleFollow, navigate]
  );

  const handleDeleteClick = (contentId: string, contentTitle: string) => {
    setDeleteModal({ isOpen: true, contentId, title: contentTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;

    setIsDeleting(true);
    const result = await deleteFromDestination(deleteModal.contentId, 'media');

    if (result.success) {
      setContentItems((prev) => prev.filter((item) => item.id !== deleteModal.contentId));
      setDeleteModal(null);
    } else {
      console.error('Failed to delete from Media:', result.error);
    }

    setIsDeleting(false);
  };

  const handleDeleteCancel = () => {
    setDeleteModal(null);
  };

  const handlePlayClick = (item: ContentItem) => {
    setPlayingContent(item);
    setIsPlayerOpen(true);
    trackVideoView(item.id);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setPlayingContent(null);
  };

  const handleVideoUploadSuccess = () => {
    // Refresh content when new video is uploaded
    fetchContent();
  };

  const getTabType = (contentType: string) => {
    switch (contentType) {
      case 'music-video':
      case 'movie':
        return 'stream';
      case 'audio-music':
        return 'listen';
      case 'blog':
        return 'blog';
      case 'image':
        return 'gallery';
      case 'document':
        return 'resources';
      default:
        return null;
    }
  };

  const filteredContent = contentItems.filter((item) => {
    const itemTabType = getTabType(item.type);
    const matchesTab = itemTabType === activeTab;

    const categoryMatches =
      selectedCategory === 'all' ||
      item.type === selectedCategory ||
      item.category === selectedCategory;

    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.creator.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && categoryMatches && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'music-video':
      case 'movie':
        return <Play className="w-12 h-12 text-white" />;
      case 'audio-music':
        return <Headphones className="w-12 h-12 text-white" />;
      case 'blog':
        return <Rss className="w-12 h-12 text-white" />;
      case 'image':
        return <Image className="w-12 h-12 text-white" />;
      default:
        return <Play className="w-12 h-12 text-white" />;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-white mb-2">Media</h1>
          <p className="text-gray-300">Celebrate amazing content from creators you love.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 glass-effect p-2 rounded-xl overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'stream' ? 'videos & movies' : activeTab === 'listen' ? 'music & audio' : activeTab === 'blog' ? 'articles & blogs' : activeTab === 'gallery' ? 'images & galleries' : activeTab === 'resources' ? 'templates & resources' : 'content'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-effect rounded-xl border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 glass-effect rounded-xl border border-white/20 text-white bg-transparent focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            >
              {categories[activeTab as keyof typeof categories]?.map((category) => (
                <option key={category} value={category} className="bg-gray-800">
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-sm whitespace-nowrap">{filteredContent.length} results</span>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading content...</p>
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContent.map((item) => (
              <div key={item.id} className="glass-effect rounded-2xl overflow-hidden hover-lift group">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <button
                    onClick={() => handlePlayClick(item)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/60"
                  >
                    {getIcon(item.type)}
                  </button>

                  {/* Premium Badge */}
                  {item.is_premium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full">
                      PREMIUM
                    </div>
                  )}

                  {/* Duration */}
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {item.duration}
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{item.creator}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    {item.views_count !== undefined && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{item.views_count.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{item.like_count.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleFollow(item.creator)}
                      className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                    >
                      {userFollows.has(item.creator) ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => handleToggleLike(item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        userLikes.has(item.id)
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'glass-effect text-gray-400 hover:text-white'
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={userLikes.has(item.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button className="p-2 glass-effect text-gray-400 hover:text-white rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    {user?.id === item.user_id && (
                      <button
                        onClick={() => handleDeleteClick(item.id, item.title)}
                        className="p-2 glass-effect text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete from Media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Premium CTA */}
                  {item.is_premium && user?.tier === 'free' && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-lg">
                      <p className="text-yellow-400 text-xs mb-2">Premium content - Subscribe to unlock</p>
                      <button className="w-full py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded">
                        Subscribe Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'stream' && <Play className="w-16 h-16 mx-auto mb-4" />}
              {activeTab === 'listen' && <Headphones className="w-16 h-16 mx-auto mb-4" />}
              {activeTab === 'blog' && <Rss className="w-16 h-16 mx-auto mb-4" />}
              {activeTab === 'gallery' && <Image className="w-16 h-16 mx-auto mb-4" />}
              {activeTab === 'resources' && <ShoppingBag className="w-16 h-16 mx-auto mb-4" />}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No content available</h3>
            <p className="text-gray-400">Check back later for new {activeTab} content!</p>
          </div>
        )}
      </div>

      {deleteModal && (
        <DeleteFromDestinationModal
          isOpen={deleteModal.isOpen}
          destination="media"
          contentTitle={deleteModal.title}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      )}

      {playingContent && (
        <VideoPlaybackModal
          isOpen={isPlayerOpen}
          content={playingContent}
          isLiked={userLikes.has(playingContent.id)}
          onClose={handleClosePlayer}
          onLikeToggle={handleToggleLike}
          onFollowToggle={handleToggleFollow}
          isFollowing={userFollows.has(playingContent.creator)}
        />
      )}

      {user && (
        <VideoUploadWithMux
          userId={user.id}
          userName={user.name}
          onSuccess={handleVideoUploadSuccess}
        />
      )}
    </div>
  );
}
