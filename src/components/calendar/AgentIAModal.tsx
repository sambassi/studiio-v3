'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Folder, Music, Image as ImageIcon, Loader2, Zap, Volume2, RefreshCw, Play } from 'lucide-react';

interface AgentIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

const NETWORKS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'youtube', label: 'YouTube Shorts' },
  { id: 'tiktok', label: 'TikTok' },
];

const OBJECTIVES = [
  { id: 'promo', label: 'Promo', emoji: '📢' },
  { id: 'motiv', label: 'Motiv', emoji: '💪' },
  { id: 'bienfaits', label: 'Bienfaits', emoji: '✨' },
  { id: 'abo', label: 'Abo', emoji: '❤️' },
  { id: 'nutri', label: 'Nutri', emoji: '🥗' },
];

const EDGE_VOICES = [
  { id: 'fr-FR-DeniseNeural', label: 'Denise (Femme)' },
  { id: 'fr-FR-HenriNeural', label: 'Henri (Homme)' },
  { id: 'fr-FR-CoralieNeural', label: 'Coralie (Femme)' },
  { id: 'fr-FR-RemyMultilingualNeural', label: 'Rémy (Homme)' },
  { id: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (Femme)' },
];

// Pexels-style keywords per objective for auto photo
const PHOTO_KEYWORDS: Record<string, string[]> = {
  promo: ['fitness sale', 'gym promotion', 'sport deal'],
  motiv: ['fitness motivation', 'workout energy', 'gym training'],
  bienfaits: ['healthy lifestyle', 'wellness', 'yoga meditation'],
  abo: ['gym membership', 'fitness community', 'group workout'],
  nutri: ['healthy food', 'nutrition', 'protein meal prep'],
};

export function AgentIAModal({
  isOpen,
  onClose,
  onGenerate,
}: AgentIAModalProps) {
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(['instagram']);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(['promo']);
  const [planDays, setPlanDays] = useState('30j');
  const [rushFiles, setRushFiles] = useState<File[]>([]);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [voixOff, setVoixOff] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('fr-FR-DeniseNeural');
  const [generating, setGenerating] = useState(false);
  const rushInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch Pexels photo when photo is enabled or objectives change
  useEffect(() => {
    if (photo && selectedObjectives.length > 0) {
      fetchPexelsPhoto();
    }
  }, [photo, selectedObjectives]);

  const fetchPexelsPhoto = async () => {
    setPhotoLoading(true);
    try {
      // Build search query from selected objectives
      const keywords = selectedObjectives
        .flatMap(obj => PHOTO_KEYWORDS[obj] || ['fitness'])
        .sort(() => Math.random() - 0.5);
      const query = keywords[0] || 'fitness';

      const res = await fetch(`/api/pexels/search?q=${encodeURIComponent(query)}&per_page=15`);
      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
          setPhotoUrl(randomPhoto.src?.medium || randomPhoto.src?.original || null);
        } else {
          // Fallback: use a placeholder
          setPhotoUrl(`https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400`);
        }
      } else {
        // Fallback placeholder
        setPhotoUrl(`https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400`);
      }
    } catch {
      setPhotoUrl(`https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400`);
    } finally {
      setPhotoLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleNetworkToggle = (networkId: string) => {
    setSelectedNetworks(prev =>
      prev.includes(networkId)
        ? prev.filter(n => n !== networkId)
        : [...prev, networkId]
    );
  };

  const handleObjectiveToggle = (objectiveId: string) => {
    setSelectedObjectives(prev =>
      prev.includes(objectiveId)
        ? prev.filter(o => o !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const handleRushFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setRushFiles(files);
  };

  const handleMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMusicFile(file);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
  };

  const handleGenerate = async () => {
    if (rushFiles.length === 0) {
      alert('Veuillez sélectionner au moins une vidéo');
      return;
    }

    if (selectedNetworks.length === 0) {
      alert('Veuillez sélectionner au moins un réseau');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      rushFiles.forEach(file => formData.append('rushes', file));
      formData.append('networks', JSON.stringify(selectedNetworks));
      formData.append('objectives', JSON.stringify(selectedObjectives));
      formData.append('planDays', planDays);
      formData.append('enablePhoto', photo.toString());
      formData.append('enableVoixOff', voixOff.toString());
      if (voixOff) formData.append('voiceId', selectedVoice);
      if (photoUrl) formData.append('photoUrl', photoUrl);

      if (musicFile) formData.append('music', musicFile);
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch('/api/posts/agent-ia', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Planning généré avec succès!');
        onGenerate();
        onClose();
      } else {
        alert('Erreur lors de la génération du planning');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-base animate-fade-in max-h-[90vh] overflow-y-auto agent-ia-scroll">
        {/* Custom scrollbar styles */}
        <style jsx>{`
          .agent-ia-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .agent-ia-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .agent-ia-scroll::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 4px;
          }
          .agent-ia-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.5);
          }
          .agent-ia-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
          }
        `}</style>

        {/* Header - centered title */}
        <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
          <div className="relative flex items-center justify-center py-5 px-6">
            <h2 className="text-xl font-bold text-white tracking-wide text-center">
              🤖 AGENT IA — PLANIFICATEUR AUTONOME
            </h2>
            <button
              onClick={onClose}
              className="absolute right-4 text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Description */}
          <p className="text-gray-400 text-sm text-center">
            L&apos;Agent IA analyse tes rushes et génère automatiquement un planning de posts optimisé
            pour chaque réseau social.
          </p>

          {/* Dossier de Rushes */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Folder size={16} className="text-blue-400" />
              Dossier de Rushes
            </h3>
            <button
              onClick={() => rushInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 transition text-gray-400 text-sm"
            >
              {rushFiles.length > 0
                ? `${rushFiles.length} fichier(s) sélectionné(s)`
                : 'Sélectionner des vidéos'}
            </button>
            <input
              ref={rushInputRef}
              type="file"
              multiple
              accept="video/*"
              onChange={handleRushFiles}
              className="hidden"
            />
          </div>

          {/* Configuration */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-white">Configuration</h3>

            {/* Days to Plan */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Planifier pour</label>
              <div className="flex gap-2">
                {['7j', '14j', '30j'].map(days => (
                  <button
                    key={days}
                    onClick={() => setPlanDays(days)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      planDays === days
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            {/* Networks */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Réseaux sociaux</label>
              <div className="grid grid-cols-2 gap-2">
                {NETWORKS.map(network => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkToggle(network.id)}
                    className={`p-2.5 rounded-lg text-sm font-medium transition border ${
                      selectedNetworks.includes(network.id)
                        ? 'border-pink-500 bg-pink-500/10 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {network.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Objectifs</label>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectiveToggle(obj.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                      selectedObjectives.includes(obj.id)
                        ? 'border-yellow-500 bg-yellow-500/10 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {obj.emoji} {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Musique */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Music size={14} /> Musique
              </label>
              <button
                onClick={() => musicInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition border border-gray-700"
              >
                {musicFile ? '✓ ' + musicFile.name : 'Choisir (optionnel)'}
              </button>
              <input
                ref={musicInputRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicFile}
                className="hidden"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-2">
                <ImageIcon size={14} /> Logo
              </label>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition border border-gray-700"
              >
                {logoFile ? '✓ ' + logoFile.name : 'Choisir (optionnel)'}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFile}
                className="hidden"
              />
            </div>

            {/* Photo Affiche - with Pexels preview */}
            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <ImageIcon size={14} className="text-purple-400" />
                  Photo Affiche
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Pexels</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={photo}
                    onChange={(e) => setPhoto(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              {photo && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500">
                    Image générée automatiquement depuis Pexels selon vos objectifs
                  </p>
                  {photoLoading ? (
                    <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Loader2 size={24} className="text-purple-400 animate-spin" />
                    </div>
                  ) : photoUrl ? (
                    <div className="relative group">
                      <img
                        src={photoUrl}
                        alt="Photo affiche"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={fetchPexelsPhoto}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                        title="Changer la photo"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      Aucune image disponible
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Voix Off Automatique - with Edge TTS options */}
            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Volume2 size={14} className="text-blue-400" />
                  Voix off automatique
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Edge TTS</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voixOff}
                    onChange={(e) => setVoixOff(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {voixOff && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500">
                    Voix off générée automatiquement avec Edge TTS pour chaque post
                  </p>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                  >
                    {EDGE_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || rushFiles.length === 0}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Génération du planning...
              </>
            ) : (
              <>
                <Zap size={20} />
                GÉNÉRER LE PLANNING
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
