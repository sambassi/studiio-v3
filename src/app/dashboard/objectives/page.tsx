'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Trash2, Edit2, Target, Loader2 } from 'lucide-react';

interface Objective {
  id: string;
  name: string;
  description: string;
  target_audience: string;
  platform: string;
  tone: string;
  created_at: string;
}

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', target_audience: '', platform: '', tone: ''
  });

  const fetchObjectives = useCallback(async () => {
    try {
      const res = await fetch('/api/user/objectives');
      const data = await res.json();
      if (data.success) {
        setObjectives(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchObjectives(); }, [fetchObjectives]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/user/objectives?id=${editingId}` : '/api/user/objectives';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        if (editingId) {
          setObjectives(prev => prev.map(o => o.id === editingId ? data.data : o));
        } else {
          setObjectives(prev => [data.data, ...prev]);
        }
        setFormData({ name: '', description: '', target_audience: '', platform: '', tone: '' });
        setShowForm(false);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving objective:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'objectif "${name}" ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/user/objectives?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setObjectives(prev => prev.filter(o => o.id !== id));
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
    }
  };

  const handleEdit = (objective: Objective) => {
    setEditingId(objective.id);
    setFormData({
      name: objective.name,
      description: objective.description,
      target_audience: objective.target_audience,
      platform: objective.platform,
      tone: objective.tone,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', target_audience: '', platform: '', tone: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Objectifs</h1>
          <p className="text-gray-400">Définissez vos objectifs de création vidéo</p>
        </div>
        <Button variant="primary" onClick={() => handleCancel()}>
          {showForm ? 'Annuler' : '+ Créer un objectif'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-studiio-primary/30">
          <CardHeader className="border-b border-gray-800">
            <CardTitle>{editingId ? 'Modifier l\'objectif' : 'Nouvel objectif'}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              <Input
                label="Nom"
                placeholder="Par exemple: Croissance Instagram"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                placeholder="Décrivez votre objectif"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                label="Public cible"
                placeholder="Par exemple: Jeunes adultes 18-35 ans"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              />
              <Select
                label="Plateforme"
                options={[
                  { value: 'instagram', label: 'Instagram' },
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'youtube', label: 'YouTube' },
                  { value: 'facebook', label: 'Facebook' },
                ]}
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
              <Select
                label="Ton"
                options={[
                  { value: 'ludique', label: 'Ludique' },
                  { value: 'educatif', label: 'Éducatif' },
                  { value: 'tendance', label: 'Tendance' },
                  { value: 'professionnel', label: 'Professionnel' },
                  { value: 'motivant', label: 'Motivant' },
                ]}
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              />
            </CardContent>
            <CardFooter>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <><Loader2 size={16} className="animate-spin mr-2 inline" /> {editingId ? 'Modification...' : 'Création...'}</>
                ) : (
                  editingId ? 'Modifier' : 'Créer'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-studiio-primary mr-3" size={24} />
          <span className="text-gray-400">Chargement...</span>
        </div>
      ) : objectives.length === 0 ? (
        <div className="text-center py-16">
          <Target className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">Aucun objectif</h3>
          <p className="text-gray-400 mb-6">Créez votre premier objectif pour guider votre stratégie vidéo</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Créer un objectif
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {objectives.map((objective) => (
            <Card key={objective.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">{objective.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{objective.description}</p>
                    <div className="flex gap-4 text-xs flex-wrap">
                      {objective.target_audience && (
                        <div>
                          <span className="text-gray-500">Public: </span>
                          <span className="text-gray-300">{objective.target_audience}</span>
                        </div>
                      )}
                      {objective.platform && (
                        <div>
                          <span className="text-gray-500">Plateforme: </span>
                          <span className="text-gray-300 capitalize">{objective.platform}</span>
                        </div>
                      )}
                      {objective.tone && (
                        <div>
                          <span className="text-gray-500">Ton: </span>
                          <span className="text-gray-300 capitalize">{objective.tone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(objective)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDelete(objective.id, objective.name)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
