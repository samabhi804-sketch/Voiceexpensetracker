import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { parseVoiceInput } from "@/lib/voiceService";
import { categorizeExpense } from "@/lib/categoryService";
import ExpenseForm from "./expense-form";

interface VoiceInputProps {
  onExpenseAdd: (expenseData: any) => void;
  isLoading: boolean;
}

interface ParsedExpense {
  amount: number;
  description: string;
  category: string;
  date: Date;
}

export default function VoiceInput({ onExpenseAdd, isLoading }: VoiceInputProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setTranscript("");
          setParsedExpense(null);
        };

        recognitionRef.current.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          setIsRecording(false);
          setIsProcessing(true);
          
          // Process the voice input
          processVoiceInput(result);
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsRecording(false);
          setIsProcessing(false);
          
          let errorMessage = "Speech recognition failed. Please try again.";
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = "No speech detected. Please try speaking again.";
              break;
            case 'audio-capture':
              errorMessage = "Microphone access denied. Please check your permissions.";
              break;
            case 'not-allowed':
              errorMessage = "Microphone access is required for voice input.";
              break;
          }
          
          toast({
            title: "Voice Input Error",
            description: errorMessage,
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const processVoiceInput = async (text: string) => {
    try {
      const parsed = parseVoiceInput(text);
      
      if (!parsed) {
        setIsProcessing(false);
        toast({
          title: "Could not parse input",
          description: "I couldn't understand the expense details. Please try speaking more clearly or use manual entry.",
          variant: "destructive",
        });
        return;
      }

      // Auto-categorize the expense
      const category = categorizeExpense(parsed.description);
      
      const expenseData: ParsedExpense = {
        amount: parsed.amount,
        description: parsed.description,
        category,
        date: parsed.date || new Date(),
      };

      setParsedExpense(expenseData);
      setIsProcessing(false);
      
      toast({
        title: "Voice input processed!",
        description: "Please confirm the expense details below.",
      });
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Please use manual entry.",
        variant: "destructive",
      });
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const confirmExpense = () => {
    if (parsedExpense) {
      onExpenseAdd({
        amount: parsedExpense.amount.toString(),
        description: parsedExpense.description,
        category: parsedExpense.category,
        date: parsedExpense.date.toISOString(),
      });
      setParsedExpense(null);
      setTranscript("");
    }
  };

  const getStatusText = () => {
    if (isRecording) return "Listening... Speak now";
    if (isProcessing) return "Processing your input...";
    if (parsedExpense) return "Expense detected! Please confirm details";
    return "Tap to start recording";
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2" data-testid="text-voice-title">Add Expense with Voice</h2>
          <p className="text-secondary mb-6">Say something like "Spent 25 dollars on coffee this morning"</p>
          
          {/* Voice Recording Interface */}
          <div className="flex flex-col items-center space-y-6">
            <Button
              onClick={toggleRecording}
              disabled={isProcessing || isLoading}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' 
                  : 'bg-primary hover:bg-emerald-600 active:bg-emerald-700'
              }`}
              data-testid="button-voice-record"
            >
              <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-white text-2xl`}></i>
            </Button>
            
            {/* Voice Waveform Visualization */}
            {isRecording && (
              <div className="w-64 h-12 bg-gray-50 rounded-lg flex items-center justify-center" data-testid="voice-waveform">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 15}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status Text */}
            <p className="text-sm text-secondary" data-testid="text-voice-status">
              {getStatusText()}
            </p>

            {/* Transcript Display */}
            {transcript && (
              <div className="w-full max-w-md p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-secondary mb-1">You said:</p>
                <p className="font-medium" data-testid="text-voice-transcript">"{transcript}"</p>
              </div>
            )}
          </div>

          {/* Parsed Voice Input Preview */}
          {parsedExpense && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg" data-testid="voice-expense-preview">
              <h3 className="font-medium mb-3">Detected Expense:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-secondary">Amount:</span>
                  <p className="font-medium" data-testid="text-detected-amount">
                    ${parsedExpense.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-secondary">Category:</span>
                  <p className="font-medium" data-testid="text-detected-category">
                    {parsedExpense.category}
                  </p>
                </div>
                <div>
                  <span className="text-secondary">Description:</span>
                  <p className="font-medium" data-testid="text-detected-description">
                    {parsedExpense.description}
                  </p>
                </div>
                <div>
                  <span className="text-secondary">Date:</span>
                  <p className="font-medium" data-testid="text-detected-date">
                    {parsedExpense.date.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <Button 
                  onClick={confirmExpense}
                  disabled={isLoading}
                  className="bg-primary hover:bg-emerald-600 text-white"
                  data-testid="button-confirm-expense"
                >
                  <i className="fas fa-check mr-2"></i>
                  {isLoading ? 'Saving...' : 'Confirm & Save'}
                </Button>
                <Button 
                  onClick={() => {
                    setParsedExpense(null);
                    setShowManualForm(true);
                  }}
                  variant="outline"
                  data-testid="button-edit-expense"
                >
                  <i className="fas fa-edit mr-2"></i>Edit Details
                </Button>
              </div>
            </div>
          )}

          {/* Manual Entry Button */}
          <div className="mt-6">
            <Button 
              onClick={() => setShowManualForm(true)}
              variant="outline"
              className="border-dashed border-2"
              data-testid="button-manual-entry"
            >
              <i className="fas fa-keyboard mr-2"></i>
              Use Manual Entry Instead
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Manual Expense Form */}
      {showManualForm && (
        <ExpenseForm 
          onClose={() => setShowManualForm(false)}
          onSuccess={() => setShowManualForm(false)}
          initialData={parsedExpense ? {
            amount: parsedExpense.amount.toString(),
            category: parsedExpense.category,
            description: parsedExpense.description,
            date: parsedExpense.date.toISOString().split('T')[0],
          } : undefined}
        />
      )}
    </Card>
  );
}
