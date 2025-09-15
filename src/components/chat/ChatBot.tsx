import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send } from "lucide-react";
// Using placeholder for logo since upload failed
const salamLogo = "/lovable-uploads/2d567e40-963a-4be7-aacd-f6669ccd6bdf.png";

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage = { text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = { 
        text: "Thank you for your message! I'm here to help you with any questions about your OKRs, objectives, or the platform.", 
        isUser: false 
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
    
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
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
        <Card className="fixed bottom-24 right-6 w-80 h-96 z-50 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-2">
              <img 
                src={salamLogo} 
                alt="Selam AI" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <CardTitle className="text-lg">Selam</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex flex-col h-full p-4 pt-0">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Selam, What can I help you for today?
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg max-w-[80%] ${
                      message.isUser
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted mr-auto"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                size="sm"
                className="px-3"
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