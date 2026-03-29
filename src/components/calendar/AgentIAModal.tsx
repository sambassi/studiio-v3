'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Folder, Music, Image as ImageIcon, Loader2, Zap } from 'lucide-react';

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
  const [voixOff, setVoixOff] = useState(false);
  const [generating, setGenerating] = useState(false);
  const rushInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-base animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              🤖 AGENT IA — PLANIFICATEUR AUTONOME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Description */}
          <p className="text-gray-400">
            L'Agent IA analyse tes rushes et génère automatiquement un planning de posts optimisé
            pour chaque réseau social.
          </p>

          {/* Dossier de Rushes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Folder size={20} className="text-blue-400" />
              Dossier de Rushes
            </h3>
            <button
              onClick={() => rushInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 transition text-gray-400"
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
          <div className="bg-gray-800 p-6 rounded-lg space-y-6">
            <h3 className="text-lg font-semibold text-white">Configuration</h3>

            {/* Days to Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Planifier pour</label>
              <div className="flex gap-3">
                {['7j', '14j', '30j'].map(days => (
                  <button
                    key={days}
                    onClick={() => setPlanDays(days)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      planDays === days
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            {/* Networks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Réseaux sociaux</label>
              <div className="grid grid-cols-2 gap-3">
                {NETWORKS.map(network => (
                  <button
                    key={network.id}
                    onClick={() => handleNetworkToggle(network.id)}
                    className={`p-3 rounded-lg font-medium transition border-2 ${
                      selectedNetworks.includes(network.id)
                        ? 'border-pink-500 bg-pink-500/10 text-white'
                        : 'border-gray-700 bg-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {network.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Objectifs</label>
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectiveToggle(obj.id)}
                    className={`px-4 py-2 rounded-full font-medium transition border-2 text-sm ${
                      selectedObjectives.includes(obj.id)
                        ? 'border-yellow-500 bg-yellow-500/10 text-white'
                        : 'border-gray-700 bg-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {obj.emoji} {obj.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Musique */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Music size={16} /> Musique
              </label>
              <button
                onClick={() => musicInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition"
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
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <ImageIcon size={16} /> Logo
              </label>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition"
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

            {/* Photo Affiche */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Photo Affiche</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={photo}
                  onChange={(e) => setPhoto(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>

            {/* Voix Off Automatique */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Voix off automatique</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voixOff}
                  onChange={(e) => setVoixOff(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </label>
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
