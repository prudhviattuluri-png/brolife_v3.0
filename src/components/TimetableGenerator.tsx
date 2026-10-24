import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Plus, Edit, Trash2, Save } from 'lucide-react';
import { timetableStorage, generateId, getCurrentFocus, type TimetableSlot } from '@/lib/storage';

export default function TimetableGenerator() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [newSlot, setNewSlot] = useState({
    time: '',
    activity: '',
    category: 'personal' as TimetableSlot['category'],
    duration: 60,
  });

  const currentFocus = getCurrentFocus();

  useEffect(() => {
    const savedSlots = timetableStorage.get();
    setSlots(savedSlots);
  }, []);

  const timeSlots = [
    '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
  ];

  const categories = [
    { value: 'work', label: 'Work', color: 'bg-blue-500' },
    { value: 'health', label: 'Health', color: 'bg-green-500' },
    { value: 'learning', label: 'Learning', color: 'bg-purple-500' },
    { value: 'personal', label: 'Personal', color: 'bg-gray-500' },
    { value: 'side-hustle', label: 'Side Hustle', color: 'bg-orange-500' },
  ];

  const getCategoryColor = (category: TimetableSlot['category']) => {
    return categories.find(cat => cat.value === category)?.color || 'bg-gray-500';
  };

  const saveSlots = (updatedSlots: TimetableSlot[]) => {
    setSlots(updatedSlots);
    timetableStorage.set(updatedSlots);
  };

  const addSlot = () => {
    if (!newSlot.time || !newSlot.activity) return;

    const slot: TimetableSlot = {
      id: generateId(),
      time: newSlot.time,
      activity: newSlot.activity,
      category: newSlot.category,
      duration: newSlot.duration,
    };

    const updatedSlots = [...slots, slot].sort((a, b) => a.time.localeCompare(b.time));
    saveSlots(updatedSlots);
    
    setNewSlot({ time: '', activity: '', category: 'personal', duration: 60 });
    setIsAddingSlot(false);
  };

  const updateSlot = () => {
    if (!editingSlot) return;

    const updatedSlots = slots.map(slot =>
      slot.id === editingSlot.id ? editingSlot : slot
    ).sort((a, b) => a.time.localeCompare(b.time));
    
    saveSlots(updatedSlots);
    setEditingSlot(null);
  };

  const deleteSlot = (id: string) => {
    const updatedSlots = slots.filter(slot => slot.id !== id);
    saveSlots(updatedSlots);
  };

  const generateSmartSchedule = () => {
    const smartSlots: TimetableSlot[] = [
      { id: generateId(), time: '07:30', activity: 'Morning Routine & Meditation', category: 'health', duration: 30 },
      { id: generateId(), time: '08:00', activity: 'Healthy Breakfast', category: 'health', duration: 30 },
      { id: generateId(), time: '09:00', activity: 'Deep Work Session', category: 'work', duration: 120 },
      { id: generateId(), time: '11:00', activity: 'Break & Hydration', category: 'health', duration: 15 },
      { id: generateId(), time: '11:15', activity: 'Focused Work', category: 'work', duration: 105 },
      { id: generateId(), time: '13:00', activity: 'Lunch Break', category: 'personal', duration: 60 },
      { id: generateId(), time: '14:00', activity: 'Afternoon Work', category: 'work', duration: 120 },
      { id: generateId(), time: '16:00', activity: 'Learning Time', category: 'learning', duration: 60 },
      { id: generateId(), time: '17:00', activity: 'Exercise/Workout', category: 'health', duration: 60 },
      { id: generateId(), time: '18:00', activity: 'Dinner & Family Time', category: 'personal', duration: 90 },
      { id: generateId(), time: '19:30', activity: currentFocus === 'side-hustle' ? 'Side Hustle Work' : 'Health Focus Time', category: currentFocus, duration: 120 },
      { id: generateId(), time: '21:30', activity: 'Wind Down & Reading', category: 'personal', duration: 60 },
      { id: generateId(), time: '22:30', activity: 'Sleep Preparation', category: 'health', duration: 60 },
    ];

    saveSlots(smartSlots);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Timetable</h2>
          <p className="text-muted-foreground">Plan your day from 7:30 AM to 12:30 AM</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateSmartSchedule}>
            Generate Smart Schedule
          </Button>
          <Dialog open={isAddingSlot} onOpenChange={setIsAddingSlot}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Time Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Select value={newSlot.time} onValueChange={(value) => setNewSlot({ ...newSlot, time: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Activity</label>
                  <Input
                    value={newSlot.activity}
                    onChange={(e) => setNewSlot({ ...newSlot, activity: e.target.value })}
                    placeholder="What will you do?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newSlot.category} onValueChange={(value: TimetableSlot['category']) => setNewSlot({ ...newSlot, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newSlot.duration}
                    onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) || 60 })}
                    min="15"
                    max="480"
                  />
                </div>
                <Button onClick={addSlot} className="w-full">Add Slot</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Focus Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {currentFocus === 'side-hustle' ? '💼' : '🏃‍♂️'}
              </div>
              <p className="font-semibold">Tonight's Focus</p>
              <p className="text-sm text-muted-foreground">
                {currentFocus === 'side-hustle' ? 'Side Hustle Time' : 'Health Focus Time'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      <div className="grid gap-4">
        {slots.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No schedule yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first time slot or generate a smart schedule to get started!
              </p>
              <Button onClick={generateSmartSchedule}>Generate Smart Schedule</Button>
            </CardContent>
          </Card>
        ) : (
          slots.map((slot) => (
            <Card key={slot.id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{slot.time}</div>
                      <div className="text-xs text-muted-foreground">{slot.duration}min</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{slot.activity}</h3>
                      <Badge className={`${getCategoryColor(slot.category)} text-white border-0 mt-1`}>
                        {categories.find(cat => cat.value === slot.category)?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingSlot(slot)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Time Slot</DialogTitle>
                        </DialogHeader>
                        {editingSlot && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Time</label>
                              <Select value={editingSlot.time} onValueChange={(value) => setEditingSlot({ ...editingSlot, time: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Activity</label>
                              <Input
                                value={editingSlot.activity}
                                onChange={(e) => setEditingSlot({ ...editingSlot, activity: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Category</label>
                              <Select value={editingSlot.category} onValueChange={(value: TimetableSlot['category']) => setEditingSlot({ ...editingSlot, category: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Duration (minutes)</label>
                              <Input
                                type="number"
                                value={editingSlot.duration}
                                onChange={(e) => setEditingSlot({ ...editingSlot, duration: parseInt(e.target.value) || 60 })}
                                min="15"
                                max="480"
                              />
                            </div>
                            <Button onClick={updateSlot} className="w-full">
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}