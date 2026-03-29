'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Upload, X, Play, Film, Plus, Trash2,
  Zap, Target, Eye, Heart, TrendingUp, ChevronRight, ChevronLeft,
  Music, Image, Clock, Loader2, AlertCircle, CheckCircle,
  Sparkles, Mic, Volume2, RefreshCw, Calendar, Download,
  Copy, Settings, Wand2, FileText, ArrowUp, ArrowDown, Type, Search
} from 'lucide-react';

// Types
interface VideoSlot {
  id: string;
  file: File | null;
  preview: string | null;
  name: string;
  type?: 'video' | 'title-card';
  titleText?: string;
  duration?: number;
}

interface TimelineItem {
  id: string;
  type: 'intro' | 'video' | 'text' | 'objective' | 'outro';
  duration: number;
  label: string;
  text?: string;
}

type VideoFormat = 'reel' | 'tv';
type VideoMode = 'cardio' | 'témoignage';
type Objective = 'promotion' | 'abonnement' | 'motivation' | 'bienfaits' | 'nutrition';
type VoiceMode = 'off' | 'edge' | 'upload';
type BatchDestination = 'calendar' | 'export' | 'both';

const OBJECTIVES = [
  { value: 'promotion' as Objective, label: 'Promotion', icon: TrendingUp, color: 'text-orange-400' },
  { value: 'abonnement' as Objective, label: 'Abonnement', icon: Heart, color: 'text-pink-400' },
  { value: 'motivation' as Objective, label: 'Motivation', icon: Zap, color: 'text-yellow-400' },
  { value: 'bienfaits' as Objective, label: 'Bienfaits', icon: Eye, color: 'text-green-400' },
  { value: 'nutrition' as Objective, label: 'Nutrition', icon: Target, color: 'text-blue-400' },
];

const EDGE_VOICES = [
  { id: 'fr-FR-DeniseNeural', label: 'Denise (Femme)', lang: 'Français' },
  { id: 'fr-FR-HenriNeural', label: 'Henri (Homme)', lang: 'Français' },
  { id: 'fr-FR-CoralieNeural', label: 'Coralie (Femme)', lang: 'Français' },
  { id: 'fr-FR-RemyMultilingualNeural', label: 'Rémy (Homme)', lang: 'Français' },
  { id: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (Femme)', lang: 'Français' },
];

// IA title suggestions based on objective
const TITLE_SUGGESTIONS: Record<Objective, string[]> = {
  promotion: [
    'OFFRE SPÉCIALE RENTRÉE',
    'PROMO FLASH -50%',
    'DEAL EXCLUSIF CETTE SEMAINE',
    'BOOSTE TON ÉNERGIE',
    'OFFRE LIMITÉE ABONNEMENT',
  ],
  abonnement: [
    'REJOINS LA TEAM',
    'TON PREMIER COURS OFFERT',
    'ABONNE-TOI MAINTENANT',
    'NOUVEAU MEMBRE ? BIENVENUE !',
    'ESSAI GRATUIT 7 JOURS',
  ],
  motivation: [
    'TU PEUX LE FAIRE',
    'DÉPASSE TES LIMITES',
    'CHAQUE JOUR COMPTE',
    'OBJECTIF : MEILLEURE VERSION',
    'BOUGE, TRANSPIRE, SOURIS',
  ],
  bienfaits: [
    'LES BIENFAITS DU SPORT',
    'TON CORPS TE REMERCIE',
    'SANTÉ & BIEN-ÊTRE',
    'BOOST TON IMMUNITÉ',
    'ÉNERGIE AU QUOTIDIEN',
  ],
  nutrition: [
    'MANGE BIEN, BOUGE BIEN',
    'NUTRITION & PERFORMANCE',
    'TES REPAS POST-WORKOUT',
    'HYDRATE-TOI',
    'PROTÉINES & RÉCUPÉRATION',
  ],
};

const SUBTITLE_SUGGESTIONS: Record<Objective, string[]> = {
  promotion: [
    'Ne rate pas cette opportunité',
    'Valable pour les 50 premiers',
    'Seulement cette semaine',
  ],
  abonnement: [
    'Lance-toi dès maintenant',
    'Ton futur commence ici',
    'Réserve ta place',
  ],
  motivation: [
    'Chaque effort compte',
    'Tu es plus fort que tu ne le crois',
    'C\'est maintenant ou jamais',
  ],
  bienfaits: [
    'Découvre les effets sur ton corps',
    'Des résultats prouvés scientifiquement',
    'Investis dans ta santé',
  ],
  nutrition: [
    'Des conseils adaptés à tes objectifs',
    'Optimise ta récupération',
    'Le carburant de ta performance',
  ],
};

const MAX_SLOTS = 10;

export default function CreatorPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [credits, setCredits] = useState(0);

  // Step 1: Setup
  const [format, setFormat] = useState<VideoFormat>('reel');
  const [mode, setMode] = useState<VideoMode>('cardio');
  const [selectedObjectives, setSelectedObjectives] = useState<Objective[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);

  // Step 2: Media
  const [rushSlots, setRushSlots] = useState<VideoSlot[]>([
    { id: '1', file: null, preview: null, name: '' },
  ]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [characterMode, setCharacterMode] = useState<'upload' | 'ai'>('upload');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiCharacterUrl, setAiCharacterUrl] = useState<string | null>(null);
  const [aiCharacterLoading, setAiCharacterLoading] = useState(false);

  // Voix off
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [selectedVoice, setSelectedVoice] = useState(EDGE_VOICES[0].id);
  const [voiceText, setVoiceText] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [generatingVoice, setGeneratingVoice] = useState(false);

  // Step 3: Timeline
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Step 4: Render
  const [rendering, setRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(3);
  const [batchTitles, setBatchTitles] = useState<string[]>([]);
  const [batchDestination, setBatchDestination] = useState<BatchDestination>('calendar');

  // Preview ref
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch credits
  useEffect(() => {
    if (session?.user) {
      fetch('/api/credits/balance')
        .then(r => r.json())
        .then(d => { if (d.data?.credits !== undefined) setCredits(d.data.credits); })
        .catch(() => {});
    }
  }, [session]);

  // Build timeline automatically when entering step 3
  useEffect(() => {
    if (step === 3) {
      buildTimeline();
    }
  }, [step]);

  // Generate batch titles when batch mode is enabled
  useEffect(() => {
    if (batchMode && batchTitles.length === 0) {
      generateBatchTitles();
    }
  }, [batchMode]);

  const generateBatchTitles = () => {
    const allSuggestions: string[] = [];
    selectedObjectives.forEach(obj => {
      allSuggestions.push(...(TITLE_SUGGESTIONS[obj] || []));
    });
    // Shuffle and take batchCount
    const shuffled = allSuggestions.sort(() => Math.random() - 0.5);
    setBatchTitles(shuffled.slice(0, batchCount));
  };

  const buildTimeline = useCallback(() => {
    const items: TimelineItem[] = [];
    let id = 0;

    // Intro
    items.push({ id: String(id++), type: 'intro', duration: 3, label: 'Intro - ' + title });

    // Objectives as text cards
    selectedObjectives.forEach(obj => {
      const objData = OBJECTIVES.find(o => o.value === obj);
      items.push({
        id: String(id++),
        type: 'objective',
        duration: 2,
        label: objData?.label || obj,
        text: objData?.label || obj,
      });
    });

    // Videos
    rushSlots.forEach((slot, i) => {
      if (slot.file) {
        items.push({
          id: String(id++),
          type: 'video',
          duration: 4,
          label: slot.name || `Rush ${i + 1}`,
        });
      }
    });

    // Outro
    items.push({ id: String(id++), type: 'outro', duration: 3, label: 'Outro' });

    setTimeline(items);
  }, [title, selectedObjectives, rushSlots]);

  const totalDuration = timeline.reduce((sum, item) => sum + item.duration, 0);
  const renderCost = batchMode
    ? (format === 'reel' ? 10 : 15) * batchCount
    : (format === 'reel' ? 10 : 15);
  const canRender = credits >= renderCost;

  // Rush slot handlers
  const addSlot = () => {
    if (rushSlots.length < MAX_SLOTS) {
      setRushSlots([...rushSlots, { id: String(Date.now()), file: null, preview: null, name: '' }]);
    }
  };

  const removeSlot = (index: number) => {
    if (rushSlots.length > 1) {
      const updated = [...rushSlots];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      updated.splice(index, 1);
      setRushSlots(updated);
    }
  };

  const moveSlot = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rushSlots.length) return;
    const updated = [...rushSlots];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setRushSlots(updated);
  };

  const addTitleCard = () => {
    if (rushSlots.length < MAX_SLOTS) {
      setRushSlots([...rushSlots, {
        id: String(Date.now()),
        file: null,
        preview: null,
        name: 'Carte titre',
        type: 'title-card',
        titleText: '',
      }]);
    }
  };

  const handleRushUpload = (index: number, file: File) => {
    const preview = URL.createObjectURL(file);
    const updated = [...rushSlots];
    if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
    updated[index] = {
      ...updated[index],
      file,
      preview,
      name: file.name.replace(/\.[^/.]+$/, ''),
    };
    setRushSlots(updated);
    // Get real video duration (don't revoke - same blob URL used for preview)
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      const dur = Math.round(vid.duration);
      setRushSlots(prev => prev.map((s, j) => j === index ? { ...s, duration: dur } : s));
    };
    vid.src = preview;
  };

  const handleCharacterUpload = (file: File) => {
    if (characterPreview) URL.revokeObjectURL(characterPreview);
    setCharacterFile(file);
    setCharacterPreview(URL.createObjectURL(file));
  };

  // Fetch Pexels photo for AI character
  const fetchAiCharacter = async (query?: string) => {
    const searchTerm = query || aiSearchQuery || selectedObjectives.join(' ') || 'fitness athlete';
    setAiCharacterLoading(true);
    try {
      const res = await fetch(`/api/pexels/search?q=${encodeURIComponent(searchTerm + ' person portrait')}&per_page=5`);
      const data = await res.json();
      if (data.photos?.length) {
        const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
        const url = photo.src?.medium || photo.src?.large || photo.url;
        setAiCharacterUrl(url);
        setCharacterPreview(url);
      }
    } catch (e) { console.error('Pexels fetch error:', e); }
    setAiCharacterLoading(false);
  };

  // Timeline duration change
  const updateDuration = (index: number, duration: number) => {
    const updated = [...timeline];
    updated[index] = { ...updated[index], duration: Math.max(1, Math.min(30, duration)) };
    setTimeline(updated);
  };

  // Apply IA title suggestion
  const applySuggestion = (suggestion: string) => {
    setTitle(suggestion);
    // Also suggest a subtitle
    const allSubtitles: string[] = [];
    selectedObjectives.forEach(obj => {
      allSubtitles.push(...(SUBTITLE_SUGGESTIONS[obj] || []));
    });
    if (allSubtitles.length > 0) {
      setSubtitle(allSubtitles[Math.floor(Math.random() * allSubtitles.length)]);
    }
    setShowTitleSuggestions(false);
  };

  // Generate voice over via Edge TTS
  const generateVoiceOver = async () => {
    if (!voiceText.trim()) return;
    setGeneratingVoice(true);
    try {
      const res = await fetch('/api/tts/edge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voiceText,
          voice: selectedVoice,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], 'voix-off.mp3', { type: 'audio/mpeg' });
        setVoiceFile(file);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Erreur lors de la génération de la voix. Utilisez l\'option upload.');
      }
    } catch (error) {
      console.error('Error generating voice:', error);
      alert('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setGeneratingVoice(false);
    }
  };

  // Submit render
  const handleRender = async () => {
    if (!session?.user || rendering) return;
    setRendering(true);
    setRenderError(null);
    setRenderStatus('Upload des fichiers...');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('format', format);
      formData.append('mode', mode);
      formData.append('objectives', JSON.stringify(selectedObjectives));
      formData.append('timeline', JSON.stringify(timeline));

      formData.append('destination', batchDestination);
      if (batchMode) {
        formData.append('batch', 'true');
        formData.append('batchCount', String(batchCount));
        formData.append('batchTitles', JSON.stringify(batchTitles));
        formData.append('batchDestination', batchDestination);
      }

      // Upload rush files
      rushSlots.forEach((slot, i) => {
        if (slot.file) {
          formData.append(`rush_${i}`, slot.file);
        }
      });

      if (musicFile) formData.append('music', musicFile);
      if (characterFile) formData.append('character', characterFile);
      if (voiceFile) formData.append('voiceover', voiceFile);

      setRenderStatus('Lancement du rendu...');

      const res = await fetch('/api/videos/render', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du rendu');
      }

      setVideoId(data.data.videoId);
      setRenderStatus('Rendu en cours...');

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/videos/status?id=${data.data.videoId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setRenderStatus('completed');
            setRendering(false);
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            setRenderError(statusData.errorMessage || 'Erreur de rendu');
            setRendering(false);
          }
        } catch {
          // continue polling
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (rendering) {
          setRenderError('Timeout - le rendu prend trop de temps');
          setRendering(false);
        }
      }, 300000);

    } catch (err: any) {
      setRenderError(err.message);
      setRendering(false);
    }
  };

  // Toggle objective
  const toggleObjective = (obj: Objective) => {
    setSelectedObjectives(prev =>
      prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
    );
  };

  // Step navigation
  const canGoNext = () => {
    if (step === 1) return title.length > 0 && selectedObjectives.length > 0;
    if (step === 2) return rushSlots.some(s => s.file !== null);
    if (step === 3) return timeline.length > 0;
    return false;
  };

  // Live Preview Component
  const LivePreview = () => {
    const rushWithFile = rushSlots.find(s => s.preview);
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
          <Eye size={14} className="text-pink-400" />
          <span className="text-xs font-medium text-gray-300">Aperçu en temps réel</span>
        </div>
        <div className={`relative mx-auto ${format === 'reel' ? 'aspect-[9/16] max-w-[200px]' : 'aspect-video max-w-[320px]'} bg-black`}>
          {/* Video background */}
          {rushWithFile?.preview && (
            <video
              src={rushWithFile.preview}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          {!rushWithFile?.preview && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
              <Film size={30} className="text-gray-600" />
            </div>
          )}

          {/* Character overlay */}
          {characterPreview && (
            <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
              <img src={characterPreview} className="w-full h-full object-cover" alt="" />
            </div>
          )}

          {/* Title overlay */}
          {title && (
            <div className="absolute inset-0 flex items-center justify-center px-3">
              <div className="max-w-[90%] text-center">
                <p className="text-white font-bold text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                   style={{ textShadow: '0 0 20px rgba(217, 28, 210, 0.6), 0 2px 4px rgba(0,0,0,0.8)' }}>
                  {title}
                </p>
                {subtitle && (
                  <p className="text-gray-200 text-center text-xs mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{subtitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Objective badges */}
          {selectedObjectives.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {selectedObjectives.slice(0, 2).map(obj => (
                <span key={obj} className="bg-purple-500/70 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                  {obj}
                </span>
              ))}
            </div>
          )}

          {/* Format badge */}
          <div className="absolute top-2 right-2">
            <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">
              {format === 'reel' ? '9:16' : '16:9'}
            </span>
          </div>

          {/* Voice indicator */}
          {voiceMode !== 'off' && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-blue-500/70 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Mic size={8} /> Voix off
              </span>
            </div>
          )}
        </div>
        <div className="px-3 py-2 text-center">
          <span className="text-[10px] text-gray-500">
            {step === 3 ? `${totalDuration}s` : 'Mise à jour automatique'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Créer une vidéo</h1>
          <p className="text-gray-400 text-sm mt-1">Étape {step} sur 4</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{credits} crédits</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-10 h-1.5 rounded-full transition-all ${s <= step ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Format</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {(['reel', 'tv'] as const).map(f => (
                      <button key={f} onClick={() => setFormat(f)}
                        className={`p-4 rounded-lg border-2 text-left transition ${format === f ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                        <Film className="w-6 h-6 text-purple-400 mb-2" />
                        <div className="text-white font-medium">{f === 'reel' ? 'Reel (9:16)' : 'TV (16:9)'}</div>
                        <div className="text-gray-400 text-sm">{f === 'reel' ? '1080x1920 - 10 crédits' : '1920x1080 - 15 crédits'}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Mode</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {(['cardio', 'témoignage'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`p-4 rounded-lg border-2 text-left transition ${mode === m ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                        <div className="text-white font-medium capitalize">{m}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {m === 'cardio' ? 'Vidéos dynamiques et énergiques' : 'Avis clients et retours'}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Objectifs</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {OBJECTIVES.map(obj => {
                      const Icon = obj.icon;
                      const selected = selectedObjectives.includes(obj.value);
                      return (
                        <button key={obj.value} onClick={() => toggleObjective(obj.value)}
                          className={`p-3 rounded-lg border-2 text-left transition ${selected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                          <Icon className={`w-5 h-5 ${obj.color} mb-1`} />
                          <div className="text-white text-sm font-medium">{obj.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Titre et sous-titre</CardTitle>
                    {selectedObjectives.length > 0 && (
                      <button
                        onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
                        className="flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300 transition"
                      >
                        <Wand2 size={14} /> Suggestions IA
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Titre de la vidéo" value={title} onChange={e => setTitle(e.target.value)} />
                  <Input placeholder="Sous-titre (optionnel)" value={subtitle} onChange={e => setSubtitle(e.target.value)} />

                  {/* IA Title Suggestions */}
                  {showTitleSuggestions && selectedObjectives.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-3 border border-purple-500/30">
                      <p className="text-xs text-purple-300 mb-2 flex items-center gap-1">
                        <Sparkles size={12} /> Suggestions basées sur vos objectifs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedObjectives.flatMap(obj =>
                          (TITLE_SUGGESTIONS[obj] || []).slice(0, 3)
                        ).map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => applySuggestion(suggestion)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-purple-500/20 border border-gray-600 hover:border-purple-500 rounded-full text-xs text-gray-200 transition"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Media */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Rush vidéos ({rushSlots.filter(s => s.file || s.type === 'title-card').length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={addSlot}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Large card grid with + buttons */}
                  <div className="flex flex-wrap items-end gap-1">
                    {rushSlots.map((slot, i) => (
                      <div key={slot.id} className="flex items-end">
                        {/* Card item */}
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', i.toString());
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            if (fromIndex !== i) {
                              const updated = [...rushSlots];
                              const [moved] = updated.splice(fromIndex, 1);
                              updated.splice(i, 0, moved);
                              setRushSlots(updated);
                            }
                          }}
                          className="relative cursor-grab active:cursor-grabbing group"
                        >
                          {slot.type === 'title-card' ? (
                            /* Title card - black with white text, same size as video */
                            <div
                              className="w-40 h-56 bg-black rounded-xl border border-gray-700 flex flex-col items-center justify-center p-3 relative"
                              onMouseDown={(e) => {
                                // Allow input focus by disabling drag on title cards when clicking inside
                                const tag = (e.target as HTMLElement).tagName;
                                if (tag === 'INPUT') e.stopPropagation();
                              }}
                            >
                              <input
                                type="text"
                                placeholder="TEXTE"
                                draggable={false}
                                onMouseDown={(e) => { e.stopPropagation(); }}
                                onClick={(e) => { e.stopPropagation(); (e.target as HTMLInputElement).focus(); }}
                                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                value={slot.titleText || ''}
                                onChange={(e) => {
                                  const updated = [...rushSlots];
                                  updated[i].titleText = e.target.value;
                                  setRushSlots(updated);
                                }}
                                className="w-full bg-transparent text-white text-sm font-bold text-center uppercase placeholder-gray-600 outline-none cursor-text border-b border-gray-700 focus:border-purple-500 py-1 transition"
                              />
                              <span className="text-[10px] text-gray-600 mt-2">2s</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            </div>
                          ) : slot.preview ? (
                            /* Video with large preview */
                            <div className="w-40 h-56 rounded-xl overflow-hidden relative border border-gray-700 hover:border-purple-500 transition">
                              <video
                                src={slot.preview}
                                className="w-full h-full object-cover"
                                muted
                                preload="auto"
                                onLoadedData={(e) => { e.currentTarget.currentTime = 0.5; }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                                <span className="text-[11px] text-white font-medium truncate block">{slot.name}</span>
                              </div>
                              <div className="absolute bottom-1.5 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white">
                                {i + 1}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            </div>
                          ) : (
                            /* Empty upload slot - large */
                            <label className="w-40 h-56 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition relative">
                              <Upload className="w-6 h-6 text-gray-500 mb-2" />
                              <span className="text-xs text-gray-500">Rush {i + 1}</span>
                              <input type="file" accept="video/*" className="hidden"
                                onChange={e => e.target.files?.[0] && handleRushUpload(i, e.target.files[0])} />
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeSlot(i); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              >
                                <X size={12} className="text-white" />
                              </button>
                            </label>
                          )}
                        </div>

                        {/* "+" button between items */}
                        <button
                          onClick={() => {
                            const newSlot: VideoSlot = {
                              id: `tc-${Date.now()}`,
                              file: null,
                              preview: null,
                              name: 'Carte titre',
                              type: 'title-card',
                              titleText: '',
                            };
                            const updated = [...rushSlots];
                            updated.splice(i + 1, 0, newSlot);
                            setRushSlots(updated);
                          }}
                          className="flex-shrink-0 w-6 self-end mb-0 flex items-center justify-center text-green-400 hover:text-green-300 transition"
                          title="Insérer carte titre"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Instructions */}
                  <p className="text-[10px] text-gray-500 mt-3">
                    Glissez-déposez pour réorganiser • Cliquez + pour ajouter des cartes titres
                  </p>
                </CardContent>
              </Card>

              {/* Personnage - 2 choices */}
              <Card>
                <CardHeader>
                  <CardTitle><Image className="w-4 h-4 inline mr-2" />Personnage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCharacterMode('upload')}
                      className={`flex-1 p-2 rounded-lg border text-sm transition ${characterMode === 'upload' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 text-gray-400'}`}
                    >
                      <Upload size={14} className="inline mr-1" /> Uploader
                    </button>
                    <button
                      onClick={() => setCharacterMode('ai')}
                      className={`flex-1 p-2 rounded-lg border text-sm transition ${characterMode === 'ai' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 text-gray-400'}`}
                    >
                      <Sparkles size={14} className="inline mr-1" /> IA propose
                    </button>
                  </div>

                  {characterMode === 'upload' ? (
                    characterPreview ? (
                      <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                        <img src={characterPreview} className="w-12 h-12 rounded-full object-cover" alt="" />
                        <span className="text-white text-sm flex-1 truncate">{characterFile?.name}</span>
                        <button onClick={() => { setCharacterFile(null); setCharacterPreview(null); }}>
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <label className="block p-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 text-center cursor-pointer hover:border-purple-500 transition">
                        <Image className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">JPEG, PNG, WebP</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleCharacterUpload(e.target.files[0])} />
                      </label>
                    )
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                      {/* Search input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: femme fitness, homme musculation..."
                          value={aiSearchQuery}
                          onChange={(e) => setAiSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchAiCharacter()}
                          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500 transition"
                        />
                        <button
                          onClick={() => fetchAiCharacter()}
                          disabled={aiCharacterLoading}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white text-sm transition"
                        >
                          {aiCharacterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Preview */}
                      {aiCharacterUrl ? (
                        <div className="relative">
                          <img src={aiCharacterUrl} className="w-full h-48 object-cover rounded-lg" alt="Personnage IA" />
                          <button
                            onClick={() => fetchAiCharacter()}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full transition"
                            title="Autre image"
                          >
                            <RefreshCw className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Tapez une description ou cliquez rechercher</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Musique */}
                <Card>
                  <CardHeader><CardTitle><Music className="w-4 h-4 inline mr-2" />Musique</CardTitle></CardHeader>
                  <CardContent>
                    {musicFile ? (
                      <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                        <Music className="w-5 h-5 text-purple-400" />
                        <span className="text-white text-sm flex-1 truncate">{musicFile.name}</span>
                        <button onClick={() => setMusicFile(null)}><X className="w-4 h-4 text-gray-400" /></button>
                      </div>
                    ) : (
                      <label className="block p-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 text-center cursor-pointer hover:border-purple-500 transition">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">MP3, WAV, OGG</span>
                        <input type="file" accept="audio/*" className="hidden"
                          onChange={e => e.target.files?.[0] && setMusicFile(e.target.files[0])} />
                      </label>
                    )}
                  </CardContent>
                </Card>

                {/* Voix Off */}
                <Card>
                  <CardHeader><CardTitle><Mic className="w-4 h-4 inline mr-2" />Voix off</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-1">
                      {([
                        { id: 'off', label: 'Aucune' },
                        { id: 'edge', label: 'Edge TTS' },
                        { id: 'upload', label: 'Upload' },
                      ] as const).map(v => (
                        <button
                          key={v.id}
                          onClick={() => setVoiceMode(v.id as VoiceMode)}
                          className={`flex-1 p-1.5 rounded text-xs transition ${voiceMode === v.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>

                    {voiceMode === 'edge' && (
                      <>
                        <select
                          value={selectedVoice}
                          onChange={e => setSelectedVoice(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        >
                          {EDGE_VOICES.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </select>
                        <textarea
                          value={voiceText}
                          onChange={e => setVoiceText(e.target.value)}
                          placeholder="Texte à lire..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none h-16"
                        />
                        <Button
                          onClick={generateVoiceOver}
                          disabled={generatingVoice || !voiceText.trim()}
                          variant="secondary"
                          className="w-full text-sm"
                        >
                          {generatingVoice ? <Loader2 size={14} className="animate-spin mr-2" /> : <Volume2 size={14} className="mr-2" />}
                          {voiceFile ? 'Régénérer' : 'Générer la voix'}
                        </Button>
                        {voiceFile && (
                          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded p-2">
                            <CheckCircle size={14} className="text-green-400" />
                            <span className="text-xs text-green-300">Voix off générée</span>
                          </div>
                        )}
                      </>
                    )}

                    {voiceMode === 'upload' && (
                      voiceFile ? (
                        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span className="text-white text-xs flex-1 truncate">{voiceFile.name}</span>
                          <button onClick={() => setVoiceFile(null)}>
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ) : (
                        <label className="block p-4 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 text-center cursor-pointer hover:border-purple-500 transition">
                          <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-400">MP3, WAV</span>
                          <input type="file" accept="audio/*" className="hidden"
                            onChange={e => {
                              if (e.target.files?.[0]) setVoiceFile(e.target.files[0]);
                            }} />
                        </label>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Timeline */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Timeline ({timeline.length} éléments)</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {totalDuration}s
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {timeline.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold
                          ${item.type === 'intro' ? 'bg-purple-600' :
                            item.type === 'video' ? 'bg-blue-600' :
                            item.type === 'objective' ? 'bg-green-600' :
                            item.type === 'outro' ? 'bg-red-600' : 'bg-gray-600'}`}>
                          {item.type === 'video' ? <Film className="w-4 h-4" /> :
                           item.type === 'objective' ? <Target className="w-4 h-4" /> :
                           <Play className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{item.label}</div>
                          <div className="text-gray-500 text-xs capitalize">{item.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateDuration(i, item.duration - 1)}
                            className="w-6 h-6 rounded bg-gray-700 text-gray-300 text-xs flex items-center justify-center hover:bg-gray-600">-</button>
                          <span className="text-white text-sm w-8 text-center">{item.duration}s</span>
                          <button onClick={() => updateDuration(i, item.duration + 1)}
                            className="w-6 h-6 rounded bg-gray-700 text-gray-300 text-xs flex items-center justify-center hover:bg-gray-600">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Visual timeline bar */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex rounded-lg overflow-hidden h-10">
                    {timeline.map((item) => (
                      <div key={item.id}
                        style={{ width: `${(item.duration / totalDuration) * 100}%` }}
                        className={`flex items-center justify-center text-xs text-white font-medium truncate px-1
                          ${item.type === 'intro' ? 'bg-purple-600' :
                            item.type === 'video' ? 'bg-blue-600' :
                            item.type === 'objective' ? 'bg-green-600' :
                            item.type === 'outro' ? 'bg-red-600' : 'bg-gray-600'}`}>
                        {item.duration}s
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">0s</span>
                    <span className="text-xs text-gray-500">{totalDuration}s</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Récapitulatif & Render */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Récapitulatif */}
              <Card>
                <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Titre</span>
                      <p className="text-white font-medium mt-1">{title}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Format</span>
                      <p className="text-white font-medium mt-1">{format === 'reel' ? 'Reel 9:16' : 'TV 16:9'}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Mode</span>
                      <p className="text-white font-medium mt-1 capitalize">{mode}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Durée</span>
                      <p className="text-white font-medium mt-1">{totalDuration}s</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Rush</span>
                      <p className="text-white font-medium mt-1">{rushSlots.filter(s => s.file).length} vidéos</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Musique</span>
                      <p className="text-white font-medium mt-1">{musicFile ? musicFile.name : 'Aucune'}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Voix off</span>
                      <p className="text-white font-medium mt-1">
                        {voiceMode === 'off' ? 'Aucune' : voiceMode === 'edge' ? 'Edge TTS' : 'Personnalisée'}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">Objectifs</span>
                      <p className="text-white font-medium mt-1">{selectedObjectives.join(', ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Batch Mode */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle><Copy className="w-4 h-4 inline mr-2" />Batch X10</CardTitle>
                    <button
                      onClick={() => setBatchMode(!batchMode)}
                      className={`px-3 py-1 rounded-full text-sm transition ${batchMode ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      {batchMode ? 'Activé' : 'Désactivé'}
                    </button>
                  </div>
                </CardHeader>
                {batchMode && (
                  <CardContent className="space-y-4">
                    {/* Batch count */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Nombre de vidéos</label>
                      <div className="flex gap-2">
                        {[2, 3, 5, 10].map(n => (
                          <button
                            key={n}
                            onClick={() => { setBatchCount(n); generateBatchTitles(); }}
                            className={`px-4 py-2 rounded-lg text-sm transition ${batchCount === n ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                          >
                            x{n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Batch titles */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-gray-300">Titres (1 par vidéo)</label>
                        <button
                          onClick={generateBatchTitles}
                          className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> Régénérer
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {batchTitles.map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-6">{i + 1}.</span>
                            <input
                              value={t}
                              onChange={e => {
                                const updated = [...batchTitles];
                                updated[i] = e.target.value;
                                setBatchTitles(updated);
                              }}
                              className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Destination</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'calendar' as BatchDestination, label: 'Brouillons calendrier', icon: Calendar },
                          { id: 'export' as BatchDestination, label: 'Exporter', icon: Download },
                          { id: 'both' as BatchDestination, label: 'Les deux', icon: Copy },
                        ]).map(d => (
                          <button
                            key={d.id}
                            onClick={() => setBatchDestination(d.id)}
                            className={`p-3 rounded-lg border text-center transition ${batchDestination === d.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 text-gray-400'}`}
                          >
                            <d.icon size={18} className="mx-auto mb-1" />
                            <span className="text-xs">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Destination (always visible) */}
              {!batchMode && (
                <Card>
                  <CardHeader><CardTitle><Download className="w-4 h-4 inline mr-2" />Destination</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'calendar' as BatchDestination, label: 'Brouillons calendrier', icon: Calendar },
                        { id: 'export' as BatchDestination, label: 'Export bureau', icon: Download },
                        { id: 'both' as BatchDestination, label: 'Les deux', icon: Copy },
                      ]).map(d => (
                        <button
                          key={d.id}
                          onClick={() => setBatchDestination(d.id)}
                          className={`p-3 rounded-lg border text-center transition ${batchDestination === d.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 text-gray-400'}`}
                        >
                          <d.icon size={18} className="mx-auto mb-1" />
                          <span className="text-xs">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Render area */}
              <Card>
                <CardContent className="pt-6">
                  {renderStatus === 'completed' ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                      <h3 className="text-xl font-bold text-white">
                        {batchMode ? `${batchCount} vidéos terminées !` : 'Vidéo terminée !'}
                      </h3>
                      <p className="text-gray-400">
                        {batchDestination === 'calendar'
                          ? (batchMode ? 'Les vidéos ont été ajoutées en brouillon dans votre calendrier.' : 'Votre vidéo a été ajoutée en brouillon dans votre calendrier.')
                          : batchDestination === 'export'
                          ? (batchMode ? 'Les vidéos sont prêtes à télécharger.' : 'Votre vidéo est prête à télécharger.')
                          : (batchMode ? 'Les vidéos ont été ajoutées au calendrier et sont prêtes à télécharger.' : 'Votre vidéo a été ajoutée au calendrier et est prête à télécharger.')}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <a href="/dashboard/library" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                          Bibliothèque
                        </a>
                        <a href="/dashboard/calendar" className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                          Calendrier
                        </a>
                      </div>
                    </div>
                  ) : renderError ? (
                    <div className="text-center space-y-4">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                      <h3 className="text-xl font-bold text-white">Erreur de rendu</h3>
                      <p className="text-red-300">{renderError}</p>
                      <Button onClick={() => { setRenderError(null); setRendering(false); }}>Réessayer</Button>
                    </div>
                  ) : rendering ? (
                    <div className="text-center space-y-4">
                      <Loader2 className="w-16 h-16 text-purple-400 mx-auto animate-spin" />
                      <h3 className="text-xl font-bold text-white">{renderStatus}</h3>
                      <div className="w-full bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
                        <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-gray-800 rounded-lg px-8 py-4 text-center">
                        <p className="text-3xl font-bold text-white">{renderCost}</p>
                        <p className="text-sm text-gray-400">crédits nécessaires</p>
                      </div>
                      {!canRender && (
                        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm max-w-sm text-center">
                          Crédits insuffisants. Vous avez {credits} crédits, il faut {renderCost}.
                        </div>
                      )}
                      <Button size="lg" onClick={handleRender} disabled={!canRender}
                        className="w-full max-w-xs py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-lg">
                        <Play className="w-5 h-5 mr-2" />
                        {batchMode ? `Lancer le batch x${batchCount}` : 'Lancer le rendu'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Sidebar - Live Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <LivePreview />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 1 && !rendering && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
        )}
        <div className="flex-1" />
        {step < 4 && (
          <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
            Suivant <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
