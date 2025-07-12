import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  player_id: string;
  player_name: string;
  player_color: string;
}

interface GameChatProps {
  gameId: string;
  currentPlayerId: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const GameChat: React.FC<GameChatProps> = ({ 
  gameId, 
  currentPlayerId, 
  isCollapsed = false, 
  onToggle 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
    
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `game_id=eq.${gameId}`
        },
        async (payload) => {
          // Fetch the complete message with player info
          const { data, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              message,
              created_at,
              player_id,
              game_players!inner(
                player_name,
                color
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            const newMessage = {
              id: data.id,
              message: data.message,
              created_at: data.created_at,
              player_id: data.player_id,
              player_name: (data.game_players as any).player_name,
              player_color: (data.game_players as any).color,
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          message,
          created_at,
          player_id,
          game_players!inner(
            player_name,
            color
          )
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        player_id: msg.player_id,
        player_name: (msg.game_players as any).player_name,
        player_color: (msg.game_players as any).color,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          player_id: currentPlayerId,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isCollapsed) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-10"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="w-80 h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Game Chat</CardTitle>
          {onToggle && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 space-y-3">
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span 
                    className="font-medium text-xs"
                    style={{ color: msg.player_color }}
                  >
                    {msg.player_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div className="text-foreground break-words">
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 text-sm"
            maxLength={500}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="h-3 w-3" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};