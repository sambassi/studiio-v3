'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Play, Trash2, Download, Film, Loader2, X } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  format: string;
  status: string;
  created_at: string;
  metadata?: {
    objective?: string;
    mode?: string;
    outputUrl?: string;
  };
}

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '12' });
        const res = await fetch(`/api/videos?${params}`);
        const data = await res.json();
        if (data.success) {
          setVideos(data.data || []);
          setTotal(data.total || 0);
          setHasMore(data.hasMore || false);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [page]);

  const filtered = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(search.toLowerCase()) &&
      (!filterStatus || video.status === filterStatus)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'rendering': return 'Rendu en cours';
      case 'published': return 'Publiée';
      default: return 'Brouillon';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success' as const;
      case 'rendering': return 'warning' as const;
      case 'published': return 'success' as const;
      default: return 'default' as const;
    }
  };

  const handleDownload = (video: Video) => {
    if (video.metadata?.outputUrl) {
      window.open(video.metadata.outputUrl, '_blank');
    } else {
      setToastMessage('URL de téléchargement non disponible');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleDelete = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
    setDeleteConfirm(null);
    setToastMessage('Vidéo supprimée');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bibliothèque</h1>
          <p className="text-gray-400">
            {total > 0 ? `${total} vidéo${total > 1 ? 's' : ''} créée${total > 1 ? 's' : ''}` : 'Gérez toutes vos vidéos créées'}
          </p>
        </div>
        <Link href="/dashboard/creator">
          <Button variant="primary" size="md">
            Créer une vidéo
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-end">
        <Input
          placeholder="Rechercher une vidéo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          options={[
            { value: 'completed', label: 'Terminée' },
            { value: 'rendering', label: 'Rendu en cours' },
            { value: 'draft', label: 'Brouillon' },
            { value: 'published', label: 'Publiée' },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-studiio-primary mr-3" size={24} />
          <span className="text-gray-400">Chargement...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Film className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">Aucune vidéo</h3>
          <p className="text-gray-400 mb-6">
            {search || filterStatus
              ? 'Aucune vidéo ne correspond à vos filtres'
              : 'Créez votre première vidéo pour la voir ici'}
          </p>
          {!search && !filterStatus && (
            <Link href="/dashboard/creator">
              <Button variant="primary" size="lg">
                Créer ma première vidéo
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video) => (
              <div key={video.id} className="card-base overflow-hidden hover:border-studiio-primary/50 transition group">
                <div className={`w-full bg-gray-800/50 flex items-center justify-center relative ${
                  video.format === 'reel' ? 'aspect-[9/16] max-h-64' : 'aspect-video'
                }`}>
                  {video.status === 'rendering' ? (
                    <Loader2 className="animate-spin text-studiio-accent" size={32} />
                  ) : (
                    <Play className="text-studiio-accent group-hover:scale-110 transition" size={48} />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-white text-sm truncate">{video.title}</p>
                    <p className="text-xs text-gray-400">
                      {video.format === 'reel' ? 'Reel 9:16' : 'TV 16:9'} • {formatDate(video.created_at)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant={getStatusVariant(video.status)}>
                      {getStatusLabel(video.status)}
                    </Badge>
                    {video.metadata?.objective && (
                      <span className="text-xs text-gray-500 capitalize">{video.metadata.objective}</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-800">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <Play size={14} className="mr-1" /> Aperçu
                    </Button>
                    {video.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(video)}
                        >
                          <Download size={14} />
                        </Button>
                        {deleteConfirm === video.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="primary" onClick={() => handleDelete(video.id)} className="bg-red-600 hover:bg-red-700 text-xs px-2">
                              Oui
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setDeleteConfirm(null)} className="text-xs px-2">
                              Non
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDeleteConfirm(video.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="ghost" onClick={() => setPage(p => p + 1)}>
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-800">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h2 className="text-xl font-semibold text-white">Détails de la vidéo</h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Titre</p>
                <p className="text-white font-medium">{selectedVideo.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Format</p>
                <p className="text-white">{selectedVideo.format === 'reel' ? 'Reel 9:16' : 'TV 16:9'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Statut</p>
                <Badge variant={getStatusVariant(selectedVideo.status)}>
                  {getStatusLabel(selectedVideo.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-white">{formatDate(selectedVideo.created_at)}</p>
              </div>
              {selectedVideo.metadata?.objective && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Objectif</p>
                  <p className="text-white capitalize">{selectedVideo.metadata.objective}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-800">
              <Button variant="primary" className="w-full" onClick={() => setSelectedVideo(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-3 rounded-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
