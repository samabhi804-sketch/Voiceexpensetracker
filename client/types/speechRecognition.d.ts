// Web Speech API type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'start', listener: (event: Event) => void): void;
  addEventListener(type: 'end', listener: (event: Event) => void): void;
  addEventListener(type: 'nomatch', listener: (event: Event) => void): void;
  addEventListener(type: 'speechstart', listener: (event: Event) => void): void;
  addEventListener(type: 'speechend', listener: (event: Event) => void): void;
  addEventListener(type: 'soundstart', listener: (event: Event) => void): void;
  addEventListener(type: 'soundend', listener: (event: Event) => void): void;
  addEventListener(type: 'audiostart', listener: (event: Event) => void): void;
  addEventListener(type: 'audioend', listener: (event: Event) => void): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onnomatch: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onsoundstart: ((event: Event) => void) | null;
  onsoundend: ((event: Event) => void) | null;
  onaudiostart: ((event: Event) => void) | null;
  onaudioend: ((event: Event) => void) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare var SpeechRecognition: SpeechRecognitionStatic;
declare var webkitSpeechRecognition: SpeechRecognitionStatic;

interface Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}