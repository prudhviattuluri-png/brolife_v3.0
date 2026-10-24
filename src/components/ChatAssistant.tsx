import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, MessageCircle, Target, Calendar, TrendingUp } from 'lucide-react';
import { getCurrentFocus } from '@/lib/storage';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatAssistantProps {
  broName: string;
  userName: string;
}

export default function ChatAssistant({ broName, userName }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hey ${userName}! I'm ${broName}, your AI productivity bro! 🚀 I'm here to help you crush your goals and stay motivated. What's on your mind today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentFocus = getCurrentFocus();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickStarters = [
    {
      icon: <Target className="h-4 w-4" />,
      text: "Help me set tonight's goals",
      message: `Hey ${broName}! I want to set some goals for tonight. Can you help me create a plan based on my ${currentFocus === 'side-hustle' ? 'side hustle' : 'health'} focus?`
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      text: "Plan my evening schedule",
      message: `${broName}, can you help me plan an effective evening schedule? I want to make the most of my time tonight!`
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "I need motivation!",
      message: `${broName}, I'm feeling a bit unmotivated today. Can you give me some encouragement and help me get back on track?`
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "What should I focus on?",
      message: `Hey ${broName}! I have some free time and want to be productive. What should I focus on based on my current goals?`
    }
  ];

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Goal-related responses
    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      const focusArea = currentFocus === 'side-hustle' ? 'side hustle' : 'health and fitness';
      return `Great question, ${userName}! Since tonight is ${focusArea} focus, here are some goal ideas:

${currentFocus === 'side-hustle' 
  ? `💼 **Side Hustle Goals:**
• Work on your project for 2-3 hours
• Research new opportunities or skills
• Network with potential clients/partners
• Update your portfolio or LinkedIn
• Plan tomorrow's business tasks` 
  : `🏃‍♂️ **Health Focus Goals:**
• Get 30-60 minutes of exercise
• Prepare healthy meals for tomorrow
• Practice meditation or mindfulness
• Get 7-8 hours of quality sleep
• Stay hydrated throughout the evening`}

Pick 2-3 that resonate with you and let's make it happen! Which ones speak to you? 🎯`;
    }

    // Schedule/planning responses
    if (lowerMessage.includes('schedule') || lowerMessage.includes('plan') || lowerMessage.includes('time')) {
      return `Let's create an awesome evening schedule, ${userName}! 📅

**Here's a productive evening framework:**

🕕 **6:00-7:00 PM:** Dinner & wind down from work
🕖 **7:00-8:30 PM:** ${currentFocus === 'side-hustle' ? 'Deep work on side hustle' : 'Exercise or physical activity'}
🕘 **8:30-9:00 PM:** Quick break, snack, hydrate
🕘 **9:00-10:30 PM:** ${currentFocus === 'side-hustle' ? 'Continue side hustle or skill learning' : 'Meal prep or self-care'}
🕚 **10:30-11:00 PM:** Wind down, plan tomorrow
🕚 **11:00 PM:** Bedtime routine

Want me to customize this based on your specific goals? What time do you usually finish work? 🤔`;
    }

    // Motivation responses
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourage') || lowerMessage.includes('unmotivat')) {
      const motivationalMessages = [
        `Listen up, ${userName}! 💪 You're not just anyone - you're someone who's actively working on becoming better every single day. That puts you in the top 1% already!`,
        `Hey ${userName}! 🔥 Remember why you started this journey. Every small step you take tonight is building the future version of yourself. You've got this!`,
        `${userName}, you absolute legend! 🌟 The fact that you're here, asking for help and staying committed to growth shows you're already winning. Let's channel this energy!`,
        `Yo ${userName}! 🚀 Motivation is temporary, but the habits you're building are permanent. Even if you don't feel like it today, just do ONE small thing. Momentum builds momentum!`
      ];
      
      const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      return `${randomMotivation}

**Quick motivation boost:**
• You're investing in yourself (that's rare!)
• Small consistent actions = massive results
• Future you will thank present you
• You're building discipline, not just achieving goals

What's ONE thing you can do in the next 30 minutes to feel accomplished? Let's start there! 💯`;
    }

    // Focus/productivity responses
    if (lowerMessage.includes('focus') || lowerMessage.includes('productive') || lowerMessage.includes('what should')) {
      return `Perfect timing, ${userName}! 🎯 Based on tonight being ${currentFocus === 'side-hustle' ? 'side hustle' : 'health'} focus, here's what I recommend:

${currentFocus === 'side-hustle' 
  ? `**🚀 Side Hustle Power Hour:**
• Pick your most important project
• Set a timer for 25-50 minutes (Pomodoro style)
• Eliminate all distractions (phone away!)
• Focus on ONE specific task, not multiple things
• Take a 10-minute break, then repeat

**Best tasks for tonight:**
• Content creation or marketing
• Skill development (courses, tutorials)
• Client work or project development
• Business planning or research`
  : `**💪 Health Focus Session:**
• Start with 10 minutes of movement (even just stretching!)
• Prepare a nutritious meal or snacks
• Plan your workout for this week
• Practice mindfulness or meditation
• Organize your health goals and track progress

**Energy boosters:**
• Drink water first
• Put on energizing music
• Set up your space for success
• Start with the easiest task to build momentum`}

What feels most important to you right now? Let's make it happen! 🔥`;
    }

    // Default encouraging response
    const defaultResponses = [
      `That's a great question, ${userName}! 🤔 I love that you're thinking about this. Based on your ${currentFocus === 'side-hustle' ? 'side hustle' : 'health'} focus tonight, let's break this down and create a plan that works for you!`,
      `Hey ${userName}! 💡 I'm here to help you figure this out. Since tonight is all about ${currentFocus === 'side-hustle' ? 'building your side hustle' : 'focusing on your health'}, let's approach this strategically!`,
      `Absolutely, ${userName}! 🎯 That's exactly the kind of thinking that separates achievers from dreamers. Let me help you tackle this with your ${currentFocus === 'side-hustle' ? 'entrepreneurial' : 'wellness'} mindset!`,
      `I hear you, ${userName}! 🚀 This is why I'm here - to help you navigate these decisions and stay focused on what matters most. Given tonight's ${currentFocus === 'side-hustle' ? 'side hustle' : 'health'} theme, here's my take...`
    ];

    const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    
    return `${randomResponse}

Can you give me a bit more context about what specific area you'd like help with? I can provide more targeted advice once I understand your situation better! 

**I can help with:**
• Goal setting and planning
• Time management and scheduling  
• Motivation and mindset
• Specific ${currentFocus === 'side-hustle' ? 'business/project' : 'health/fitness'} advice
• Accountability and progress tracking

What's most important to you right now? 🤝`;
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(textToSend),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{broName}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Your AI productivity companion</p>
              </div>
            </div>
            <Badge variant="outline" className={`${currentFocus === 'side-hustle' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {currentFocus === 'side-hustle' ? '💼 Side Hustle Focus' : '🏃‍♂️ Health Focus'}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Quick Starters */}
          <div className="grid grid-cols-2 gap-2">
            {quickStarters.map((starter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(starter.message)}
                className="h-auto p-3 text-left justify-start hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <div className="flex items-center space-x-2">
                  {starter.icon}
                  <span className="text-xs">{starter.text}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={message.sender === 'user' 
                      ? "bg-gradient-to-r from-green-500 to-blue-500 text-white" 
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    }>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[80%] ${message.sender === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${broName} anything...`}
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputMessage.trim() || isTyping}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}