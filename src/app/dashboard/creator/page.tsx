'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Upload, X, Play, Film, Plus, Trash2,
  Zap, Target, Eye, Heart, TrendingUp, ChevronRight,
  Music, Image, Clock, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';

// Types
interface VideoSlot {
  id: string;
  file: File | null;
  preview: string | null;
  name: string;
}

interface TimelineItem {
  id: string;
  type: 'intro' | 'video' | 'text' | 'objective' | 'outro';
  duration: number;
  label: string;
  text?: string;
}

type VideoFormat = 'reel' | 'tv';
type VideoMode = 'cardio' | 'temoignage';
type Objective = 'promotion' | 'abonnement' | 'motivation' | 'bienfaits' | 'nutrition';

const OBJECTIVES = [
  { value: 'promotion' as Objective, label: 'Promotion', icon: TrendingUp, color: 'text-orange-400' },
  { value: 'abonnement' as Objective, label: 'Abonnement', icon: Heart, color: 'text-pink-400' },
  { value: 'motivation' as Objective, label: 'Motivation', icon: Zap, color: 'text-yellow-400' },
  { value: 'bienfaits' as Objective, label: 'Bienfaits', icon: Eye, color: 'text-green-400' },
  { value: 'nutrition' as Objective, label: 'Nutrition', icon: Target, color: 'text-blue-400' },
];

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

  // Step 2: Media
  const [rushSlots, setRushSlots] = useState<VideoSlot[]>([
    { id: '1', file: null, preview: null, name: '' },
  ]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);

  // Step 3: Timeline
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Step 4: Render
  const [rendering, setRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Fetch credits
  useEffect(() => {
    if (session?.user) {
      fetch('/api/credits/balance')
        .then(r => r.json())
        .then(d => { if (d.credits !== undefined) setCredits(d.credits); })
        .catch(() => {});
    }
  }, [session]);

  // Build timeline automatically when entering step 3
  useEffect(() => {
    if (step === 3) {
      buildTimeline();
    }
  }, [step]);

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
  const renderCost = format === 'reel' ? 10 : 15;
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

  const handleRushUpload = (index: number, file: File) => {
    const updated = [...rushSlots];
    if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
    updated[index] = {
      ...updated[index],
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ''),
    };
    setRushSlots(updated);
  };

  const handleCharacterUpload = (file: File) => {
    if (characterPreview) URL.revokeObjectURL(characterPreview);
    setCharacterFile(file);
    setCharacterPreview(URL.createObjectURL(file));
  };

  // Timeline duration change
  const updateDuration = (index: number, duration: number) => {
    const updated = [...timeline];
    updated[index] = { ...updated[index], duration: Math.max(1, Math.min(30, duration)) };
    setTimeline(updated);
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

      // Upload rush files
      rushSlots.forEach((slot, i) => {
        if (slot.file) {
          formData.append(`rush_${i}`, slot.file);
        }
      });

      if (musicFile) formData.append('music', musicFile);
      if (characterFile) formData.append('character', characterFile);

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

      // Timeout after 5 min
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Creer une video</h1>
          <p className="text-gray-400 text-sm mt-1">Etape {step} sur 4</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{credits} credits</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full ${s <= step ? 'bg-purple-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>
      </div>

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
                    <div className="text-gray-400 text-sm">{f === 'reel' ? '1080x1920 - 10 credits' : '1920x1080 - 15 credits'}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mode</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(['cardio', 'temoignage'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`p-4 rounded-lg border-2 text-left transition ${mode === m ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                    <div className="text-white font-medium capitalize">{m}</div>
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
            <CardHeader><CardTitle>Titre et sous-titre</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Titre de la video" value={title} onChange={e => setTitle(e.target.value)} />
              <Input placeholder="Sous-titre (optionnel)" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
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
                <CardTitle>Rush videos ({rushSlots.filter(s => s.file).length}/{rushSlots.length})</CardTitle>
                {rushSlots.length < MAX_SLOTS && (
                  <Button variant="outline" size="sm" onClick={addSlot}><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {rushSlots.map((slot, i) => (
                  <div key={slot.id} className="relative">
                    {slot.preview ? (
                      <div className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden relative group">
                        <video src={slot.preview} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button onClick={() => removeSlot(i)} className="p-1 bg-red-600 rounded">
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
                          {slot.name}
                        </div>
                      </div>
                    ) : (
                      <label className="aspect-[9/16] bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Rush {i + 1}</span>
                        <input type="file" accept="video/*" className="hidden"
                          onChange={e => e.target.files?.[0] && handleRushUpload(i, e.target.files[0])} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Card>
              <CardHeader><CardTitle><Image className="w-4 h-4 inline mr-2" />Personnage</CardTitle></CardHeader>
              <CardContent>
                {characterPreview ? (
                  <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                    <img src={characterPreview} className="w-10 h-10 rounded-full object-cover" alt="" />
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
                <CardTitle>Timeline ({timeline.length} elements)</CardTitle>
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

      {/* Step 4: Preview & Render */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Recap */}
          <Card>
            <CardHeader><CardTitle>Recap</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Titre:</span> <span className="text-white ml-2">{title}</span></div>
                <div><span className="text-gray-400">Format:</span> <span className="text-white ml-2">{format === 'reel' ? 'Reel 9:16' : 'TV 16:9'}</span></div>
                <div><span className="text-gray-400">Mode:</span> <span className="text-white ml-2 capitalize">{mode}</span></div>
                <div><span className="text-gray-400">Duree:</span> <span className="text-white ml-2">{totalDuration}s</span></div>
                <div><span className="text-gray-400">Rush:</span> <span className="text-white ml-2">{rushSlots.filter(s => s.file).length} videos</span></div>
                <div><span className="text-gray-400">Musique:</span> <span className="text-white ml-2">{musicFile ? musicFile.name : 'Aucune'}</span></div>
                <div><span className="text-gray-400">Objectifs:</span> <span className="text-white ml-2">{selectedObjectives.join(', ')}</span></div>
                <div><span className="text-gray-400">Credits:</span> <span className="text-white ml-2">{renderCost} credits</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Render status */}
          {renderStatus === 'completed' ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Video terminee !</h3>
                  <p className="text-gray-400">Votre video a ete rendue avec succes.</p>
                  <a href="/dashboard/library" className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    Voir dans la bibliotheque
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : renderError ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Erreur de rendu</h3>
                  <p className="text-red-300">{renderError}</p>
                  <Button onClick={() => { setRenderError(null); setRendering(false); }}>Reessayer</Button>
                </div>
              </CardContent>
            </Card>
          ) : rendering ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Loader2 className="w-16 h-16 text-purple-400 mx-auto animate-spin" />
                  <h3 className="text-xl font-bold text-white">{renderStatus}</h3>
                  <div className="w-full bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
                    <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {!canRender && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                      Credits insuffisants. Vous avez {credits} credits, il faut {renderCost}.
                    </div>
                  )}
                  <Button size="lg" onClick={handleRender} disabled={!canRender}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50">
                    <Play className="w-5 h-5 mr-2" />
                    Lancer le rendu ({renderCost} credits)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 1 && !rendering && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>Retour</Button>
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
