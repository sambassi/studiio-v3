'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Play, Film } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  format: string;
  status: string;
  created_at: string;
}

export function RecentVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?limit=5');
        const data = await res.json();
        if (data.success && data.data) {
          setVideos(data.data.items || data.data || []);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Termin\u00e9e';
      case 'rendering': return 'Rendu';
      case 'published': return 'Publi\u00e9e';
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

  return (
    <Card>
      <CardHeader className="border-b border-gray-800 pb-4">
        <CardTitle>Vid\u00e9os r\u00e9centes</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg" />
                  <div>
                    <div className="w-32 h-4 bg-gray-700 rounded mb-2" />
                    <div className="w-20 h-3 bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <Film className="mx-auto text-gray-600 mb-3" size={48} />
            <p className="text-gray-400 mb-2">Aucune vid\u00e9o pour le moment</p>
            <Link href="/dashboard/creator" className="text-studiio-primary hover:text-purple-400 font-semibold text-sm">
              Cr\u00e9er votre premi\u00e8re vid\u00e9o \u2192
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Play size={20} className="text-studiio-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{video.title}</p>
                    <p className="text-xs text-gray-400">
                      {video.format === 'reel' ? 'Reel 9:16' : 'TV 16:9'} \u2022 {formatDate(video.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(video.status)}>
                  {getStatusLabel(video.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <Link href="/dashboard/library" className="block text-center mt-4 text-studiio-primary hover:text-purple-400 font-semibold text-sm">
            Voir toutes les vid\u00e9os \u2192
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
