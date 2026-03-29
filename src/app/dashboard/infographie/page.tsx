'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Upload, X, Settings, Plus, Trash2, Music, Zap, Heart, Wifi, Clock,
  Image as ImageIcon, Loader2, Mic, Volume2, Type, Sparkles, CheckCircle
} from 'lucide-react';

interface InfoCard {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
  salesPhrase?: string;
}

type VoiceMode = 'off' | 'edge' | 'upload';

const EDGE_VOICES = [
  { id: 'fr-FR-DeniseNeural', label: 'Denise (Femme)' },
  { id: 'fr-FR-HenriNeural', label: 'Henri (Homme)' },
  { id: 'fr-FR-CoralieNeural', label: 'Coralie (Femme)' },
  { id: 'fr-FR-RemyMultilingualNeural', label: 'Rémy (Homme)' },
  { id: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (Femme)' },
];

const SALES_PHRASES = [
  'Réserve ta place maintenant !',
  'Offre limitée cette semaine',
  'Premier cours GRATUIT',
  'Rejoins la communauté',
  '-50% sur ton abonnement',
  'Essai gratuit 7 jours',
  'Booste ton énergie !',
  'Transforme ton corps',
  'Résultats garantis',
  'Inscription ouverte',
];

const THEMES = [
  { id: 'sommeil-sport', label: 'Sommeil & Sport' },
  { id: 'nutrition-danse', label: 'Nutrition & Danse' },
  { id: 'energie-cardio', label: 'Énergie & Cardio' },
  { id: 'stress-mental', label: 'Stress & Mental' },
  { id: 'communaute', label: 'Communauté' },
  { id: 'personnalise', label: 'Personnalisé' },
];

const THEME_DATA: Record<string, { title: string; subtitle: string; cards: InfoCard[]; salesPhrase: string; pexelsQuery: string }> = {
  'sommeil-sport': {
    title: 'SOMMEIL & SPORT',
    subtitle: 'Optimise ta récupération',
    cards: [
      { id: '1', icon: '😴', label: 'Heures de sommeil', value: '7-9h', color: '#6366f1' },
      { id: '2', icon: '💪', label: 'Performance', value: '+35%', color: '#818cf8' },
      { id: '3', icon: '🧠', label: 'Concentration', value: '+50%', color: '#a78bfa' },
      { id: '4', icon: '⚡', label: 'Énergie', value: 'MAX', color: '#c4b5fd' },
      { id: '5', icon: '🔄', label: 'Récupération', value: '2x', color: '#ddd6fe' },
    ],
    salesPhrase: 'Dors mieux, performe plus !',
    pexelsQuery: 'sleep fitness recovery',
  },
  'nutrition-danse': {
    title: 'NUTRITION & DANSE',
    subtitle: 'Nourris ton énergie',
    cards: [
      { id: '1', icon: '🥗', label: 'Protéines', value: '30g', color: '#22c55e' },
      { id: '2', icon: '💃', label: 'Calories brûlées', value: '500+', color: '#4ade80' },
      { id: '3', icon: '🍎', label: 'Fruits & Légumes', value: '5/jour', color: '#86efac' },
      { id: '4', icon: '💧', label: 'Hydratation', value: '2L', color: '#bbf7d0' },
      { id: '5', icon: '🔥', label: 'Métabolisme', value: '+25%', color: '#dcfce7' },
    ],
    salesPhrase: 'Mange bien, danse mieux !',
    pexelsQuery: 'healthy food dance fitness',
  },
  'energie-cardio': {
    title: 'ÉNERGIE & CARDIO',
    subtitle: 'Dépasse tes limites',
    cards: [
      { id: '1', icon: '⚡', label: 'Intensité', value: 'MAX', color: '#ff006e' },
      { id: '2', icon: '❤️', label: 'Fréquence', value: '140+', color: '#ff1493' },
      { id: '3', icon: '💃', label: 'Chorégraphie', value: '50+', color: '#ff69b4' },
      { id: '4', icon: '🎵', label: 'Playlist', value: '100%', color: '#ff85c0' },
      { id: '5', icon: '⏱️', label: 'Récupération', value: '-45%', color: '#ffc0cb' },
    ],
    salesPhrase: 'Booste ton énergie !',
    pexelsQuery: 'cardio workout energy fitness',
  },
  'stress-mental': {
    title: 'STRESS & MENTAL',
    subtitle: 'Libère ton esprit',
    cards: [
      { id: '1', icon: '🧘', label: 'Stress réduit', value: '-60%', color: '#06b6d4' },
      { id: '2', icon: '😌', label: 'Bien-être', value: '+80%', color: '#22d3ee' },
      { id: '3', icon: '🧠', label: 'Focus mental', value: 'MAX', color: '#67e8f9' },
      { id: '4', icon: '💤', label: 'Qualité sommeil', value: '+45%', color: '#a5f3fc' },
      { id: '5', icon: '🌿', label: 'Sérénité', value: '100%', color: '#cffafe' },
    ],
    salesPhrase: 'Libère ton stress, trouve la paix !',
    pexelsQuery: 'yoga meditation mental health',
  },
  'communaute': {
    title: 'COMMUNAUTÉ',
    subtitle: 'Ensemble on est plus forts',
    cards: [
      { id: '1', icon: '👥', label: 'Membres actifs', value: '500+', color: '#f59e0b' },
      { id: '2', icon: '🤝', label: 'Cours collectifs', value: '20+', color: '#fbbf24' },
      { id: '3', icon: '🏆', label: 'Challenges', value: '12/an', color: '#fcd34d' },
      { id: '4', icon: '💬', label: 'Échanges', value: '∞', color: '#fde68a' },
      { id: '5', icon: '🎉', label: 'Événements', value: '4/mois', color: '#fef3c7' },
    ],
    salesPhrase: 'Rejoins la communauté !',
    pexelsQuery: 'group fitness community workout',
  },
  'personnalise': {
    title: 'PERSONNALISÉ',
    subtitle: 'Créé par IA pour toi',
    cards: [
      { id: '1', icon: '🤖', label: 'IA Optimisé', value: '100%', color: '#a855f7' },
      { id: '2', icon: '🎯', label: 'Objectif', value: 'SUR MESURE', color: '#c084fc' },
      { id: '3', icon: '📈', label: 'Résultats', value: '+75%', color: '#d8b4fe' },
      { id: '4', icon: '⭐', label: 'Satisfaction', value: '5/5', color: '#e9d5ff' },
      { id: '5', icon: '🚀', label: 'Progression', value: 'RAPIDE', color: '#f3e8ff' },
    ],
    salesPhrase: 'Ton programme sur mesure !',
    pexelsQuery: 'personal training fitness',
  },
};

const DEFAULT_CARDS: InfoCard[] = [
  { id: '1', icon: '⚡', label: 'Intensité', value: 'MAX', color: '#ff006e' },
  { id: '2', icon: '❤️', label: 'Fréquence', value: '140+', color: '#ff1493' },
  { id: '3', icon: '💃', label: 'Chorégraphie', value: '50+', color: '#ff69b4' },
  { id: '4', icon: '🎵', label: 'Playlist', value: '100%', color: '#ff85c0' },
  { id: '5', icon: '⏱️', label: 'Récupération', value: '-45%', color: '#ffc0cb' },
];

export default function InfographiePage() {
  const { data: session } = useSession();
  const [selectedTheme, setSelectedTheme] = useState('energie-cardio');
  const [batchMode, setBatchMode] = useState(false);
  const [title, setTitle] = useState('ÉNERGIE & CARDIO');
  const [subtitle, setSubtitle] = useState('');
  const [cards, setCards] = useState<InfoCard[]>(DEFAULT_CARDS);
  const [photoPersonnage, setPhotoPersonnage] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [mixVideo, setMixVideo] = useState<File | null>(null);
  const [music, setMusic] = useState<File | null>(null);
  const [voixOff, setVoixOff] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [duration, setDuration] = useState(30);
  const [rendering, setRendering] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [salesPhrase, setSalesPhrase] = useState('');

  // Voix off state
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [selectedVoice, setSelectedVoice] = useState(EDGE_VOICES[0].id);
  const [voiceText, setVoiceText] = useState('');
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [voiceGenerated, setVoiceGenerated] = useState(false);

  // Batch photos
  const [batchPhotos, setBatchPhotos] = useState<(File | null)[]>(Array(10).fill(null));
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mixVideoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const voixOffInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Export destination
  type ExportDestination = 'desktop' | 'calendar' | 'both';
  const [exportDestination, setExportDestination] = useState<'desktop' | 'calendar' | 'both'>('calendar');
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'uploading' | 'rendering' | 'completed' | 'error'>('idle');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Photo Affiche
  const [photoAfficheEnabled, setPhotoAfficheEnabled] = useState(false);
  const [photoAfficheMode, setPhotoAfficheMode] = useState<'pexels' | 'upload'>('pexels');
  const [photoAfficheUrl, setPhotoAfficheUrl] = useState<string | null>(null);
  const [photoAfficheFile, setPhotoAfficheFile] = useState<File | null>(null);
  const [photoAfficheLoading, setPhotoAfficheLoading] = useState(false);
  const photoAfficheInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPersonnage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCharacterPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  const updateCard = (id: string, field: keyof InfoCard, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const addCard = () => {
    setCards([...cards, {
      id: Date.now().toString(),
      icon: '✨',
      label: 'Nouveau',
      value: '0',
      color: '#ff1493',
    }]);
  };

  const generateVoiceOver = async () => {
    if (!voiceText.trim()) return;
    setGeneratingVoice(true);
    try {
      const res = await fetch('/api/tts/edge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText, voice: selectedVoice }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], 'voix-off-infographie.mp3', { type: 'audio/mpeg' });
        setVoixOff(file);
        setVoiceGenerated(true);
      } else {
        setToastMsg('Service TTS indisponible - utilisez upload');
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (error) {
      console.error('TTS error:', error);
    } finally {
      setGeneratingVoice(false);
    }
  };

  const fetchPexelsPhoto = async (query?: string) => {
    setPhotoAfficheLoading(true);
    try {
      const searchQuery = query || THEME_DATA[selectedTheme]?.pexelsQuery || 'fitness';
      const res = await fetch(`/api/pexels/search?q=${encodeURIComponent(searchQuery)}&per_page=15`);
      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
          setPhotoAfficheUrl(randomPhoto.src?.medium || randomPhoto.src?.original || null);
        }
      }
    } catch (error) {
      console.error('Pexels error:', error);
    } finally {
      setPhotoAfficheLoading(false);
    }
  };

  const handlePhotoAfficheUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoAfficheFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoAfficheUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBatchPhotoUpload = (index: number, file: File) => {
    const updated = [...batchPhotos];
    updated[index] = file;
    setBatchPhotos(updated);
  };

  const handleExport = async () => {
    if (!session?.user) return;

    setRendering(true);
    setRenderStatus('uploading');
    setRenderProgress(10);
    setRenderError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('theme', selectedTheme);
      formData.append('cards', JSON.stringify(cards));
      formData.append('duration', duration.toString());
      formData.append('batch', batchMode.toString());
      formData.append('destination', exportDestination);
      formData.append('salesPhrase', salesPhrase);

      if (photoPersonnage) formData.append('character', photoPersonnage);
      if (mixVideo) formData.append('mixVideo', mixVideo);
      if (music) formData.append('music', music);
      if (voixOff) formData.append('voixOff', voixOff);
      if (logo) formData.append('logo', logo);
      if (photoAfficheEnabled && photoAfficheUrl) {
        formData.append('photoAfficheUrl', photoAfficheUrl);
        if (photoAfficheFile) formData.append('photoAffiche', photoAfficheFile);
      }

      // Upload batch photos if in batch mode
      if (batchMode) {
        batchPhotos.forEach((photo, i) => {
          if (photo) formData.append(`batchPhoto_${i}`, photo);
        });
      }

      setRenderProgress(30);
      setRenderStatus('rendering');

      const response = await fetch('/api/infographie', {
        method: 'POST',
        body: formData,
      });

      setRenderProgress(70);

      const data = await response.json();

      if (data.success) {
        setRenderProgress(100);
        setRenderStatus('completed');

        // If destination includes calendar, show calendar message
        if (exportDestination === 'calendar' || exportDestination === 'both') {
          setToastMsg(batchMode
            ? '10 infographies ajoutées en brouillon au calendrier !'
            : 'Infographie ajoutée en brouillon au calendrier !');
        }
        if (exportDestination === 'desktop' || exportDestination === 'both') {
          setToastMsg(prev => (prev ? prev + ' Export disponible.' : 'Export disponible sur le bureau.'));
        }
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        setRenderStatus('error');
        setRenderError(data.error || 'Erreur lors du rendu');
      }
    } catch (error) {
      console.error(error);
      setRenderStatus('error');
      setRenderError('Erreur réseau');
    } finally {
      // Don't reset rendering if completed - let user see the result
      if (renderStatus === 'error') {
        setRendering(false);
      }
    }
  };

  const resetRender = () => {
    setRendering(false);
    setRenderStatus('idle');
    setRenderProgress(0);
    setRenderError(null);
  };

  return (
    <div className="space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Créateur d'Infographie</h1>
          <p className="text-gray-400">Créez des vidéos d'infographies animées en quelques clics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Selection */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sélectionner un thème</h3>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setSelectedTheme(theme.id);
                        const data = THEME_DATA[theme.id];
                        if (data) {
                          setTitle(data.title);
                          setSubtitle(data.subtitle);
                          setCards(data.cards.map(c => ({ ...c, id: Date.now().toString() + c.id })));
                          setSalesPhrase(data.salesPhrase);
                          // Auto-fetch pexels photo if photo affiche is enabled
                          if (photoAfficheEnabled) {
                            fetchPexelsPhoto(data.pexelsQuery);
                          }
                        }
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition ${
                        selectedTheme === theme.id
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Batch Mode */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Mode BATCH x10</h3>
                    <p className="text-sm text-gray-400">Générer 10 variantes automatiquement</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchMode}
                      onChange={(e) => setBatchMode(e.target.checked)}
                      className="w-6 h-6 rounded"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Title & Subtitle */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Texte Principal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ÉNERGIE & CARDIO"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sous-titre</label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Sous-titre (optionnel)"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Cartes d'Information</h3>
                  <Button
                    onClick={addCard}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} /> Ajouter
                  </Button>
                </div>

                <div className="space-y-3">
                  {cards.map(card => (
                    <div key={card.id} className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
                      <div className="text-3xl">{card.icon}</div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Input
                          value={card.label}
                          onChange={(e) => updateCard(card.id, 'label', e.target.value)}
                          placeholder="Label"
                          className="bg-gray-700 border-gray-600 text-pink-400"
                        />
                        <Input
                          value={card.value}
                          onChange={(e) => updateCard(card.id, 'value', e.target.value)}
                          placeholder="Valeur"
                          className="bg-gray-700 border-gray-600 text-green-400"
                        />
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={card.color}
                            onChange={(e) => updateCard(card.id, 'color', e.target.value)}
                            className="w-full h-10 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => removeCard(card.id)}
                            className="text-gray-400 hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phrase de vente courte */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Type size={18} className="text-pink-400" /> Phrase de vente
                </h3>
                <Input
                  value={salesPhrase}
                  onChange={(e) => setSalesPhrase(e.target.value)}
                  placeholder="Ex: Réserve ta place maintenant !"
                  className="bg-gray-800 border-gray-700 text-white mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {SALES_PHRASES.map((phrase, i) => (
                    <button
                      key={i}
                      onClick={() => setSalesPhrase(phrase)}
                      className={`px-3 py-1.5 rounded-full text-xs transition ${
                        salesPhrase === phrase
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Photo Affiche */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ImageIcon size={18} className="text-purple-400" /> Photo Affiche
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded ml-1">Pexels</span>
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoAfficheEnabled}
                      onChange={(e) => {
                        setPhotoAfficheEnabled(e.target.checked);
                        if (e.target.checked && photoAfficheMode === 'pexels' && !photoAfficheUrl) {
                          fetchPexelsPhoto();
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {photoAfficheEnabled && (
                  <div className="space-y-4">
                    {/* Mode selector */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPhotoAfficheMode('pexels');
                          if (!photoAfficheUrl) fetchPexelsPhoto();
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border ${
                          photoAfficheMode === 'pexels'
                            ? 'border-purple-500 bg-purple-500/10 text-white'
                            : 'border-gray-700 bg-gray-800 text-gray-400'
                        }`}
                      >
                        🖼️ Pexels (auto)
                      </button>
                      <button
                        onClick={() => setPhotoAfficheMode('upload')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition border ${
                          photoAfficheMode === 'upload'
                            ? 'border-purple-500 bg-purple-500/10 text-white'
                            : 'border-gray-700 bg-gray-800 text-gray-400'
                        }`}
                      >
                        📤 Upload
                      </button>
                    </div>

                    {/* Pexels mode */}
                    {photoAfficheMode === 'pexels' && (
                      <div>
                        {photoAfficheLoading ? (
                          <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                            <Loader2 size={24} className="text-purple-400 animate-spin" />
                          </div>
                        ) : photoAfficheUrl ? (
                          <div className="relative group">
                            <img
                              src={photoAfficheUrl}
                              alt="Photo affiche"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => fetchPexelsPhoto()}
                              className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                              title="Changer la photo"
                            >
                              <Sparkles size={16} />
                            </button>
                            <p className="text-[10px] text-gray-500 mt-1">Photo Pexels • Cliquez pour changer</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => fetchPexelsPhoto()}
                            className="w-full h-48 bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 transition border-2 border-dashed border-gray-700 hover:border-purple-500"
                          >
                            <Sparkles size={24} className="mb-2" />
                            <span className="text-sm">Générer une photo</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Upload mode */}
                    {photoAfficheMode === 'upload' && (
                      <div>
                        {photoAfficheFile && photoAfficheUrl ? (
                          <div className="relative group">
                            <img
                              src={photoAfficheUrl}
                              alt="Photo affiche uploadée"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => { setPhotoAfficheFile(null); setPhotoAfficheUrl(null); }}
                              className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => photoAfficheInputRef.current?.click()}
                            className="w-full h-48 bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 transition border-2 border-dashed border-gray-700 hover:border-purple-500"
                          >
                            <Upload size={24} className="mb-2" />
                            <span className="text-sm">Cliquez pour ajouter votre photo</span>
                          </button>
                        )}
                        <input
                          ref={photoAfficheInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoAfficheUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Batch photos (different per video) */}
            {batchMode && (
              <Card className="card-base border border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon size={18} className="text-purple-400" /> Photos par vidéo (Batch)
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Chaque vidéo peut avoir une photo de personnage différente</p>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <label key={i} className="aspect-square bg-gray-800 rounded-lg border border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition overflow-hidden">
                        {batchPhotos[i] ? (
                          <div className="w-full h-full relative">
                            <img
                              src={URL.createObjectURL(batchPhotos[i]!)}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[8px] text-white py-0.5">
                              #{i + 1}
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload size={12} className="text-gray-500" />
                            <span className="text-[8px] text-gray-500 mt-0.5">#{i + 1}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleBatchPhotoUpload(i, e.target.files[0])}
                        />
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo Personnage */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Photo Personnage</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!photoPersonnage}
                      onChange={() => {
                        if (photoPersonnage) {
                          setPhotoPersonnage(null);
                          setCharacterPreview(null);
                        } else {
                          photoInputRef.current?.click();
                        }
                      }}
                      className="w-6 h-6 rounded"
                    />
                  </label>
                </div>
                {photoPersonnage ? (
                  <div className="text-sm text-gray-400">
                    Fichier sélectionné: {photoPersonnage.name}
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-700 rounded-lg text-center hover:border-pink-500 transition text-gray-400"
                  >
                    Cliquez pour ajouter une photo
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Preview */}
            <Card className="card-base border border-gray-700 sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Aperçu</h3>
                <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-purple-900 to-gray-900 p-4 flex flex-col justify-between text-white">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-2">{(THEMES.find(t => t.id === selectedTheme)?.label || selectedTheme).toUpperCase()}</div>
                      <h2 className="text-2xl font-bold mb-2">{title}</h2>
                      <p className="text-sm text-gray-300">{subtitle}</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      {cards.slice(0, 3).map(card => (
                        <div key={card.id} className="flex items-center gap-2 p-2 rounded"
                          style={{ backgroundColor: card.color + '20', borderLeft: `3px solid ${card.color}` }}>
                          <span>{card.icon}</span>
                          <span style={{ color: card.color }}>{card.label}</span>
                          <span className="text-white ml-auto font-bold">{card.value}</span>
                        </div>
                      ))}
                    </div>

                    {salesPhrase && (
                      <div className="text-center py-1">
                        <span className="text-yellow-400 text-xs font-bold">{salesPhrase}</span>
                      </div>
                    )}

                    <button className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded font-semibold text-sm">
                      EN SAVOIR PLUS
                    </button>

                    {voiceMode !== 'off' && (
                      <div className="text-center">
                        <span className="text-[10px] text-blue-300 flex items-center justify-center gap-1">
                          <Mic size={8} /> Voix off activée
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Files */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Médias</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Music size={16} /> Musique
                    </label>
                    <button
                      onClick={() => musicInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm transition"
                    >
                      {music ? '✓ ' + music.name : 'Choisir une musique'}
                    </button>
                    <input
                      ref={musicInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload(setMusic)}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Zap size={16} /> Mix Vidéo
                    </label>
                    <button
                      onClick={() => mixVideoInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm transition"
                    >
                      {mixVideo ? '✓ ' + mixVideo.name : 'Choisir une vidéo'}
                    </button>
                    <input
                      ref={mixVideoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload(setMixVideo)}
                      className="hidden"
                    />
                  </div>

                  {/* Voix off section with Edge TTS / Upload choice */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Mic size={14} /> Voix Off
                    </label>
                    <div className="flex gap-1 mb-2">
                      {([
                        { id: 'off' as VoiceMode, label: 'Aucune' },
                        { id: 'edge' as VoiceMode, label: 'Edge TTS' },
                        { id: 'upload' as VoiceMode, label: 'Upload' },
                      ]).map(v => (
                        <button
                          key={v.id}
                          onClick={() => setVoiceMode(v.id)}
                          className={`flex-1 p-1.5 rounded text-xs transition ${voiceMode === v.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    {voiceMode === 'edge' && (
                      <div className="space-y-2">
                        <select
                          value={selectedVoice}
                          onChange={e => setSelectedVoice(e.target.value)}
                          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                        >
                          {EDGE_VOICES.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </select>
                        <textarea
                          value={voiceText}
                          onChange={e => setVoiceText(e.target.value)}
                          placeholder="Texte à lire..."
                          className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs resize-none h-14"
                        />
                        <button
                          onClick={generateVoiceOver}
                          disabled={generatingVoice || !voiceText.trim()}
                          className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-white text-xs flex items-center justify-center gap-1"
                        >
                          {generatingVoice ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                          {voiceGenerated ? 'Régénérer' : 'Générer'}
                        </button>
                        {voiceGenerated && (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircle size={10} /> Voix off générée
                          </div>
                        )}
                      </div>
                    )}

                    {voiceMode === 'upload' && (
                      <>
                        <button
                          onClick={() => voixOffInputRef.current?.click()}
                          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm transition"
                        >
                          {voixOff ? '✓ ' + voixOff.name : 'Ajouter une voix off'}
                        </button>
                        <input
                          ref={voixOffInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload(setVoixOff)}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Logo</label>
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-sm transition"
                    >
                      {logo ? '✓ ' + logo.name : 'Ajouter un logo'}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload(setLogo)}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Durée (s)</label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                      min="5"
                      max="120"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Destination */}
            <Card className="card-base border border-gray-700">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-white mb-3">Destination</h4>
                <div className="space-y-2">
                  {([
                    { id: 'calendar' as const, label: 'Calendrier (brouillon)', icon: '📅' },
                    { id: 'desktop' as const, label: 'Export fichier', icon: '💾' },
                    { id: 'both' as const, label: 'Les deux', icon: '🔄' },
                  ]).map(dest => (
                    <button
                      key={dest.id}
                      onClick={() => setExportDestination(dest.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                        exportDestination === dest.id
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <span>{dest.icon}</span>
                      <span>{dest.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Button + Progress */}
            {renderStatus === 'completed' ? (
              <div className="text-center space-y-3">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-medium">
                    {batchMode ? '10 infographies créées !' : 'Infographie créée !'}
                  </p>
                  {(exportDestination === 'calendar' || exportDestination === 'both') && (
                    <a href="/dashboard/calendar" className="text-purple-400 text-sm hover:underline block mt-2">
                      Voir le calendrier →
                    </a>
                  )}
                </div>
                <button onClick={resetRender} className="text-gray-400 text-sm hover:text-white transition">
                  Créer une nouvelle infographie
                </button>
              </div>
            ) : renderStatus === 'error' ? (
              <div className="text-center space-y-3">
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{renderError}</p>
                </div>
                <button onClick={resetRender} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rendering && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{renderStatus === 'uploading' ? 'Upload des fichiers...' : 'Rendu en cours...'}</span>
                      <span>{renderProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={handleExport}
                  disabled={rendering}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {rendering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rendu en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {batchMode ? 'EXPORTER BATCH x10' : 'EXPORTER LA VIDÉO'}
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500">
                  {batchMode ? '50 crédits' : '25 crédits'} • Destination : {
                    exportDestination === 'calendar' ? 'Calendrier' :
                    exportDestination === 'desktop' ? 'Export' : 'Calendrier + Export'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
