// src/lib/sokoni-beast/fangs/voiceFang.ts
// Speaks like a Kenyan, understands Sheng

export class voiceFang {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
    }
  }
  
  async speak(text: string, options?: { urgency?: 'low' | 'high'; natural?: boolean }): Promise<void> {
    if (!this.synthesis) return;
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(this.naturalize(text));
    
    // Find Kenyan English voice
    const voices = this.synthesis.getVoices();
    const kenyanVoice = voices.find(v => 
      v.lang.includes('en') && 
      (v.name.includes('Kenya') || v.name.includes('Africa') || v.name.includes('Google UK'))
    );
    
    if (kenyanVoice) utterance.voice = kenyanVoice;
    utterance.rate = options?.urgency === 'high' ? 1.1 : 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    this.synthesis.speak(utterance);
  }
  
  naturalize(text: string): string {
    // Add Kenyan flavor to responses
    const replacements: [RegExp, string][] = [
      [/\bhello\b/i, 'Jambo'],
      [/\bthank you\b/i, 'Asante'],
      [/\bgoodbye\b/i, 'Kwaheri'],
      [/\bsearching for\b/i, 'Natafuta'],
      [/\bfound\b/i, 'Nimepata'],
      [/\bprice\b/i, 'bei'],
      [/\bshop\b/i, 'duka'],
      [/\bproduct\b/i, 'bidhaa'],
      [/\b(?:you are|you're) welcome\b/i, 'Karibu'],
      [/\bplease\b/i, 'tafadhali'],
    ];
    
    let naturalized = text;
    for (const [pattern, replacement] of replacements) {
      naturalized = naturalized.replace(pattern, replacement);
    }
    
    // Add enthusiasm
    if (naturalized.includes('?')) {
      naturalized = naturalized.replace(/\?/g, '? ... ');
    }
    
    return naturalized;
  }
  
  async startListening(onResult: (text: string) => void, onError?: (err: string) => void): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError?.('Voice not supported in this browser');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-KE'; // Kenyan English
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        onResult(this.cleanKenyanInput(finalTranscript));
      }
    };
    
    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        onError?.(event.error);
      }
    };
    
    this.recognition.start();
    this.isListening = true;
  }
  
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  private cleanKenyanInput(text: string): string {
    // Handle Kenyan/Sheng slang
    const translations: Record<string, string> = {
      'niko na budget ya': 'I have budget of',
      'niko na': 'I have',
      'nipe': 'give me',
      'tafuta': 'search',
      'bei gani': 'what price',
      'iko wapi': 'where is it',
      'sawa': 'okay',
      'poa': 'cool',
      'sijui': 'I don\'t know',
      'kitu': 'item',
      'vitu': 'items',
      'bidhaa': 'product',
      'duka': 'shop',
      'fundi': 'expert',
      'boda': 'motorcycle',
      'matatu': 'public transport',
      'kSh': 'KES'
    };
    
    let cleaned = text.toLowerCase();
    for (const [slang, english] of Object.entries(translations)) {
      cleaned = cleaned.replace(new RegExp(`\\b${slang}\\b`, 'gi'), english);
    }
    
    return cleaned;
  }
  
  naturalResponse(message: string): string {
    const starters = [
      'Sawa!', 'Poa!', 'Jambo!', 'Habari!', 'Sema!',
      'Alright!', 'Got it!', 'On it!', 'Sure thing!'
    ];
    
    const randomStarter = starters[Math.floor(Math.random() * starters.length)];
    return `${randomStarter} ${message}`;
  }
}