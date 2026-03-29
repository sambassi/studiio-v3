'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Sparkles, Upload, Loader2 } from 'lucide-react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  post?: any;
  onSave: (post: any) => void;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷' },
  { id: 'tiktok', label: 'TikTok', emoji: '♪' },
  { id: 'facebook', label: 'Facebook', emoji: 'f' },
  { id: 'youtube', label: 'YouTube Shorts', emoji: '▶️' },
];

export function PostModal({
  isOpen,
  onClose,
  selectedDate,
  post: initialPost,
  onSave,
}: PostModalProps) {
  const [activeTab, setActiveTab] = useState<'draft' | 'schedule' | 'publish'>('draft');
  const [caption, setCaption] = useState(initialPost?.caption || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialPost?.platforms || []
  );
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>(
    initialPost?.media_type || 'image'
  );
  const formatLocalDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [scheduledDate, setScheduledDate] = useState(
    initialPost?.scheduled_date ||
    (selectedDate ? formatLocalDate(selectedDate) : '')
  );
  const [scheduledTime, setScheduledTime] = useState(initialPost?.scheduled_time || '18:00');
  const [magicInput, setMagicInput] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [saving, setSaving] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');

      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAllPlatforms = () => {
    if (selectedPlatforms.length === PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(PLATFORMS.map(p => p.id));
    }
  };

  const generateCaption = async () => {
    if (!magicInput.trim()) return;

    setGeneratingCaption(true);
    try {
      const res = await fetch('/api/posts/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: magicInput,
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCaption(data.caption);
        setMagicInput('');
      }
    } catch (error) {
      console.error('Error generating caption:', error);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleSave = async () => {
    if (!caption.trim()) {
      alert('Veuillez entrer une légende');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Sélectionnez au moins une plateforme');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      formData.append('scheduled_date', scheduledDate);
      formData.append('scheduled_time', scheduledTime);
      formData.append('status', activeTab === 'draft' ? 'draft' : activeTab === 'schedule' ? 'scheduled' : 'published');
      formData.append('media_type', mediaType);

      if (media) {
        formData.append('media', media);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.data);
        onClose();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-base animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-2xl font-bold text-white">Nouveau Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-800">
            {[
              { id: 'draft', label: 'Brouillon' },
              { id: 'schedule', label: 'Planifié' },
              { id: 'publish', label: 'Publier' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Platforms Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Réseaux sociaux</h3>
              <button
                onClick={selectAllPlatforms}
                className="text-sm text-pink-400 hover:text-pink-300 transition"
              >
                {selectedPlatforms.length === PLATFORMS.length ? 'Désélectionner tout' : 'Sélectionner tous'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-pink-500 bg-pink-500/10 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl mr-2">{platform.emoji}</span>
                  <span className="font-medium">{platform.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Média</h3>
            <button
              onClick={() => mediaInputRef.current?.click()}
              className="w-full p-6 border-2 border-dashed border-gray-700 rounded-lg text-center hover:border-pink-500 transition text-gray-400"
            >
              <Upload className="mx-auto mb-2" size={24} />
              <p className="font-medium">GLISSE OU CLIQUE POUR AJOUTER UN MÉDIA</p>
              <p className="text-sm mt-1">MP4, MOV, JPG, PNG, WEBP, GIF</p>
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleMediaChange}
              className="hidden"
            />
            {media && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg text-sm text-gray-400">
                Fichier sélectionné: {media.name}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Heure</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Magic Input */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-400" />
              MAGIC INPUT
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Décris ton post</label>
                <textarea
                  value={magicInput}
                  onChange={(e) => setMagicInput(e.target.value)}
                  placeholder="Décris ce que tu veux voir dans le post..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none h-20"
                />
              </div>
              <Button
                onClick={generateCaption}
                disabled={generatingCaption || !magicInput.trim()}
                className="w-full flex items-center justify-center gap-2"
              >
                {generatingCaption ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  'Générer'
                )}
              </Button>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Légende
              <span className="text-gray-500 float-right">
                {caption.length}/2200
              </span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.substring(0, 2200))}
              placeholder="Écris ta légende..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none h-32"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder le post'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
