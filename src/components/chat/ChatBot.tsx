import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Send, Sparkles, Bot, User } from "lucide-react";
import { aiService } from "@/services/aiService";
import { useNavigation } from "@/hooks/useNavigation";

// Using placeholder for logo since upload failed
const salamLogo = "/lovable-uploads/2d567e40-963a-4be7-aacd-f6669ccd6bdf.png";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  confidence?: number;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const { currentPath } = useNavigation();

  // Auto-suggestions based on current context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadAutoSuggestions();
    }
  }, [isOpen, currentPath]);

  const loadAutoSuggestions = async () => {
    try {
      const context = {
        currentPath,
        userRole: 'employee',
        department: 'general',
      };
      
      const response = await aiService.getAutoSuggestions(context);
      if (response.success && response.suggestions) {
        setAutoSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Failed to load auto-suggestions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(),
      text: inputValue, 
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const context = {
        previousMessages: messages.map(m => m.text),
        currentPath,
        userRole: 'employee',
      };
      
      const response = await aiService.generateChatResponse(inputValue, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.success ? (response.data?.answer || response.data?.suggestion || "I'm here to help with your OKR questions!") : `Error: ${response.error}`,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAutoSuggestions([]);
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50 p-0"
      >
        <img 
          src={salamLogo} 
          alt="Selam AI" 
          className="w-10 h-10 rounded-full object-cover"
        />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-[500px] z-50 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <img 
                src={salamLogo} 
                alt="Selam AI" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <CardTitle className="text-lg">Selam AI</CardTitle>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messages.length} messages
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="h-8 w-8 p-0"
                  title="Clear chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col h-full p-4 pt-0">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground text-center mb-4">
                    Hi! I'm Selam AI, your OKR assistant. How can I help you today?
                  </p>
                </div>
                
                {/* Auto-suggestions */}
                {autoSuggestions.length > 0 && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Quick suggestions:</p>
                    <div className="space-y-1">
                      {autoSuggestions.slice(0, 3).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left justify-start text-xs h-auto p-2"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {message.isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div className={`max-w-[80%] space-y-1`}>
                      <div className={`p-3 rounded-lg ${
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      </div>
                      
                      {/* Confidence indicator for AI messages */}
                      {!message.isUser && message.confidence && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className={`w-2 h-2 rounded-full ${
                            message.confidence > 0.8 ? 'bg-green-500' :
                            message.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                        </div>
                      )}
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="space-y-1">
                          {message.suggestions.slice(0, 2).map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs h-auto p-2"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about OKRs, objectives, or planning..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                size="sm"
                className="px-3"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}