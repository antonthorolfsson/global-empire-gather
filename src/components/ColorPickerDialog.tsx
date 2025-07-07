import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ColorPickerDialogProps {
  open: boolean;
  onColorSelect: (color: string) => void;
  onCancel: () => void;
  takenColors: string[];
}

const EMPIRE_COLORS = [
  { name: 'Red', value: 'hsl(0 75% 55%)', preview: '#e74c3c' },
  { name: 'Green', value: 'hsl(120 60% 45%)', preview: '#27ae60' },
  { name: 'Blue', value: 'hsl(215 80% 45%)', preview: '#3498db' },
  { name: 'Yellow', value: 'hsl(45 90% 60%)', preview: '#f1c40f' },
  { name: 'Pink', value: 'hsl(320 60% 55%)', preview: '#e91e63' },
  { name: 'Black', value: 'hsl(0 0% 20%)', preview: '#2c3e50' },
  { name: 'Sea Green', value: 'hsl(190 70% 45%)', preview: '#1abc9c' },
  { name: 'Purple', value: 'hsl(280 70% 55%)', preview: '#9b59b6' },
];

const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  open,
  onColorSelect,
  onCancel,
  takenColors
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');

  const availableColors = EMPIRE_COLORS.filter(color => !takenColors.includes(color.value));

  const handleConfirm = () => {
    if (selectedColor) {
      onColorSelect(selectedColor);
      setSelectedColor('');
    }
  };

  const handleCancel = () => {
    setSelectedColor('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Empire Color</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a color for your empire. Other players won't be able to use the same color.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {availableColors.map((color) => (
              <Card
                key={color.value}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedColor === color.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedColor(color.value)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color.preview }}
                  />
                  <span className="font-medium">{color.name}</span>
                </div>
              </Card>
            ))}
          </div>
          
          {availableColors.length === 0 && (
            <p className="text-center text-muted-foreground">
              No colors available. The game is full!
            </p>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedColor}
              className="flex-1"
            >
              Join Game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColorPickerDialog;