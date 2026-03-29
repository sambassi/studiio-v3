'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Upload, X, Settings, Plus, Trash2, Music, Zap, Heart, Wifi, Clock,
  Image as ImageIcon, Loader2
} from 'lucide-react';

interface InfoCard {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
}

const THEMES = [
  { id: 'sommeil-sport', label: 'Sommeil & Sport' },
  { id: 'nutrition-danse', label: 'Nutrition & Danse' },
  { id: 'energie-cardio', label: 'Énergie & Cardio' },
  { id: 'stress-mental', label: 'Stress & Mental' },
  { id: 'communaute', label: 'Communauté' },
  { id: 'personnalise', label: 'Personnalisé' },
];

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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mixVideoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const voixOffInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = async () => {
    if (!session?.user) return;

    setRendering(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('theme', selectedTheme);
      formData.append('cards', JSON.stringify(cards));
      formData.append('duration', duration.toString());
      formData.append('batch', batchMode.toString());

      if (photoPersonnage) formData.append('character', photoPersonnage);
      if (mixVideo) formData.append('mixVideo', mixVideo);
      if (music) formData.append('music', music);
      if (voixOff) formData.append('voixOff', voixOff);
      if (logo) formData.append('logo', logo);

      const response = await fetch('/api/infographie', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Vidéo en cours de rendu!');
      } else {
        alert('Erreur lors du rendu');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur lors du rendu');
    } finally {
      setRendering(false);
    }
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
                      onClick={() => setSelectedTheme(theme.id)}
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
                      <div className="text-xs text-gray-400 mb-2">{selectedTheme.toUpperCase()}</div>
                      <h2 className="text-2xl font-bold mb-2">{title}</h2>
                      <p className="text-sm text-gray-300">{subtitle}</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      {cards.slice(0, 3).map(card => (
                        <div key={card.id} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                          <span>{card.icon}</span>
                          <span className="text-pink-400">{card.label}</span>
                          <span className="text-green-400 ml-auto">{card.value}</span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded font-semibold text-sm">
                      EN SAVOIR PLUS
                    </button>
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

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Voix Off</label>
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

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={rendering}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {rendering ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Rendu en cours...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  EXPORTER LA VIDÉO
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
