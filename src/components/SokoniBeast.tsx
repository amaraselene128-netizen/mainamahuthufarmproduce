// src/components/SokoniBeast.tsx
import { useEffect, useState } from 'react';
import { SokoniBeast } from '@/lib/sokoni-beast/core/beastEngine';

export function SokoniBeastWidget() {
  const [beast, setBeast] = useState<SokoniBeast | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    const initBeast = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const beastInstance = new SokoniBeast();
      await beastInstance.initialize(user?.id || 'anonymous');
      setBeast(beastInstance);
    };
    initBeast();
  }, []);
  
  const handleSend = async (text: string) => {
    if (!beast) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    const response = await beast.process(text);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };
  
  const toggleVoice = () => {
    if (!beast) return;
    
    if (isListening) {
      beast.voice.stopListening();
      setIsListening(false);
    } else {
      beast.voice.startListening(
        (text) => {
          setInput(text);
          handleSend(text);
        },
        (err) => console.error(err)
      );
      setIsListening(true);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition"
        >
          🦁 Sokoni Beast
        </button>
      )}
      
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
          {/* Header */}
          <div className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between">
            <span className="font-bold">🦁 Sokoni Beast - Your Marketplace Predator</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask me anything..."
              className="flex-1 border rounded-lg p-2"
            />
            <button
              onClick={() => handleSend(input)}
              className="bg-green-600 text-white px-4 rounded-lg"
            >
              Send
            </button>
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg ${isListening ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              🎤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}