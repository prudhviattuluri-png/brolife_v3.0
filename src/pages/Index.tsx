import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Calendar, Target, TrendingUp, User, Moon, Sun, HelpCircle, Sparkles } from 'lucide-react';
import ChatAssistant from '@/components/ChatAssistant';
import TimetableGenerator from '@/components/TimetableGenerator';
import ProgressTrackers from '@/components/ProgressTrackers';
import GoalManagement from '@/components/GoalManagement';
import ProfileSettings from '@/components/ProfileSettings';
import WelcomeWizard from '@/components/WelcomeWizard';
import { userProfileStorage, getCurrentFocus, type UserProfile } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState(userProfileStorage.get());
  const [currentFocus, setCurrentFocus] = useState(getCurrentFocus());
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const profile = userProfileStorage.get();
    setUserProfile(profile);
    
    // Show welcome wizard for new users
    if (!profile.userName || profile.userName === 'Champion') {
      setShowWelcome(true);
    }
    
    // Apply theme
    document.documentElement.classList.toggle('dark', profile.theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = userProfile.theme === 'light' ? 'dark' : 'light';
    const updatedProfile = { ...userProfile, theme: newTheme };
    setUserProfile(updatedProfile);
    userProfileStorage.set(updatedProfile);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    toast({
      title: "Theme Updated! 🎨",
      description: `Switched to ${newTheme} mode`,
      variant: "success",
    });
  };

  const handleWelcomeComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setShowWelcome(false);
    toast({
      title: "Welcome to Brolife! 🎉",
      description: `Hey ${profile.userName}! Your AI bro ${profile.broName} is ready to help you succeed!`,
      variant: "success",
    });
  };

  const getFocusEmoji = () => {
    return currentFocus === 'side-hustle' ? '💼' : '🏃‍♂️';
  };

  const getFocusColor = () => {
    return currentFocus === 'side-hustle' ? 'bg-purple-500' : 'bg-green-500';
  };

  const tabInfo = {
    dashboard: {
      title: "Dashboard",
      description: "Overview of your progress and daily focus",
      tip: "Your central hub for tracking progress and staying motivated!"
    },
    chat: {
      title: "Chat",
      description: `Chat with your AI bro ${userProfile.broName}`,
      tip: "Get personalized motivation and advice from your AI companion!"
    },
    timetable: {
      title: "Schedule",
      description: "Plan your day from 7:30 AM to 12:30 AM",
      tip: "Create smart schedules that adapt to your goals and focus areas!"
    },
    goals: {
      title: "Goals",
      description: "Set, track, and achieve your dreams",
      tip: "Break down big dreams into achievable milestones!"
    },
    profile: {
      title: "Profile",
      description: "Customize your Brolife experience",
      tip: "Personalize your AI bro and set your preferences!"
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const info = tabInfo[newTab as keyof typeof tabInfo];
    if (info) {
      toast({
        title: `${info.title} 📍`,
        description: info.description,
      });
    }
  };

  if (showWelcome) {
    return <WelcomeWizard onComplete={handleWelcomeComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Brolife
              </h1>
              <p className="text-sm text-muted-foreground">
                Hey {userProfile.userName}! Ready to crush it? 👋
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={`${getFocusColor()} text-white border-0 animate-bounce`}>
                  {getFocusEmoji()} Tonight: {currentFocus === 'side-hustle' ? 'Side Hustle' : 'Health Focus'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your focus automatically alternates based on the day of the week!</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setShowTips(!showTips)}>
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle helpful tips</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {userProfile.theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {userProfile.theme === 'light' ? 'dark' : 'light'} mode</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Tips Banner */}
      {showTips && (
        <div className="bg-blue-50 dark:bg-blue-950 border-b p-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> {tabInfo[activeTab as keyof typeof tabInfo]?.tip || "Explore all the features to maximize your productivity!"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowTips(false)}>
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="dashboard" className="flex items-center space-x-2 transition-all hover:scale-105">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your progress overview and daily focus</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="chat" className="flex items-center space-x-2 transition-all hover:scale-105">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chat with {userProfile.broName}, your AI productivity companion</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="timetable" className="flex items-center space-x-2 transition-all hover:scale-105">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Plan your perfect day with smart scheduling</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="goals" className="flex items-center space-x-2 transition-all hover:scale-105">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Goals</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set ambitious goals and track your progress</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="profile" className="flex items-center space-x-2 transition-all hover:scale-105">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Customize your experience and preferences</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-full lg:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Welcome back, {userProfile.userName}!</span>
                    <span className="animate-bounce">🚀</span>
                  </CardTitle>
                  <CardDescription>
                    Your AI bro <strong>{userProfile.broName}</strong> is here to help you crush your goals today!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button 
                      onClick={() => handleTabChange('chat')} 
                      className="h-20 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all"
                    >
                      <div className="text-center">
                        <MessageCircle className="h-6 w-6 mx-auto mb-1" />
                        <div>Chat with {userProfile.broName}</div>
                        <div className="text-xs opacity-80">Get motivated!</div>
                      </div>
                    </Button>
                    <Button 
                      onClick={() => handleTabChange('timetable')} 
                      variant="outline" 
                      className="h-20 hover:bg-primary hover:text-primary-foreground transform hover:scale-105 transition-all"
                    >
                      <div className="text-center">
                        <Calendar className="h-6 w-6 mx-auto mb-1" />
                        <div>Plan Your Day</div>
                        <div className="text-xs opacity-80">Smart scheduling</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>Today's Focus</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your focus alternates automatically:<br/>
                        M/W/F/S: Side Hustle<br/>
                        T/Th/Sa: Health Focus</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="text-4xl animate-pulse">{getFocusEmoji()}</div>
                    <div className="font-semibold">
                      {currentFocus === 'side-hustle' ? 'Side Hustle Night' : 'Health Focus Night'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentFocus === 'side-hustle' 
                        ? 'Time to work on your side projects and build your future!'
                        : 'Focus on your health and wellbeing tonight!'
                      }
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTabChange('goals')}
                      className="mt-2"
                    >
                      Set Tonight's Goals
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ProgressTrackers />
          </TabsContent>

          <TabsContent value="chat" className="animate-in fade-in slide-in-from-right-4 duration-500">
            <ChatAssistant broName={userProfile.broName} userName={userProfile.userName} />
          </TabsContent>

          <TabsContent value="timetable" className="animate-in fade-in slide-in-from-left-4 duration-500">
            <TimetableGenerator />
          </TabsContent>

          <TabsContent value="goals" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GoalManagement />
          </TabsContent>

          <TabsContent value="profile" className="animate-in fade-in slide-in-from-top-4 duration-500">
            <ProfileSettings 
              userProfile={userProfile} 
              onProfileUpdate={(profile) => {
                setUserProfile(profile);
                userProfileStorage.set(profile);
                toast({
                  title: "Profile Updated! ✨",
                  description: "Your changes have been saved successfully",
                  variant: "success",
                });
              }} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}