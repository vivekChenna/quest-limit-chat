import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  LogOut, 
  User, 
  Bot,
  Menu,
  X
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface UserData {
  username: string;
  role: string;
  questionsToday: number;
}

const Chat = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(`chatHistory_${parsedUser.username}`);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      // Convert string dates back to Date objects
      const historyWithDates = parsedHistory.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChatHistory(historyWithDates);
    }
  }, [navigate]);

  const canAskQuestion = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.questionsToday < 10;
  };

  const getQuestionLimit = () => {
    if (!user) return "";
    if (user.role === "admin") return "Unlimited";
    return `${user.questionsToday}/10 today`;
  };

const generateChatId = (): string => {
    return 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const generateBotResponse = (userMessage: string): string => {
    // Simple mock responses
    const responses = [
      "I understand your question about: " + userMessage.slice(0, 30) + "... Let me help you with that.",
      "That's an interesting point! Here's what I think about " + userMessage.slice(0, 20) + "...",
      "Based on your question, I can provide some insights on this topic.",
      "Thank you for asking! This is a great question that requires careful consideration.",
      "I can help you with that. Let me break down the information for you."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !user || !canAskQuestion()) return;

    if (!canAskQuestion()) {
      toast({
        title: "Question limit reached",
        description: "You've reached your daily question limit of 10.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      isBot: false,
      timestamp: new Date(),
    };

    let updatedMessages = [...currentMessages, userMessage];
    setCurrentMessages(updatedMessages);
    setCurrentMessage("");

    // Update question count
    const updatedUser = { ...user, questionsToday: user.questionsToday + 1 };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(userMessage.content),
        isBot: true,
        timestamp: new Date(),
      };

      updatedMessages = [...updatedMessages, botMessage];
      setCurrentMessages(updatedMessages);

      // Save or update chat history
      const chatTitle = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : "");
      
      if (activeChat) {
        // Update existing chat
        const updatedHistory = chatHistory.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: updatedMessages, title: chatTitle }
            : chat
        );
        setChatHistory(updatedHistory);
        localStorage.setItem(`chatHistory_${user.username}`, JSON.stringify(updatedHistory));
      } else {
        // Create new chat
        const newChat: ChatHistory = {
          id: generateChatId(),
          title: chatTitle,
          messages: updatedMessages,
          createdAt: new Date(),
        };
        const updatedHistory = [newChat, ...chatHistory];
        setChatHistory(updatedHistory);
        setActiveChat(newChat.id);
        localStorage.setItem(`chatHistory_${user.username}`, JSON.stringify(updatedHistory));
      }

      setIsLoading(false);
    }, 1500);
  };

  const startNewChat = () => {
    setActiveChat(null);
    setCurrentMessages([]);
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setCurrentMessages(chat.messages);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-chat-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r bg-chat-sidebar`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="font-semibold">ChatBot AI</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={startNewChat}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <Button
                  key={chat.id}
                  variant={activeChat === chat.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left p-3 h-auto"
                  onClick={() => loadChat(chat.id)}
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {chat.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {user.role}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Questions: {getQuestionLimit()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">
              {activeChat ? chatHistory.find(c => c.id === activeChat)?.title || "Chat" : "New Chat"}
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {getQuestionLimit()}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {currentMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-muted-foreground">Ask me anything to get started!</p>
              </div>
            ) : (
              currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.isBot ? "bg-muted" : "bg-primary"}`}>
                      {message.isBot ? (
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                     <div className={`rounded-lg p-4 ${message.isBot ? "bg-chat-bot-message border border-border" : "bg-primary text-primary-foreground"}`}>
                       <p className="text-sm leading-relaxed">{message.content}</p>
                     </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                   <div className="rounded-lg p-4 bg-chat-bot-message border border-border">
                     <div className="flex space-x-1">
                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                       <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canAskQuestion() ? "Message ChatBot AI..." : "Daily question limit reached"}
                disabled={!canAskQuestion() || isLoading}
                className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || !canAskQuestion() || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!canAskQuestion() && user.role !== "admin" && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                You've reached your daily limit of 10 questions. Try again tomorrow!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;