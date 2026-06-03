
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Crown } from "lucide-react";

interface Character {
  id: string;
  name: string;
  age: number;
  gender: 'masculin' | 'féminin' | 'autre';
  appearance: string;
  personality: string;
}

interface CharacterCustomizationProps {
  characters: Character[];
  onCharactersChange: (characters: Character[]) => void;
  isPremium?: boolean;
}

const CharacterCustomization = ({ characters, onCharactersChange, isPremium = false }: CharacterCustomizationProps) => {
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const addCharacter = () => {
    if (!isPremium && characters.length >= 3) {
      return; // Limite gratuite
    }
    
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: '',
      age: 25,
      gender: 'masculin',
      appearance: '',
      personality: ''
    };
    
    setEditingCharacter(newCharacter);
  };

  const saveCharacter = () => {
    if (!editingCharacter) return;
    
    const existingIndex = characters.findIndex(c => c.id === editingCharacter.id);
    if (existingIndex >= 0) {
      const updated = [...characters];
      updated[existingIndex] = editingCharacter;
      onCharactersChange(updated);
    } else {
      onCharactersChange([...characters, editingCharacter]);
    }
    
    setEditingCharacter(null);
  };

  const removeCharacter = (id: string) => {
    onCharactersChange(characters.filter(c => c.id !== id));
  };

  const maxCharacters = isPremium ? 13 : 3;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Personnages ({characters.length}/{maxCharacters})
          {!isPremium && (
            <Badge className="ml-2 bg-amber-100 text-amber-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium+ pour +10
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des personnages existants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((character) => (
            <div key={character.id} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{character.name || 'Sans nom'}</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCharacter(character)}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeCharacter(character.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p><strong>Âge:</strong> {character.age} ans</p>
                <p><strong>Genre:</strong> {character.gender}</p>
                {character.appearance && (
                  <p><strong>Apparence:</strong> {character.appearance.substring(0, 50)}...</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton d'ajout */}
        <Button 
          onClick={addCharacter}
          disabled={characters.length >= maxCharacters}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un personnage
          {!isPremium && characters.length >= 3 && (
            <Badge className="ml-2 bg-amber-100 text-amber-800">
              Premium+ requis
            </Badge>
          )}
        </Button>

        {/* Formulaire d'édition */}
        {editingCharacter && (
          <Card className="border-script-accent">
            <CardHeader>
              <CardTitle className="text-lg">
                {characters.find(c => c.id === editingCharacter.id) ? 'Modifier' : 'Nouveau'} personnage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du personnage</Label>
                  <Input
                    id="name"
                    value={editingCharacter.name}
                    onChange={(e) => setEditingCharacter({
                      ...editingCharacter,
                      name: e.target.value
                    })}
                    placeholder="Ex: Marie Dupont"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="100"
                    value={editingCharacter.age}
                    onChange={(e) => setEditingCharacter({
                      ...editingCharacter,
                      age: parseInt(e.target.value) || 25
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select
                  value={editingCharacter.gender}
                  onValueChange={(value: 'masculin' | 'féminin' | 'autre') => setEditingCharacter({
                    ...editingCharacter,
                    gender: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculin">Masculin</SelectItem>
                    <SelectItem value="féminin">Féminin</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isPremium && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="appearance">Apparence physique</Label>
                    <Textarea
                      id="appearance"
                      value={editingCharacter.appearance}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        appearance: e.target.value
                      })}
                      placeholder="Ex: Grande, cheveux bruns, yeux verts, style décontracté..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality">Traits de personnalité</Label>
                    <Textarea
                      id="personality"
                      value={editingCharacter.personality}
                      onChange={(e) => setEditingCharacter({
                        ...editingCharacter,
                        personality: e.target.value
                      })}
                      placeholder="Ex: Courageuse, impulsive, drôle, perfectionniste..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={saveCharacter} className="flex-1">
                  Sauvegarder
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingCharacter(null)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isPremium && (
          <div className="p-4 bg-gradient-to-r from-script-accent/10 to-script-accent/5 rounded-lg border border-script-accent/20">
            <div className="flex items-center mb-2">
              <Crown className="h-4 w-4 text-script-accent mr-2" />
              <span className="font-medium text-script-accent">Fonctionnalités Premium+</span>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Jusqu'à 13 personnages (vs 3 en gratuit)</li>
              <li>• Description détaillée de l'apparence</li>
              <li>• Traits de personnalité personnalisés</li>
              <li>• Sauvegarde et réutilisation</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CharacterCustomization;
