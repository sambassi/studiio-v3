'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight, Bot, Upload, Plus, Trash2, AlertCircle } from 'lucide-react';
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
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Toast {
  id: string;
  message: string;
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

  // Fetch posts on mount and when month changes
  useEffect(() => {
    if (session?.user) {
      fetchPosts();
    }
  }, [currentDate, session]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const month = currentDate.toISOString().slice(0, 7); // YYYY-MM
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
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
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
  };

  const handleNewPost = () => {
    setShowPostModal(true);
  };

  const handlePostSave = (post: Partial<Post>) => {
    fetchPosts();
    setShowPostModal(false);
  };

  const showToast = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleImport = () => {
    showToast('Import CSV bientôt disponible');
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPosts();
        showToast('Post supprimé avec succès');
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Erreur lors de la suppression');
    }
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
  const calendarDays = [];
  for (let i = 0; i < firstDay - 1; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDateStr = selectedDate
    ? selectedDate.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : null;
  const selectedDayPosts = selectedDate ? getDayPosts(selectedDate.getDate()) : [];

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Calendrier IA</h1>
          <p className="text-gray-400">Planifiez et gérez vos posts sur les réseaux sociaux</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  {calendarDays.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => day && handleDayClick(day)}
                      className={`aspect-square rounded-lg font-semibold transition relative flex flex-col items-center justify-center ${
                        day === null
                          ? ''
                          : isToday(day)
                          ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                          : selectedDate?.getDate() === day
                          ? 'bg-gray-700 text-white border border-pink-500'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {day && (
                        <>
                          <span className="text-lg">{day}</span>
                          {getDayPosts(day).length > 0 && (
                            <div className="absolute bottom-2 flex gap-1">
                              {getDayPosts(day).slice(0, 3).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-pink-400"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
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
                  <Button
                    onClick={handleNewPost}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <Plus size={18} /> Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Posts */}
          <div>
            <Card className="card-base border border-gray-700 sticky top-8">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white">
                  {selectedDateStr ? `Posts du ${selectedDateStr}` : 'Sélectionnez une date'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedDate && selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      Aucun post prévu ce jour. Clique 'Nouveau post' pour en créer un!
                    </p>
                    <Button onClick={handleNewPost} className="w-full">
                      Nouveau post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayPosts.map(post => (
                      <div
                        key={post.id}
                        className={`p-4 bg-gray-800 rounded-lg cursor-pointer transition hover:bg-gray-700 ${
                          selectedPost?.id === post.id ? 'ring-2 ring-studiio-primary' : ''
                        }`}
                      >
                        <div
                          onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                          className="mb-3"
                        >
                          <p className="text-sm text-gray-300 mb-2">{post.caption.substring(0, 50)}...</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.platforms.map(platform => (
                              <span
                                key={platform}
                                className="px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{post.scheduled_time}</span>
                            <span className={
                              post.status === 'published'
                                ? 'text-green-400'
                                : post.status === 'scheduled'
                                ? 'text-blue-400'
                                : 'text-gray-400'
                            }>
                              {post.status}
                            </span>
                          </div>
                        </div>

                        {selectedPost?.id === post.id && (
                          <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                            {deleteConfirm === post.id ? (
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                                <p className="text-xs text-gray-300 mb-2">Confirmer la suppression ?</p>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleDeletePost(post.id)}
                                    variant="ghost"
                                    className="flex-1 text-red-400 hover:text-red-300 text-xs h-8"
                                  >
                                    Supprimer
                                  </Button>
                                  <Button
                                    onClick={() => setDeleteConfirm(null)}
                                    variant="ghost"
                                    className="flex-1 text-gray-400 text-xs h-8"
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setDeleteConfirm(post.id)}
                                variant="ghost"
                                className="w-full text-red-400 hover:text-red-300 text-xs h-8 flex items-center justify-center gap-2"
                              >
                                <Trash2 size={14} /> Supprimer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        selectedDate={selectedDate || undefined}
        onSave={handlePostSave}
      />

      <AgentIAModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        onGenerate={() => {
          fetchPosts();
          setShowAgentModal(false);
        }}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <Card key={toast.id} className="border-studiio-primary/50 bg-gray-900/95 backdrop-blur max-w-sm">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-200">{toast.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
