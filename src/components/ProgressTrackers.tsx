import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Apple, BookOpen, Target, TrendingUp, Plus } from 'lucide-react';
import { progressStorage, formatDate, type ProgressData } from '@/lib/storage';

export default function ProgressTrackers() {
  const [todayProgress, setTodayProgress] = useState<ProgressData>({
    date: formatDate(new Date()),
    health: 0,
    food: 0,
    learning: 0,
    goals: 0,
  });
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const allProgress = progressStorage.get();
    const today = formatDate(new Date());
    
    // Get today's progress
    const todayData = allProgress.find(p => p.date === today);
    if (todayData) {
      setTodayProgress(todayData);
    }

    // Get last 7 days of data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayData = allProgress.find(p => p.date === dateStr) || {
        date: dateStr,
        health: 0,
        food: 0,
        learning: 0,
        goals: 0,
      };
      last7Days.push(dayData);
    }
    setWeeklyData(last7Days);
  }, []);

  const updateProgress = (category: keyof Omit<ProgressData, 'date'>, value: number) => {
    const updated = { ...todayProgress, [category]: value };
    setTodayProgress(updated);
    progressStorage.addDaily(updated);
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAISuggestion = (category: string, value: number) => {
    const suggestions = {
      health: {
        low: "Bro, let's get moving! Even a 10-minute walk can boost your energy! 🚶‍♂️",
        medium: "Good progress! Maybe add some stretching or a quick workout? 💪",
        high: "Crushing it! Your body is thanking you right now! 🔥",
      },
      food: {
        low: "Fuel up, champ! Your body needs good nutrition to perform at its best! 🥗",
        medium: "Nice! Consider adding more veggies or protein to level up! 🍎",
        high: "Excellent nutrition game today! You're feeding success! 🌟",
      },
      learning: {
        low: "Knowledge is power, bro! Even 15 minutes of learning adds up! 📚",
        medium: "Great job expanding your mind! Keep that curiosity flowing! 🧠",
        high: "Learning machine mode activated! You're investing in your future! 🚀",
      },
      goals: {
        low: "Every small step counts! Let's tackle one goal at a time! 🎯",
        medium: "Solid progress! You're building momentum, keep it up! ⚡",
        high: "Goal crusher mode! You're unstoppable today! 🏆",
      },
    };

    const level = value >= 70 ? 'high' : value >= 40 ? 'medium' : 'low';
    return suggestions[category as keyof typeof suggestions][level];
  };

  const calculateWeeklyAverage = (category: keyof Omit<ProgressData, 'date'>) => {
    const total = weeklyData.reduce((sum, day) => sum + day[category], 0);
    return Math.round(total / weeklyData.length);
  };

  const trackers = [
    {
      key: 'health' as const,
      title: 'Health & Fitness',
      icon: Heart,
      color: 'text-red-500',
      description: 'Exercise, sleep, hydration',
    },
    {
      key: 'food' as const,
      title: 'Nutrition',
      icon: Apple,
      color: 'text-green-500',
      description: 'Healthy eating, meal planning',
    },
    {
      key: 'learning' as const,
      title: 'Learning',
      icon: BookOpen,
      color: 'text-blue-500',
      description: 'Reading, courses, skills',
    },
    {
      key: 'goals' as const,
      title: 'Goal Progress',
      icon: Target,
      color: 'text-purple-500',
      description: 'Daily goal achievements',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progress Trackers</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Save Progress" : "Update Progress"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {trackers.map((tracker) => {
          const Icon = tracker.icon;
          const value = todayProgress[tracker.key];
          const weeklyAvg = calculateWeeklyAverage(tracker.key);

          return (
            <Card key={tracker.key} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${tracker.color}`} />
                    <span className="text-lg">{tracker.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Week Avg: {weeklyAvg}%
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{tracker.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Progress</span>
                    <span className="font-semibold">{value}%</span>
                  </div>
                  <Progress 
                    value={value} 
                    className="h-3"
                  />
                  <div className={`h-1 rounded-full ${getProgressColor(value)} opacity-20`} />
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Progress:</label>
                    <Slider
                      value={[value]}
                      onValueChange={(values) => updateProgress(tracker.key, values[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">AI Suggestion:</p>
                  <p className="text-sm">{getAISuggestion(tracker.key, value)}</p>
                </div>

                {/* Weekly trend mini-chart */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">7-Day Trend</p>
                  <div className="flex items-end space-x-1 h-8">
                    {weeklyData.map((day, index) => (
                      <div
                        key={day.date}
                        className="flex-1 bg-muted rounded-sm relative"
                        style={{ height: '100%' }}
                      >
                        <div
                          className={`${getProgressColor(day[tracker.key])} rounded-sm transition-all duration-300`}
                          style={{ height: `${day[tracker.key]}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>7d ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Weekly Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {trackers.map((tracker) => {
              const weeklyAvg = calculateWeeklyAverage(tracker.key);
              const Icon = tracker.icon;
              
              return (
                <div key={tracker.key} className="text-center space-y-2">
                  <Icon className={`h-8 w-8 mx-auto ${tracker.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{weeklyAvg}%</p>
                    <p className="text-sm text-muted-foreground">{tracker.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}