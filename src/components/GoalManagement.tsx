import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Plus, Edit, Trash2, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { goalsStorage, generateId, type Goal } from '@/lib/storage';

export default function GoalManagement() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal' as Goal['category'],
    targetDate: '',
    milestones: [''],
  });

  useEffect(() => {
    const savedGoals = goalsStorage.get();
    setGoals(savedGoals);
  }, []);

  const categories = [
    { value: 'health', label: 'Health', color: 'bg-green-500', icon: '🏃‍♂️' },
    { value: 'learning', label: 'Learning', color: 'bg-blue-500', icon: '📚' },
    { value: 'side-hustle', label: 'Side Hustle', color: 'bg-purple-500', icon: '💼' },
    { value: 'personal', label: 'Personal', color: 'bg-orange-500', icon: '🎯' },
  ];

  const getCategoryInfo = (category: Goal['category']) => {
    return categories.find(cat => cat.value === category) || categories[3];
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetDate) return;

    const goal: Goal = {
      id: generateId(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      targetDate: newGoal.targetDate,
      progress: 0,
      milestones: newGoal.milestones
        .filter(m => m.trim())
        .map(title => ({ id: generateId(), title, completed: false })),
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    goalsStorage.set(updatedGoals);
    
    setNewGoal({
      title: '',
      description: '',
      category: 'personal',
      targetDate: '',
      milestones: [''],
    });
    setIsAddingGoal(false);
  };

  const updateGoal = () => {
    if (!editingGoal) return;

    const updatedGoals = goals.map(goal =>
      goal.id === editingGoal.id ? editingGoal : goal
    );
    
    setGoals(updatedGoals);
    goalsStorage.set(updatedGoals);
    setEditingGoal(null);
  };

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    setGoals(updatedGoals);
    goalsStorage.set(updatedGoals);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone =>
          milestone.id === milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        );
        
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const progress = updatedMilestones.length > 0 
          ? Math.round((completedCount / updatedMilestones.length) * 100)
          : 0;

        return { ...goal, milestones: updatedMilestones, progress };
      }
      return goal;
    });

    setGoals(updatedGoals);
    goalsStorage.set(updatedGoals);
  };

  const addMilestone = (type: 'new' | 'edit') => {
    if (type === 'new') {
      setNewGoal({ ...newGoal, milestones: [...newGoal.milestones, ''] });
    } else if (editingGoal) {
      setEditingGoal({
        ...editingGoal,
        milestones: [...editingGoal.milestones, { id: generateId(), title: '', completed: false }]
      });
    }
  };

  const removeMilestone = (index: number, type: 'new' | 'edit') => {
    if (type === 'new') {
      const updated = newGoal.milestones.filter((_, i) => i !== index);
      setNewGoal({ ...newGoal, milestones: updated.length ? updated : [''] });
    } else if (editingGoal) {
      const updated = editingGoal.milestones.filter((_, i) => i !== index);
      setEditingGoal({ ...editingGoal, milestones: updated });
    }
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMotivationalMessage = (progress: number, daysLeft: number) => {
    if (progress === 100) return "🎉 Goal achieved! You're a champion!";
    if (progress >= 80) return "🔥 Almost there, bro! Push through!";
    if (progress >= 60) return "💪 Great momentum! Keep crushing it!";
    if (progress >= 40) return "⚡ You're making solid progress!";
    if (daysLeft < 7) return "⏰ Crunch time! Let's make it happen!";
    return "🚀 Let's build some momentum!";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Goal Management</h2>
          <p className="text-muted-foreground">Track your progress and achieve your dreams</p>
        </div>
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Goal Title</label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="What do you want to achieve?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newGoal.category} onValueChange={(value: Goal['category']) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Milestones</label>
                {newGoal.milestones.map((milestone, index) => (
                  <div key={index} className="flex space-x-2 mt-2">
                    <Input
                      value={milestone}
                      onChange={(e) => {
                        const updated = [...newGoal.milestones];
                        updated[index] = e.target.value;
                        setNewGoal({ ...newGoal, milestones: updated });
                      }}
                      placeholder="Milestone description"
                    />
                    {newGoal.milestones.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeMilestone(index, 'new')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" onClick={() => addMilestone('new')} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
              <Button onClick={addGoal} className="w-full">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {goals.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Set your first goal and start your journey to success!
              </p>
              <Button onClick={() => setIsAddingGoal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const categoryInfo = getCategoryInfo(goal.category);
            const daysLeft = getDaysUntilTarget(goal.targetDate);
            const isOverdue = daysLeft < 0;
            const isCompleted = goal.progress === 100;

            return (
              <Card key={goal.id} className={`relative ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={`${categoryInfo.color} text-white border-0`}>
                          {categoryInfo.icon} {categoryInfo.label}
                        </Badge>
                        {isCompleted && <Trophy className="h-5 w-5 text-yellow-500" />}
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingGoal(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Goal</DialogTitle>
                          </DialogHeader>
                          {editingGoal && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Goal Title</label>
                                <Input
                                  value={editingGoal.title}
                                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  value={editingGoal.description}
                                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category</label>
                                <Select value={editingGoal.category} onValueChange={(value: Goal['category']) => setEditingGoal({ ...editingGoal, category: value })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Target Date</label>
                                <Input
                                  type="date"
                                  value={editingGoal.targetDate}
                                  onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Milestones</label>
                                {editingGoal.milestones.map((milestone, index) => (
                                  <div key={milestone.id} className="flex space-x-2 mt-2">
                                    <Input
                                      value={milestone.title}
                                      onChange={(e) => {
                                        const updated = [...editingGoal.milestones];
                                        updated[index] = { ...updated[index], title: e.target.value };
                                        setEditingGoal({ ...editingGoal, milestones: updated });
                                      }}
                                      placeholder="Milestone description"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeMilestone(index, 'edit')}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button variant="ghost" onClick={() => addMilestone('edit')} className="mt-2">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Milestone
                                </Button>
                              </div>
                              <Button onClick={updateGoal} className="w-full">Save Changes</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  {/* Target Date */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>
                      {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                    </Badge>
                  </div>

                  {/* Milestones */}
                  {goal.milestones.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Milestones:</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {goal.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center space-x-2">
                            <Checkbox
                              checked={milestone.completed}
                              onCheckedChange={() => toggleMilestone(goal.id, milestone.id)}
                            />
                            <span className={`text-sm ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {milestone.title}
                            </span>
                            {milestone.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Motivational Message */}
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium text-center">
                      {getMotivationalMessage(goal.progress, daysLeft)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}