import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send } from 'lucide-react';

const mockMessages = [
  {
    id: 1,
    user: { name: 'Alice', avatar: 'https://github.com/shadcn.png' },
    text: 'Hey everyone! Just finished the latest chapter of "The Beginning After The End". It was amazing!',
    timestamp: '10:30 AM',
  },
  {
    id: 2,
    user: { name: 'Bob', avatar: 'https://github.com/shadcn.png' },
    text: 'Oh nice! I was just about to start it. No spoilers please! 😄',
    timestamp: '10:31 AM',
  },
  {
    id: 3,
    user: { name: 'You', avatar: 'https://github.com/shadcn.png' },
    text: 'Haha, will do. Let us know what you think when you are done!',
    timestamp: '10:32 AM',
  },
  {
    id: 4,
    user: { name: 'Charlie', avatar: 'https://github.com/shadcn.png' },
    text: 'I am a bit behind, still on last week\'s chapter. The art is incredible though.',
    timestamp: '10:35 AM',
  },
    {
    id: 5,
    user: { name: 'Alice', avatar: 'https://github.com/shadcn.png' },
    text: 'It only gets better!',
    timestamp: '10:36 AM',
  },
];

const GroupChatPage: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b">
            <h1 className="text-xl font-bold">Awesome Readers Club</h1>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.user.name === 'You' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={msg.user.avatar} alt={msg.user.name} />
                  <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                    msg.user.name === 'You'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">{msg.user.name}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-right mt-1 opacity-75">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <footer className="p-4 border-t">
          <div className="relative">
            <Input
              placeholder="Type your message..."
              className="pr-24"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
               <Button variant="default" className="mr-2">
                <Send className="h-5 w-5" />
                 <span className="ml-2 hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default GroupChatPage;
