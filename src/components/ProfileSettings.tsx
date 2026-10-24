import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot, Palette, Clock, Target, Save } from 'lucide-react';
import { type UserProfile } from '@/lib/storage';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function ProfileSettings({ userProfile, onProfileUpdate }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [hasChanges, setHasChanges] = useState(false);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    setHasChanges(true);
  };

  const updatePreferences = (updates: Partial<UserProfile['preferences']>) => {
    const updated = {
      ...profile,
      preferences: { ...profile.preferences, ...updates }
    };
    setProfile(updated);
    setHasChanges(true);
  };

  const saveProfile = () => {
    onProfileUpdate(profile);
    setHasChanges(false);
  };

  const broNameSuggestions = [
    'Bro', 'Buddy', 'Champ', 'Chief', 'Coach', 'Ace', 'Boss', 'Captain', 'Hero', 'Legend'
  ];

  const focusAreaOptions = [
    { value: 'health', label: 'Health & Fitness', icon: '🏃‍♂️' },
    { value: 'learning', label: 'Learning & Growth', icon: '📚' },
    { value: 'side-hustle', label: 'Side Hustle', icon: '💼' },
    { value: 'productivity', label: 'Productivity', icon: '⚡' },
    { value: 'mindfulness', label: 'Mindfulness', icon: '🧘‍♂️' },
    { value: 'creativity', label: 'Creativity', icon: '🎨' },
  ];

  const toggleFocusArea = (area: string) => {
    const current = profile.preferences.focusAreas;
    const updated = current.includes(area)
      ? current.filter(a => a !== area)
      : [...current, area];
    updatePreferences({ focusAreas: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Settings</h2>
          <p className="text-muted-foreground">Customize your Brolife experience</p>
        </div>
        {hasChanges && (
          <Button onClick={saveProfile}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                  {profile.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  value={profile.userName}
                  onChange={(e) => updateProfile({ userName: e.target.value })}
                  placeholder="What should I call you?"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="theme">Theme Preference</Label>
              <Select value={profile.theme} onValueChange={(value: 'light' | 'dark') => updateProfile({ theme: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Light Mode</SelectItem>
                  <SelectItem value="dark">🌙 Dark Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AI Bro Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Bro Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="broName">AI Bro Name</Label>
              <Input
                id="broName"
                value={profile.broName}
                onChange={(e) => updateProfile({ broName: e.target.value })}
                placeholder="What should your AI bro be called?"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {broNameSuggestions.map((name) => (
                  <Button
                    key={name}
                    variant="ghost"
                    size="sm"
                    onClick={() => updateProfile({ broName: name })}
                    className="h-6 px-2 text-xs"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-500 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Preview:</p>
                  <p className="text-sm text-muted-foreground">
                    "Hey {profile.userName}! I'm {profile.broName}, ready to help you crush your goals! 💪"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Working Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={profile.preferences.workingHours.start}
                  onChange={(e) => updatePreferences({
                    workingHours: { ...profile.preferences.workingHours, start: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={profile.preferences.workingHours.end}
                  onChange={(e) => updatePreferences({
                    workingHours: { ...profile.preferences.workingHours, end: e.target.value }
                  })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This helps your AI bro understand your schedule and provide better suggestions.
            </p>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Focus Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the areas you want to focus on. Your AI bro will tailor suggestions accordingly.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {focusAreaOptions.map((area) => (
                <div
                  key={area.value}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    profile.preferences.focusAreas.includes(area.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => toggleFocusArea(area.value)}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">{area.icon}</div>
                    <div className="text-sm font-medium">{area.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.preferences.focusAreas.map((area) => {
                const areaInfo = focusAreaOptions.find(a => a.value === area);
                return areaInfo ? (
                  <Badge key={area} variant="secondary">
                    {areaInfo.icon} {areaInfo.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Night Focus System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Alternating Night Focus System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold mb-2">💼 Side Hustle Nights</h4>
              <p className="text-sm text-muted-foreground mb-2">Monday, Wednesday, Friday, Sunday</p>
              <p className="text-sm">Focus on building your side projects, learning new skills, and working towards your entrepreneurial goals.</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold mb-2">🏃‍♂️ Health Focus Nights</h4>
              <p className="text-sm text-muted-foreground mb-2">Tuesday, Thursday, Saturday</p>
              <p className="text-sm">Prioritize your physical and mental health with exercise, meal prep, meditation, and self-care activities.</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>How it works:</strong> Your AI bro automatically adjusts suggestions and timetable recommendations based on the current night's focus. This helps you maintain a balanced approach to personal growth!
            </p>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={saveProfile} size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      )}
    </div>
  );
}