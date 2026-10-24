import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, User, Bot, Target, CheckCircle } from 'lucide-react';
import { userProfileStorage, type UserProfile } from '@/lib/storage';

interface WelcomeWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export default function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    broName: 'Bro',
    userName: '',
    theme: 'light',
    preferences: {
      focusAreas: [],
      workingHours: { start: '09:00', end: '17:00' },
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const focusAreaOptions = [
    { value: 'health', label: 'Health & Fitness', icon: '🏃‍♂️', description: 'Exercise, nutrition, wellness' },
    { value: 'learning', label: 'Learning & Growth', icon: '📚', description: 'Skills, courses, reading' },
    { value: 'side-hustle', label: 'Side Hustle', icon: '💼', description: 'Business, projects, income' },
    { value: 'productivity', label: 'Productivity', icon: '⚡', description: 'Time management, efficiency' },
    { value: 'mindfulness', label: 'Mindfulness', icon: '🧘‍♂️', description: 'Meditation, mental health' },
    { value: 'creativity', label: 'Creativity', icon: '🎨', description: 'Art, writing, innovation' },
  ];

  const broNameSuggestions = ['Bro', 'Buddy', 'Champ', 'Chief', 'Coach', 'Ace'];

  const toggleFocusArea = (area: string) => {
    const current = profile.preferences.focusAreas;
    const updated = current.includes(area)
      ? current.filter(a => a !== area)
      : [...current, area];
    setProfile({
      ...profile,
      preferences: { ...profile.preferences, focusAreas: updated }
    });
  };

  const handleComplete = () => {
    const finalProfile = {
      ...profile,
      userName: profile.userName || 'Champion'
    };
    userProfileStorage.set(finalProfile);
    onComplete(finalProfile);
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Brolife!
            </CardTitle>
          </div>
          <p className="text-muted-foreground">Let's set up your AI productivity companion in just a few steps</p>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">Step {step} of {totalSteps}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Hey there, future champion! 👋</h2>
                <p className="text-muted-foreground">
                  I'm your AI productivity bro, here to help you crush your goals and build amazing habits.
                  Together, we'll create a personalized experience that keeps you motivated and on track!
                </p>
                <div className="grid gap-4 md:grid-cols-3 mt-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl mb-2">🤖</div>
                    <h3 className="font-semibold">AI Chat Assistant</h3>
                    <p className="text-sm text-muted-foreground">Get motivated and stay on track</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="font-semibold">Progress Tracking</h3>
                    <p className="text-sm text-muted-foreground">Visualize your growth</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <h3 className="font-semibold">Goal Management</h3>
                    <p className="text-sm text-muted-foreground">Achieve your dreams</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h2 className="text-2xl font-bold">What should I call you?</h2>
                <p className="text-muted-foreground">Let's personalize your experience</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userName">Your Name</Label>
                  <Input
                    id="userName"
                    value={profile.userName}
                    onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                    placeholder="Enter your name (e.g., Alex, Sam, Jordan)"
                    className="text-center text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Don't worry, you can change this anytime in settings!
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h2 className="text-2xl font-bold">Meet your AI bro!</h2>
                <p className="text-muted-foreground">Choose what you'd like to call your AI companion</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="broName">AI Bro Name</Label>
                  <Input
                    id="broName"
                    value={profile.broName}
                    onChange={(e) => setProfile({ ...profile, broName: e.target.value })}
                    placeholder="Choose a name for your AI bro"
                    className="text-center text-lg"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {broNameSuggestions.map((name) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => setProfile({ ...profile, broName: name })}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Preview:</strong> "Hey {profile.userName || 'Champion'}! I'm {profile.broName}, 
                    ready to help you crush your goals! 💪"
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold">What areas do you want to focus on?</h2>
                <p className="text-muted-foreground">Select 2-4 areas that matter most to you right now</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {focusAreaOptions.map((area) => (
                  <div
                    key={area.value}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                      profile.preferences.focusAreas.includes(area.value)
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                        : 'bg-muted hover:bg-muted/80 border-border'
                    }`}
                    onClick={() => toggleFocusArea(area.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{area.icon}</div>
                      <div>
                        <h3 className="font-semibold">{area.label}</h3>
                        <p className="text-sm opacity-90">{area.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {profile.preferences.focusAreas.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Selected areas:</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.preferences.focusAreas.map((area) => {
                      const areaInfo = focusAreaOptions.find(a => a.value === area);
                      return areaInfo ? (
                        <Badge key={area} variant="secondary">
                          {areaInfo.icon} {areaInfo.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < totalSteps ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Let's Get Started!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}