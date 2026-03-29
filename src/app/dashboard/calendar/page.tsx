'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  ChevronLeft, ChevronRight, Bot, Upload, Plus, Trash2,
  Copy, MoveRight, CheckSquare, Square, Eye, Edit3,
  Play, Image as ImageIcon, Video, MoreHorizontal, X,
  Calendar as CalendarIcon, Clock, Send, FileText
} from 'lucide-react';
import { PostModal } from '@/components/calendar/PostModal';
import { AgentIAModal } from '@/components/calendar/AgentIAModal';

interface Post {
  id: string;
  caption: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platforms: string[];
  media_url?: string;
  media_type?: string;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-yellow-400 bg-yellow-400/10',
  scheduled: 'text-blue-400 bg-blue-400/10',
  published: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
  failed: 'Échoué',
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black border border-gray-600',
  facebook: 'bg-blue-600',
  youtube: 'bg-red-600',
};

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);

  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Post preview modal
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  // Move post modal
  const [movePost, setMovePost] = useState<Post | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');

  // Fetch posts on mount and when month changes
  useEffect(() => {
    if (session?.user) {
      fetchPosts();
    }
  }, [currentDate, session]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/posts?month=${month}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 7 : day; // Monday = 1, Sunday = 7
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateStr = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayPosts = (day: number): Post[] => {
    const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth(), day);
    return posts.filter(p => p.scheduled_date === dateStr);
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedPost(null);
  };

  const handleNewPost = () => {
    setEditPost(null);
    setShowPostModal(true);
  };

  const handleEditPost = (post: Post) => {
    setEditPost(post);
    setShowPostModal(true);
  };

  const handlePostSave = () => {
    fetchPosts();
    setShowPostModal(false);
    setEditPost(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleImport = () => {
    showToast('Import CSV bientôt disponible', 'info');
  };

  // --- Delete post ---
  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
        showToast('Post supprimé');
        setDeleteConfirm(null);
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // --- Duplicate post ---
  const handleDuplicatePost = async (post: Post) => {
    try {
      const formData = new FormData();
      formData.append('caption', post.caption);
      formData.append('platforms', JSON.stringify(post.platforms));
      formData.append('scheduled_date', post.scheduled_date);
      formData.append('scheduled_time', post.scheduled_time);
      formData.append('status', 'draft');
      formData.append('media_type', post.media_type || 'image');
      if (post.media_url) {
        formData.append('existing_media_url', post.media_url);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchPosts();
        showToast('Post dupliqué en brouillon');
      }
    } catch (error) {
      console.error('Error duplicating post:', error);
      showToast('Erreur lors de la duplication', 'error');
    }
  };

  // --- Move post to another date ---
  const handleMovePost = async () => {
    if (!movePost || !moveDate) return;
    try {
      const res = await fetch(`/api/posts/${movePost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: moveDate,
          scheduled_time: moveTime || movePost.scheduled_time,
        }),
      });
      if (res.ok) {
        fetchPosts();
        showToast('Post déplacé');
        setMovePost(null);
      }
    } catch (error) {
      console.error('Error moving post:', error);
      showToast('Erreur lors du déplacement', 'error');
    }
  };

  // --- Publish post (change status from draft to scheduled) ---
  const handlePublishPost = async (post: Post) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'scheduled' }),
      });
      if (res.ok) {
        fetchPosts();
        showToast('Post planifié !');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      showToast('Erreur', 'error');
    }
  };

  // --- Bulk operations ---
  const toggleBulkSelect = (postId: string) => {
    setSelectedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedPostIds).map(id =>
        fetch(`/api/posts/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      fetchPosts();
      showToast(`${selectedPostIds.size} posts supprimés`);
      setSelectedPostIds(new Set());
      setBulkMode(false);
      setBulkDeleteConfirm(false);
    } catch (error) {
      showToast('Erreur lors de la suppression groupée', 'error');
    }
  };

  const selectAllDayPosts = () => {
    if (!selectedDate) return;
    const dayPosts = getDayPosts(selectedDate.getDate());
    const allSelected = dayPosts.every(p => selectedPostIds.has(p.id));
    setSelectedPostIds(prev => {
      const next = new Set(prev);
      dayPosts.forEach(p => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 1; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDateStr = selectedDate
    ? selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;
  const selectedDayPosts = selectedDate ? getDayPosts(selectedDate.getDate()) : [];

  // Stats
  const totalPosts = posts.length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Calendrier IA</h1>
          <p className="text-gray-400">Planifiez et gérez vos posts sur les réseaux sociaux</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: totalPosts, color: 'text-white' },
            { label: 'Brouillons', value: draftCount, color: 'text-yellow-400' },
            { label: 'Planifiés', value: scheduledCount, color: 'text-blue-400' },
            { label: 'Publiés', value: publishedCount, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-700/50">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-xl font-bold text-white capitalize">{monthName}</h2>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, idx) => {
                    const dayPosts = day ? getDayPosts(day) : [];
                    const hasMedia = dayPosts.some(p => p.media_url);
                    const hasDraft = dayPosts.some(p => p.status === 'draft');
                    const hasScheduled = dayPosts.some(p => p.status === 'scheduled');

                    return (
                      <button
                        key={idx}
                        onClick={() => day && handleDayClick(day)}
                        className={`aspect-square rounded-lg font-semibold transition relative flex flex-col items-center justify-start pt-2 ${
                          day === null
                            ? ''
                            : isToday(day)
                            ? 'bg-gradient-to-br from-pink-500/80 to-purple-600/80 text-white ring-2 ring-pink-400'
                            : selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth()
                            ? 'bg-gray-700 text-white border border-pink-500'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {day && (
                          <>
                            <span className="text-sm">{day}</span>
                            {dayPosts.length > 0 && (
                              <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5">
                                {dayPosts.slice(0, 2).map((post, i) => (
                                  <div
                                    key={i}
                                    className={`h-1 rounded-full ${
                                      post.status === 'draft' ? 'bg-yellow-400/70' :
                                      post.status === 'scheduled' ? 'bg-blue-400/70' :
                                      post.status === 'published' ? 'bg-green-400/70' :
                                      'bg-red-400/70'
                                    }`}
                                  />
                                ))}
                                {dayPosts.length > 2 && (
                                  <span className="text-[8px] text-gray-400 text-center">+{dayPosts.length - 2}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setShowAgentModal(true)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Bot size={18} /> Agent IA
                  </Button>
                  <Button
                    onClick={handleImport}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Upload size={18} /> Importer
                  </Button>
                  {posts.length > 0 && (
                    <Button
                      onClick={() => {
                        setBulkMode(!bulkMode);
                        setSelectedPostIds(new Set());
                        setBulkDeleteConfirm(false);
                      }}
                      variant="secondary"
                      className={`flex items-center gap-2 ${bulkMode ? 'ring-2 ring-pink-500' : ''}`}
                    >
                      <CheckSquare size={18} /> {bulkMode ? 'Annuler sélection' : 'Sélection multiple'}
                    </Button>
                  )}
                  <Button
                    onClick={handleNewPost}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <Plus size={18} /> Nouveau Post
                  </Button>
                </div>

                {/* Bulk Actions Bar */}
                {bulkMode && selectedPostIds.size > 0 && (
                  <div className="mt-4 bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-pink-300">
                      {selectedPostIds.size} post{selectedPostIds.size > 1 ? 's' : ''} sélectionné{selectedPostIds.size > 1 ? 's' : ''}
                    </span>
                    {bulkDeleteConfirm ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleBulkDelete}
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 text-sm h-8"
                        >
                          Confirmer la suppression
                        </Button>
                        <Button
                          onClick={() => setBulkDeleteConfirm(false)}
                          variant="ghost"
                          className="text-gray-400 text-sm h-8"
                        >
                          Annuler
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setBulkDeleteConfirm(true)}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 text-sm h-8 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Supprimer la sélection
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Posts Sidebar */}
          <div>
            <Card className="card-base border border-gray-700 sticky top-8">
              <CardHeader className="border-b border-gray-700 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    {selectedDateStr ? (
                      <span className="capitalize">{selectedDateStr}</span>
                    ) : (
                      'Sélectionnez une date'
                    )}
                  </CardTitle>
                  {bulkMode && selectedDate && selectedDayPosts.length > 0 && (
                    <button
                      onClick={selectAllDayPosts}
                      className="text-xs text-pink-400 hover:text-pink-300"
                    >
                      Tout sélectionner
                    </button>
                  )}
                </div>
                {selectedDate && (
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? 's' : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {selectedDate && selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 mb-4">
                      Aucun post prévu ce jour
                    </p>
                    <Button onClick={handleNewPost} className="w-full">
                      <Plus size={16} className="mr-2" /> Nouveau post
                    </Button>
                  </div>
                ) : !selectedDate ? (
                  <div className="text-center py-8">
                    <CalendarIcon size={40} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400">
                      Cliquez sur un jour pour voir ses posts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {selectedDayPosts.map(post => (
                      <div
                        key={post.id}
                        className={`rounded-lg border transition ${
                          selectedPost?.id === post.id
                            ? 'border-pink-500 bg-gray-800'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        {/* Post Card */}
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            {/* Bulk checkbox */}
                            {bulkMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBulkSelect(post.id);
                                }}
                                className="mt-1 text-gray-400 hover:text-pink-400"
                              >
                                {selectedPostIds.has(post.id) ? (
                                  <CheckSquare size={18} className="text-pink-400" />
                                ) : (
                                  <Square size={18} />
                                )}
                              </button>
                            )}

                            {/* Media Thumbnail */}
                            <div
                              className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer"
                              onClick={() => setPreviewPost(post)}
                            >
                              {post.media_url ? (
                                post.media_type === 'video' ? (
                                  <div className="relative w-full h-full">
                                    <video
                                      src={post.media_url}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <Play size={16} className="text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={post.media_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <FileText size={20} className="text-gray-500" />
                              )}
                            </div>

                            {/* Post Info */}
                            <div className="flex-1 min-w-0" onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}>
                              <p className="text-sm text-gray-200 line-clamp-2 cursor-pointer">
                                {post.caption.substring(0, 80)}{post.caption.length > 80 ? '...' : ''}
                              </p>

                              {/* Platforms */}
                              <div className="flex gap-1 mt-2">
                                {post.platforms.map(platform => (
                                  <span
                                    key={platform}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white ${PLATFORM_COLORS[platform] || 'bg-gray-600'}`}
                                    title={platform}
                                  >
                                    {platform[0].toUpperCase()}
                                  </span>
                                ))}
                              </div>

                              {/* Status + Time */}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[post.status]}`}>
                                  {STATUS_LABELS[post.status]}
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={10} /> {post.scheduled_time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Actions */}
                        {selectedPost?.id === post.id && !bulkMode && (
                          <div className="border-t border-gray-700 p-2 grid grid-cols-4 gap-1">
                            <button
                              onClick={() => setPreviewPost(post)}
                              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition"
                              title="Aperçu"
                            >
                              <Eye size={16} />
                              <span className="text-[10px]">Aperçu</span>
                            </button>
                            <button
                              onClick={() => handleEditPost(post)}
                              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition"
                              title="Modifier"
                            >
                              <Edit3 size={16} />
                              <span className="text-[10px]">Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDuplicatePost(post)}
                              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition"
                              title="Dupliquer"
                            >
                              <Copy size={16} />
                              <span className="text-[10px]">Dupliquer</span>
                            </button>
                            <button
                              onClick={() => {
                                setMovePost(post);
                                setMoveDate(post.scheduled_date);
                                setMoveTime(post.scheduled_time);
                              }}
                              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-yellow-400 transition"
                              title="Déplacer"
                            >
                              <MoveRight size={16} />
                              <span className="text-[10px]">Déplacer</span>
                            </button>

                            {/* Publish / Delete row */}
                            <div className="col-span-4 flex gap-2 mt-1">
                              {post.status === 'draft' && (
                                <button
                                  onClick={() => handlePublishPost(post)}
                                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition text-xs"
                                >
                                  <Send size={12} /> Planifier
                                </button>
                              )}
                              {deleteConfirm === post.id ? (
                                <div className="flex-1 flex gap-1">
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="flex-1 p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 p-2 rounded bg-gray-700 text-gray-400 text-xs"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(post.id)}
                                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-xs"
                                >
                                  <Trash2 size={12} /> Supprimer
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add post button at bottom */}
                    {selectedDate && (
                      <Button onClick={handleNewPost} variant="secondary" className="w-full mt-2">
                        <Plus size={16} className="mr-2" /> Ajouter un post
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Post Modal (Create/Edit) */}
      <PostModal
        isOpen={showPostModal}
        onClose={() => { setShowPostModal(false); setEditPost(null); }}
        selectedDate={selectedDate || undefined}
        post={editPost}
        onSave={handlePostSave}
      />

      {/* Agent IA Modal */}
      <AgentIAModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onGenerate={() => {
          fetchPosts();
          setShowAgentModal(false);
        }}
      />

      {/* Post Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewPost(null)}>
          <div className="max-w-lg w-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-pink-400" />
                <span className="text-white font-semibold">Aperçu du post</span>
              </div>
              <button onClick={() => setPreviewPost(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Media Preview */}
            {previewPost.media_url && (
              <div className="bg-black aspect-[4/5] max-h-[50vh] flex items-center justify-center">
                {previewPost.media_type === 'video' ? (
                  <video
                    src={previewPost.media_url}
                    controls
                    autoPlay
                    muted
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <img
                    src={previewPost.media_url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Post Content */}
            <div className="p-4 space-y-3">
              {/* Platforms */}
              <div className="flex gap-2">
                {previewPost.platforms.map(platform => (
                  <span
                    key={platform}
                    className={`px-3 py-1 rounded-full text-xs text-white ${PLATFORM_COLORS[platform] || 'bg-gray-600'}`}
                  >
                    {platform}
                  </span>
                ))}
              </div>

              {/* Caption */}
              <p className="text-gray-200 text-sm whitespace-pre-wrap">{previewPost.caption}</p>

              {/* Status + Schedule */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[previewPost.status]}`}>
                  {STATUS_LABELS[previewPost.status]}
                </span>
                <span className="text-xs text-gray-400">
                  {previewPost.scheduled_date} à {previewPost.scheduled_time}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => { setPreviewPost(null); handleEditPost(previewPost); }} variant="secondary" className="flex-1 text-sm">
                  <Edit3 size={14} className="mr-2" /> Modifier
                </Button>
                <Button onClick={() => { setPreviewPost(null); handleDuplicatePost(previewPost); }} variant="secondary" className="flex-1 text-sm">
                  <Copy size={14} className="mr-2" /> Dupliquer
                </Button>
                {previewPost.status === 'draft' && (
                  <Button onClick={() => { setPreviewPost(null); handlePublishPost(previewPost); }} className="flex-1 text-sm">
                    <Send size={14} className="mr-2" /> Planifier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Post Modal */}
      {movePost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setMovePost(null)}>
          <div className="max-w-sm w-full bg-gray-900 rounded-xl border border-gray-700 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MoveRight size={20} className="text-yellow-400" />
              Déplacer le post
            </h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{movePost.caption.substring(0, 80)}...</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nouvelle date</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Nouvelle heure</label>
                <input
                  type="time"
                  value={moveTime}
                  onChange={(e) => setMoveTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setMovePost(null)} variant="secondary" className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleMovePost} className="flex-1">
                Déplacer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg backdrop-blur max-w-sm border animate-fade-in ${
              toast.type === 'error'
                ? 'bg-red-900/90 border-red-500/50 text-red-200'
                : toast.type === 'info'
                ? 'bg-blue-900/90 border-blue-500/50 text-blue-200'
                : 'bg-gray-900/90 border-pink-500/50 text-gray-200'
            }`}
          >
            <p className="text-sm">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
