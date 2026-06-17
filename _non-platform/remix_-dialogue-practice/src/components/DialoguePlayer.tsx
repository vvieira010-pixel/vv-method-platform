import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2,
  User, Mic, ChevronRight, HelpCircle, Eye, EyeOff, Radio,
  BookOpen, Smile, Info, MessageSquare, Check
} from 'lucide-react';
import { DialogueLine, RoleMode } from '../types';

// Helper to generate educational distractors for the interactive dialogue roleplay
const makeInformalAndClunky = (text: string): { casual: string; clunky: string } => {
  let casual = text;
  
  // High-fidelity replacements for casual conversational styling
  casual = casual.replace(/Good evening/gi, "Hey, what's up");
  casual = casual.replace(/Good afternoon/gi, "Hey");
  casual = casual.replace(/Good morning/gi, "Yo, morning");
  casual = casual.replace(/How can I help you\?/gi, "What do you need today?");
  casual = casual.replace(/I have a reservation under/gi, "I got a bed booked for");
  casual = casual.replace(/I have a reservation/gi, "I got a booking");
  casual = casual.replace(/Let me check/gi, "Hold on, let me look at the screen");
  casual = casual.replace(/That's right/gi, "Yeah, exactly");
  casual = casual.replace(/I also requested a quiet room/gi, "I kinda want some quiet space");
  casual = casual.replace(/because I have an online meeting/gi, "cos I got a meeting online");
  casual = casual.replace(/We can give you a room/gi, "We got an empty room");
  casual = casual.replace(/away from the elevator/gi, "not near the elevator thing");
  casual = casual.replace(/That would be perfect/gi, "That would be awesome");
  casual = casual.replace(/Is breakfast included\?/gi, "Do I get free food in the morning?");
  casual = casual.replace(/breakfast is served from/gi, "you get breakfast stuff from");
  casual = casual.replace(/if you want to exercise/gi, "if you wanna work out");
  casual = casual.replace(/Great. I'll probably/gi, "Sweet. I might");
  casual = casual.replace(/Here is your key card/gi, "Here you go, take this card");
  casual = casual.replace(/Enjoy your stay/gi, "Have a good time");
  
  // Fallback modifications if no rules match
  if (casual === text) {
    casual = "Yeah, " + text.charAt(0).toLowerCase() + text.slice(1);
    casual = casual.replace(/\./g, " actually.");
    casual = casual.replace(/Please/g, "Yeah");
    casual = casual.replace(/Thank you/g, "Thanks");
  }

  let clunky = text;
  // Subject verb agreement, missing particles, and literal translations
  clunky = clunky.replace(/I have/gi, "I has");
  clunky = clunky.replace(/Let me/gi, "Please to let me");
  clunky = clunky.replace(/one single room/gi, "a single rooms");
  clunky = clunky.replace(/I also requested/gi, "I also make request of");
  clunky = clunky.replace(/We can give/gi, "We is able giving");
  clunky = clunky.replace(/That would be/gi, "That is being");
  clunky = clunky.replace(/Is breakfast included\?/gi, "Breakfast included is?");
  clunky = clunky.replace(/breakfast is served/gi, "breakfast serves");
  clunky = clunky.replace(/if you want to/gi, "if wanting for to");
  clunky = clunky.replace(/I'll probably/gi, "Maybe I will making use of");
  clunky = clunky.replace(/Here is your/gi, "Here is being your");
  clunky = clunky.replace(/Enjoy your/gi, "Enjoying the");

  if (clunky === text) {
    // Basic structural scramble
    clunky = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "") + " yes?";
  }

  return { casual, clunky };
};

interface DialoguePlayerProps {
  roleMode: RoleMode;
  setRoleMode: (mode: RoleMode) => void;
  onSelectWord: (word: { word: string; definition: string; context: string } | null) => void;
  script: DialogueLine[];
}

export default function DialoguePlayer({ roleMode, setRoleMode, onSelectWord, script }: DialoguePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedInterviewerVoice, setSelectedInterviewerVoice] = useState<string>('');
  const [selectedGuestVoice, setSelectedGuestVoice] = useState<string>('');
  const [revealedLines, setRevealedLines] = useState<Record<number, boolean>>({});
  const [isAudioSupported, setIsAudioSupported] = useState(true);

  // Dynamic Dialogue Roleplay states
  const [roleplayTarget, setRoleplayTarget] = useState<'A' | 'B'>('B');
  const [roleplayChoices, setRoleplayChoices] = useState<{ text: string; type: 'correct' | 'casual' | 'clunky'; explanation: string }[]>([]);
  const [selectedRoleplayChoice, setSelectedRoleplayChoice] = useState<number | null>(null);
  const [roleplaySubmitted, setRoleplaySubmitted] = useState(false);
  const [roleplayFeedback, setRoleplayFeedback] = useState<string | null>(null);

  // Speech Recognition & Interactive Dialogue Practice States
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechMetrics, setSpeechMetrics] = useState<{
    accuracy: number;
    wpm: number;
    pacingFeedback: string;
    wordStatuses: { word: string; original: string; status: 'perfect' | 'almost' | 'missed' }[];
  } | null>(null);
  const [lineScores, setLineScores] = useState<Record<number, { accuracy: number; wpm: number }>>({});

  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto pick a default character to practice when script loads
  useEffect(() => {
    if (script && script.length > 0) {
      const distinct = Array.from(new Set(script.map(line => line.speaker)));
      if (distinct.length > 1) {
        setSelectedCharacter(distinct[1]); // usually Guest/Speaker B
      } else if (distinct.length > 0) {
        setSelectedCharacter(distinct[0]);
      }
    }
  }, [script]);

  // Clean up recording instance on unmount
  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {}
      }
    };
  }, [recognitionInstance]);

  // Load synthesizing voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsAudioSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices for best experience
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      const listToUse = englishVoices.length > 0 ? englishVoices : allVoices;
      setVoices(listToUse);

      // Default interviewer and guest voice picks
      if (listToUse.length > 0) {
        // Try to pick distinct English voices
        const male = listToUse.find(v => v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('microsoft david') || v.name.toLowerCase().includes('male'));
        const female = listToUse.find(v => v.name.toLowerCase().includes('google uk female') || v.name.toLowerCase().includes('microsoft zira') || v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('hazel'));
        
        setSelectedInterviewerVoice(male ? male.name : listToUse[0].name);
        setSelectedGuestVoice(female ? female.name : (listToUse[1] ? listToUse[1].name : listToUse[0].name));
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Handle auto scrolling to currently active speech item
  useEffect(() => {
    if (currentLineIndex !== null && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentLineIndex]);

  // Handle play progression mechanics
  useEffect(() => {
    if (!isPlaying || currentLineIndex === null) return;

    const line = script[currentLineIndex];
    if (!line) {
      setIsPlaying(false);
      setCurrentLineIndex(null);
      return;
    }

    // Determine the speakers of the raw script structure
    const isPrimarySpeaker = line.speaker === 'Interviewer' || line.speaker === 'Host' || line.speaker === 'Agent' || line.speaker === 'Tourist' || line.speaker === 'A' || line.speaker === 'Organizer' || line.speaker === 'Announcer';
    const isSecondarySpeaker = !isPrimarySpeaker;

    if (roleMode === 'roleplay') {
      const isPlayerTurn = (roleplayTarget === 'A' && isPrimarySpeaker) || (roleplayTarget === 'B' && isSecondarySpeaker);
      if (isPlayerTurn) {
        // Stop automatic progress of synthesizer on player's turn until they click!
        setIsPlaying(false);
        return;
      }
    }

    if (roleMode === 'interactive_dialogue') {
      const isPlayerTurn = line.speaker === selectedCharacter;
      if (isPlayerTurn) {
        // Pause and prepare for speech recording!
        setIsPlaying(false);
        return;
      }
    }

    // If roleMode hides this speaker, we give user a chance to read in practice mode.
    // However, in normal playback or if explicit play, we continue.
    const isLineHidden = 
      (roleMode === 'interviewer' && isPrimarySpeaker && !revealedLines[line.id]) ||
      (roleMode === 'guest' && isSecondarySpeaker && !revealedLines[line.id]);

    if (isLineHidden) {
      // In practice mode, pause auto-playback when a hidden item is reached, 
      // giving the student absolute agency to speak. They can read and then trigger NEXT.
      setIsPlaying(false);
      return;
    }

    // Play synthesis
    const sSynth = window.speechSynthesis;
    sSynth.cancel(); // Stop anything current

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.rate = playbackRate;

    // Resolve voice
    const chosenVoiceName = isPrimarySpeaker ? selectedInterviewerVoice : selectedGuestVoice;
    const voiceObj = voices.find(v => v.name === chosenVoiceName);
    if (voiceObj) {
      utterance.voice = voiceObj;
    }

    utterance.onend = () => {
      // Advance to next line unless it's the final line
      if (currentLineIndex < script.length - 1) {
        setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
      } else {
        setIsPlaying(false);
        setCurrentLineIndex(null); // Sequence finished
      }
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      // Fallback transition
      const timer = setTimeout(() => {
        if (currentLineIndex < script.length - 1) {
          setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
        } else {
          setIsPlaying(false);
          setCurrentLineIndex(null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    };

    sSynth.speak(utterance);

    return () => {
      sSynth.cancel();
    };
  }, [isPlaying, currentLineIndex, playbackRate, selectedInterviewerVoice, selectedGuestVoice, roleMode, revealedLines, voices, script, roleplayTarget, selectedCharacter]);

  // Trigger choices setup and NPC speech in roleplay mode
  useEffect(() => {
    if (roleMode !== 'roleplay' || currentLineIndex === null) {
      setRoleplayChoices([]);
      setSelectedRoleplayChoice(null);
      setRoleplaySubmitted(false);
      setRoleplayFeedback(null);
      return;
    }

    const line = script[currentLineIndex];
    if (!line) return;

    const isPrimary = line.speaker === 'Interviewer' || line.speaker === 'Host' || line.speaker === 'Agent' || line.speaker === 'Tourist' || line.speaker === 'A' || line.speaker === 'Organizer' || line.speaker === 'Announcer';
    const isPlayerTurn = (roleplayTarget === 'A' && isPrimary) || (roleplayTarget === 'B' && !isPrimary);

    if (isPlayerTurn) {
      const { casual, clunky } = makeInformalAndClunky(line.text);
      const rawChoices = [
        {
          text: line.text,
          type: 'correct' as const,
          explanation: "Perfect! This matches the correct upgraded register with highly natural grammatical conventions."
        },
        {
          text: casual,
          type: 'casual' as const,
          explanation: "This is a bit too colloquial or slangy for this speaking context. Choose the more standard CEFR alternative to sound professional."
        },
        {
          text: clunky,
          type: 'clunky' as const,
          explanation: "This option contains a slight grammatical error or has unnatural syntax structure (such as incorrect tense or helper verb)."
        }
      ];

      // Scramble choices deterministically based on character count/sum
      const scrambled = [...rawChoices].sort((a,b) => {
        const sum = line.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return ((sum + a.text.length) % 3) - 1.5;
      });

      setRoleplayChoices(scrambled);
      setSelectedRoleplayChoice(null);
      setRoleplaySubmitted(false);
      setRoleplayFeedback(null);
    } else {
      setRoleplayChoices([]);
      setSelectedRoleplayChoice(null);
      setRoleplaySubmitted(false);
      setRoleplayFeedback(null);

      // Speak NPC line automatically if in active play session
      if (isPlaying) {
        const timer = setTimeout(() => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(line.text);
            utterance.rate = playbackRate;
            
            const chosenVoiceName = isPrimary ? selectedInterviewerVoice : selectedGuestVoice;
            const voiceObj = voices.find(v => v.name === chosenVoiceName);
            if (voiceObj) {
              utterance.voice = voiceObj;
            }

            utterance.onend = () => {
              // Move to the player's turn next automatically
              if (currentLineIndex < script.length - 1) {
                // Ensure we stay in roleplay mode and move index
                setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
              } else {
                setIsPlaying(false);
                setCurrentLineIndex(null);
              }
            };

            utterance.onerror = () => {
              if (currentLineIndex < script.length - 1) {
                setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
              } else {
                setIsPlaying(false);
                setCurrentLineIndex(null);
              }
            };

            window.speechSynthesis.speak(utterance);
          }
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [roleMode, currentLineIndex, roleplayTarget, script, isPlaying, playbackRate, selectedInterviewerVoice, selectedGuestVoice, voices]);

  // Handle validating conversational candidate choice
  const handleRoleplaySubmit = () => {
    if (selectedRoleplayChoice === null || currentLineIndex === null) return;

    const choice = roleplayChoices[selectedRoleplayChoice];
    setRoleplaySubmitted(true);
    setRoleplayFeedback(choice.explanation);

    if (choice.type === 'correct') {
      // It is correct, speak it out loud!
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(choice.text);
        utterance.rate = playbackRate;
        
        const line = script[currentLineIndex];
        const isPrimary = line.speaker === 'Interviewer' || line.speaker === 'Host' || line.speaker === 'Agent' || line.speaker === 'Tourist' || line.speaker === 'A' || line.speaker === 'Organizer' || line.speaker === 'Announcer';
        const chosenVoiceName = isPrimary ? selectedInterviewerVoice : selectedGuestVoice;
        const voiceObj = voices.find(v => v.name === chosenVoiceName);
        if (voiceObj) {
          utterance.voice = voiceObj;
        }

        utterance.onend = () => {
          setTimeout(() => {
            if (currentLineIndex < script.length - 1) {
              setIsPlaying(true);
              setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
            } else {
              setIsPlaying(false);
              setCurrentLineIndex(null);
            }
          }, 1500);
        };

        utterance.onerror = () => {
          setTimeout(() => {
            if (currentLineIndex < script.length - 1) {
              setIsPlaying(true);
              setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
            } else {
              setIsPlaying(false);
              setCurrentLineIndex(null);
            }
          }, 1500);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback without speech synth
        setTimeout(() => {
          if (currentLineIndex < script.length - 1) {
            setIsPlaying(true);
            setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
          } else {
            setIsPlaying(false);
            setCurrentLineIndex(null);
          }
        }, 2000);
      }
    }
  };

  // Trigger automatic partner speaker synthesis in Interactive Dialogue Practice Mode
  useEffect(() => {
    if (roleMode !== 'interactive_dialogue' || currentLineIndex === null) {
      return;
    }

    const line = script[currentLineIndex];
    if (!line) return;

    const isPlayerTurn = line.speaker === selectedCharacter;

    if (isPlayerTurn) {
      // It's user's turn! Cancel any active synthesis so they can talk
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      // NPC / interlocutor turn
      if (isPlaying) {
        const timer = setTimeout(() => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(line.text);
            utterance.rate = playbackRate;

            const isPrimary = line.speaker === 'Interviewer' || line.speaker === 'Host' || line.speaker === 'Agent' || line.speaker === 'Tourist' || line.speaker === 'A' || line.speaker === 'Organizer' || line.speaker === 'Announcer';
            const chosenVoiceName = isPrimary ? selectedInterviewerVoice : selectedGuestVoice;
            const voiceObj = voices.find(v => v.name === chosenVoiceName);
            if (voiceObj) {
              utterance.voice = voiceObj;
            }

            utterance.onend = () => {
              if (currentLineIndex < script.length - 1) {
                // Advance automatically
                setIsPlaying(true);
                setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
              } else {
                setIsPlaying(false);
                setCurrentLineIndex(null);
              }
            };

            utterance.onerror = () => {
              if (currentLineIndex < script.length - 1) {
                setIsPlaying(true);
                setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
              } else {
                setIsPlaying(false);
                setCurrentLineIndex(null);
              }
            };

            window.speechSynthesis.speak(utterance);
          }
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [roleMode, currentLineIndex, selectedCharacter, script, isPlaying, playbackRate, selectedInterviewerVoice, selectedGuestVoice, voices]);

  // Speech Analysis & Word-by-word Alignment Metrics Engine
  const analyzeSpeech = (originalText: string, spokenText: string, durationMs: number) => {
    const normalize = (str: string) => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
    
    const origWords = originalText.split(/\s+/).filter(Boolean);
    const spokenWords = normalize(spokenText).split(/\s+/).filter(Boolean);

    let correctCount = 0;
    const wordStatuses = origWords.map(orig => {
      const origClean = normalize(orig);
      // Perfect match Check
      if (spokenWords.includes(origClean)) {
        correctCount++;
        return { word: orig, original: orig, status: 'perfect' as const };
      }
      // Fuzzy/Almost Correct Match Check
      const partialMatch = spokenWords.some(sp => sp.includes(origClean) || origClean.includes(sp));
      if (partialMatch && origClean.length > 2) {
        correctCount += 0.7;
        return { word: orig, original: orig, status: 'almost' as const };
      }
      return { word: orig, original: orig, status: 'missed' as const };
    });

    const accuracy = Math.round((correctCount / origWords.length) * 100);

    // Speed / Pacing Tempo Match (WPM calculator)
    const durationSec = durationMs / 1000;
    const spokenWordCount = spokenWords.length > 0 ? spokenWords.length : 1;
    const wpm = durationSec > 0.5 ? Math.round((spokenWordCount / durationSec) * 60) : 120;

    let pacingFeedback = "Optimal speech pacing!";
    if (wpm < 95) {
      pacingFeedback = "Pacing slightly slow. Aim for a steadier, more natural speaking flow.";
    } else if (wpm > 155) {
      pacingFeedback = "Speaking rate is very fast. Try pausing at natural punctuation transitions.";
    }

    return {
      accuracy: Math.min(100, Math.max(0, accuracy)),
      wpm,
      pacingFeedback,
      wordStatuses
    };
  };

  // Speaks individual words on student click to teach exact pronunciation
  const pronounceWord = (word: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.rate = 0.7; // slower for clear learner comprehension
      
      const line = script[currentLineIndex ?? 0];
      const isPrimary = line?.speaker === 'Interviewer' || line?.speaker === 'Host' || line?.speaker === 'Agent' || line?.speaker === 'Tourist' || line?.speaker === 'A';
      const chosenVoiceName = isPrimary ? selectedInterviewerVoice : selectedGuestVoice;
      const voiceObj = voices.find(v => v.name === chosenVoiceName);
      if (voiceObj) {
        utterance.voice = voiceObj;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech Recognition API controllers
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not fully supported in this browser. Running simulator fallback.");
      simulateRecording();
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        setSpokenTranscript('');
        setSpeechError(null);
        setSpeechMetrics(null);
        setRecordingStartTime(Date.now());

        // Increment duration timer seconds format
        const timer = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
        (rec as any)._timerInterval = timer;
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenTranscript(transcript);

        const duration = Date.now() - (recordingStartTime || Date.now());
        const originalText = script[currentLineIndex ?? 0]?.text || '';
        const metrics = analyzeSpeech(originalText, transcript, duration);
        setSpeechMetrics(metrics);

        if (currentLineIndex !== null) {
          setLineScores(prev => ({
            ...prev,
            [currentLineIndex]: { accuracy: metrics.accuracy, wpm: metrics.wpm }
          }));
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Error:", e.error);
        if (e.error === 'not-allowed') {
          setSpeechError("Microphone blocked. Open browser permissions or try our simulated interactive trainer.");
        } else {
          setSpeechError(`Speech error: ${e.error}. Try clicking again.`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        if ((rec as any)._timerInterval) {
          clearInterval((rec as any)._timerInterval);
        }
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err) {
      console.error("Speech Engine Error:", err);
      setSpeechError("Failed to start voice listener. Falling back to educational simulator.");
      simulateRecording();
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  // High-fidelity Speech Simulation Fallback Model (if mic blocked inside iframe sandbox)
  const simulateRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setSpokenTranscript('');
    setSpeechError(null);
    setSpeechMetrics(null);
    const startTime = Date.now();
    setRecordingStartTime(startTime);

    const timer = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      setIsRecording(false);
      const originalText = script[currentLineIndex ?? 0]?.text || '';
      
      // Introduce minor deviations (like dropped filler words) to demonstrate natural phonetic analysis!
      const words = originalText.split(/\s+/);
      let simulated = originalText;
      if (words.length > 5) {
        simulated = words.map((w, idx) => {
          if (idx === Math.floor(words.length / 2)) return ""; // skip word
          if (w.toLowerCase() === "have") return "has"; // grammar mismatch
          return w;
        }).join(" ");
      }

      setSpokenTranscript(simulated);
      const metrics = analyzeSpeech(originalText, simulated, 3505);
      setSpeechMetrics(metrics);

      if (currentLineIndex !== null) {
        setLineScores(prev => ({
          ...prev,
          [currentLineIndex]: { accuracy: metrics.accuracy, wpm: metrics.wpm }
        }));
      }
    }, 4000);
  };

  // Controller functions
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentLineIndex === null || currentLineIndex >= script.length) {
        setCurrentLineIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleStopReset = () => {
    window.speechSynthesis?.cancel();
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setIsPlaying(false);
    setCurrentLineIndex(null);
    setRevealedLines({});
    setSpokenTranscript('');
    setSpeechMetrics(null);
    setSpeechError(null);
  };

  const speakSpecificLine = (index: number) => {
    setIsPlaying(false); // Stop standard queue
    setCurrentLineIndex(index);
    // Let the effect execute the actual reading by setting isPlaying to true
    setTimeout(() => {
      setIsPlaying(true);
    }, 50);
  };

  const toggleRevealLine = (id: number) => {
    setRevealedLines(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTextWithHighlights = (line: DialogueLine) => {
    const text = line.text;
    const highlights = line.highlightWords;

    if (!highlights || highlights.length === 0) {
      return <span>{text}</span>;
    }

    // Sort keyphrases by length descending to match larger blocks first
    const sortedHighlights = [...highlights].sort((a, b) => b.word.length - a.word.length);

    // Simplistic premium replacement for matching keywords inside dialogue
    const processPhrase = (remainingText: string, startIndex: number): React.ReactNode => {
      // Find which highlight match occurs first in remainingText
      let earliestMatch: { word: string; definition: string; context: string; index: number } | null = null;

      for (const hl of sortedHighlights) {
        const foundIndex = remainingText.toLowerCase().indexOf(hl.word.toLowerCase());
        if (foundIndex !== -1) {
          if (!earliestMatch || foundIndex < earliestMatch.index) {
            earliestMatch = { ...hl, index: foundIndex };
          }
        }
      }

      if (!earliestMatch) {
        return <span key={startIndex}>{remainingText}</span>;
      }

      const matchStart = earliestMatch.index;
      const matchEnd = matchStart + earliestMatch.word.length;
      const before = remainingText.slice(0, matchStart);
      const matchedStr = remainingText.slice(matchStart, matchEnd);
      const after = remainingText.slice(matchEnd);

      const currentHighlight = earliestMatch; // save ref

      return (
        <span key={startIndex}>
          {before}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectWord({
                word: currentHighlight.word,
                definition: currentHighlight.definition,
                context: currentHighlight.context
              });
            }}
            id={`hl-trigger-${line.id}-${startIndex}`}
            className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border-b-2 border-dashed border-emerald-400 hover:bg-emerald-100 hover:text-emerald-950 font-medium transition-all text-sm md:text-base pointer-events-auto cursor-pointer"
            title="Click for definition"
          >
            {matchedStr}
          </button>
          {processPhrase(after, startIndex + matchEnd)}
        </span>
      );
    };

    return processPhrase(text, 0);
  };

  return (
    <div id="dialogue-player-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full justify-between">
      
      {/* Dialogue Player Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-full text-slate-600 border border-slate-200/50">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 tracking-tight text-base">Audio Sandbox</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Interactive Dialogue Practice</p>
            </div>
          </div>

          {/* Voice Setting Dashboard */}
          {isAudioSupported && (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[9px] text-slate-400 uppercase tracking-widest font-mono">Host / Speaker A</label>
                <select
                  id="voice-interviewer-select"
                  value={selectedInterviewerVoice}
                  onChange={(e) => setSelectedInterviewerVoice(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400 max-w-[130px] md:max-w-[150px] text-ellipsis cursor-pointer"
                >
                  {voices.map(v => (
                    <option key={`int-${v.name}`} value={v.name}>{v.name.replace('Microsoft', '').replace('Google', '').trim()}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[9px] text-slate-400 uppercase tracking-widest font-mono">Guest / Speaker B</label>
                <select
                  id="voice-guest-select"
                  value={selectedGuestVoice}
                  onChange={(e) => setSelectedGuestVoice(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400 max-w-[130px] md:max-w-[150px] text-ellipsis cursor-pointer"
                >
                  {voices.map(v => (
                    <option key={`gst-${v.name}`} value={v.name}>{v.name.replace('Microsoft', '').replace('Google', '').trim()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Role Toggle Dashboard */}
        <div className="bg-slate-50/50 p-1 rounded-xl border border-slate-200/80 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[10px] font-bold text-slate-400 px-2.5 font-mono uppercase tracking-widest hidden md:inline">Oral Practice</span>
          <div className="flex flex-wrap gap-1 w-full md:w-auto">
            <button
              onClick={() => { setRoleMode('all'); handleStopReset(); }}
              id="role-mode-btn-all"
              className={`grow md:grow-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                roleMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Full Transcript
            </button>
            <button
              onClick={() => { setRoleMode('interactive_dialogue'); handleStopReset(); }}
              id="role-mode-btn-interactive-dialogue"
              className={`grow md:grow-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                roleMode === 'interactive_dialogue'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Interactive voice recording speech practice"
            >
              <Mic className="w-3.5 h-3.5" /> Interactive Dialogue Practice
            </button>
            <button
              onClick={() => { setRoleMode('roleplay'); handleStopReset(); }}
              id="role-mode-btn-roleplay"
              className={`grow md:grow-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                roleMode === 'roleplay'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Interactive roleplay simulator"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Interactive Simulator
            </button>
            <button
              onClick={() => { setRoleMode('interviewer'); handleStopReset(); }}
              id="role-mode-btn-interviewer"
              className={`grow md:grow-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                roleMode === 'interviewer'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Practice speaking Speaker A part"
            >
              <Mic className="w-3.5 h-3.5" /> Speaker A
            </button>
            <button
              onClick={() => { setRoleMode('guest'); handleStopReset(); }}
              id="role-mode-btn-guest"
              className={`grow md:grow-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                roleMode === 'guest'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Practice speaking Speaker B part"
            >
              <User className="w-3.5 h-3.5" /> Speaker B
            </button>
          </div>
        </div>

        {/* Sub-explanation for selected mode */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl flex flex-col gap-2.5 mb-6 border border-slate-200/60 leading-relaxed font-sans">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            {roleMode === 'all' && (
              <span><strong>Listening Mode:</strong> Listen to the audio presentation. Select highlighted phrases for definitions and context!</span>
            )}
            {roleMode === 'interactive_dialogue' && (
              <span><strong>Interactive Speech Dialogue Practice:</strong> Select your character role, read their script lines out loud using your microphone (or simulator), and receive detailed pacing (WPM) and word-by-word pronunciation accuracy analysis. Click any word to hear how to say it!</span>
            )}
            {roleMode === 'roleplay' && (
              <span><strong>Interactive Roleplay Simulator:</strong> Answer with B2 upgraded expressions when it is your turn. Get immediate feedback, speak the proper phrasing with synthesized guides, and have your talk partner reply back!</span>
            )}
            {roleMode === 'interviewer' && (
              <span><strong>Speaker A Practice:</strong> Speaker A parts are hidden. When reached, the queue pauses. Speak the sentence, reveal the clue if needed, then click Next line.</span>
            )}
            {roleMode === 'guest' && (
              <span><strong>Speaker B Practice:</strong> Speaker B parts are hidden. Speak the response aloud, reveal clue if needed, and hit Next to continue.</span>
            )}
          </div>

          {/* Interactive Dialogue Practice Role Selector and Launcher */}
          {roleMode === 'interactive_dialogue' && currentLineIndex === null && (
            <div className="mt-2 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[9px] text-slate-400 font-mono uppercase tracking-wider">Choose Your Character Role:</span>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                  {Array.from(new Set(script.map(line => line.speaker))).map(sp => (
                    <button
                      key={`id-char-pk-${sp}`}
                      onClick={() => setSelectedCharacter(sp)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        selectedCharacter === sp ? 'bg-indigo-650 text-white bg-indigo-600' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentLineIndex(0);
                  setIsPlaying(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-750 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Start Practice <Play className="w-3 h-3 fill-white" />
              </button>
            </div>
          )}

          {/* Interactive Roleplay Role Selector and Launcher */}
          {roleMode === 'roleplay' && currentLineIndex === null && (
            <div className="mt-2 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[9px] text-slate-400 font-mono uppercase tracking-wider">Choose Your Character Role:</span>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => setRoleplayTarget('A')}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      roleplayTarget === 'A' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Speaker A (Host)
                  </button>
                  <button
                    onClick={() => setRoleplayTarget('B')}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      roleplayTarget === 'B' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Speaker B (Guest)
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentLineIndex(0);
                  setIsPlaying(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-750 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Start Simulation <Play className="w-3 h-3 fill-white" />
              </button>
            </div>
          )}
        </div>

        {/* Dialogue Scroll Stage */}
        <div id="dialogue-scroll-container" className="space-y-5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
          {script.map((line, idx) => {
            const isPrimary = line.speaker === 'Interviewer' || line.speaker === 'Host' || line.speaker === 'Agent' || line.speaker === 'Tourist' || line.speaker === 'A' || line.speaker === 'Organizer' || line.speaker === 'Announcer';
            const isActive = currentLineIndex === idx;
            
            // Check if this speaker's line should be obscured
            const isObscured = 
              (roleMode === 'interviewer' && isPrimary) || 
              (roleMode === 'guest' && !isPrimary) ||
              (roleMode === 'roleplay' && idx > (currentLineIndex ?? -1));
            
            const isRevealed = revealedLines[line.id];

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                className={`group flex items-start gap-4 transition-opacity duration-300 ${
                  isActive ? 'opacity-100' : currentLineIndex !== null ? 'opacity-45 hover:opacity-90' : 'opacity-100'
                }`}
              >
                {/* Speaker Avatar indicator */}
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-[10px] tracking-tight uppercase border transition-all ${
                  isPrimary
                    ? 'bg-slate-100 text-slate-500 border-slate-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                } relative`}>
                  {isActive && (
                    <span className={`absolute -inset-1 rounded-full animate-ping border opacity-20 ${
                      isPrimary ? 'border-slate-400' : 'border-emerald-400'
                    }`} />
                  )}
                  {isPrimary ? 'A' : 'B'}
                </div>

                {/* Bubble card */}
                <div className={`grow max-w-[85%] rounded-xl p-4 transition-all ${
                  isActive 
                    ? 'bg-slate-50 border border-slate-300 shadow-3xs'
                    : 'border border-slate-100 bg-white hover:border-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${
                      isPrimary ? 'text-slate-400' : 'text-emerald-600'
                    }`}>
                      {line.speaker}
                    </span>

                    {/* Speech buttons */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {isObscured && (
                        <button
                          onClick={() => toggleRevealLine(line.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-150 transition-colors cursor-pointer"
                          title={isRevealed ? "Hide clue" : "Reveal clue"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      
                      <button
                        onClick={() => speakSpecificLine(idx)}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                          isActive ? 'text-slate-800 bg-slate-200/30' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Pronounce this sentence"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Core script sentence text */}
                  <div className="text-slate-800 leading-relaxed text-sm md:text-base font-sans font-normal">
                    {roleMode === 'interactive_dialogue' && isActive && line.speaker === selectedCharacter ? (
                      <div className="space-y-4 mt-2">
                        {/* Word pronunciation teacher title */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5" /> Read and Record:
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Click any word to hear correct pronunciation
                          </span>
                        </div>

                        {/* Interactive Click-to-Pronounce Script Row */}
                        <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-100/55 rounded-xl border border-slate-200/50">
                          {line.text.split(/\s+/).map((word, wIdx) => {
                            let badgeStyle = "bg-white text-slate-800 hover:bg-slate-200 border-slate-200 font-sans";
                            const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

                            if (speechMetrics) {
                              const matchObj = speechMetrics.wordStatuses.find(ws => 
                                ws.original.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim() === cleanWord
                              );
                              if (matchObj) {
                                if (matchObj.status === 'perfect') {
                                  badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 font-sans";
                                } else if (matchObj.status === 'almost') {
                                  badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 font-sans";
                                } else {
                                  badgeStyle = "bg-rose-105 text-rose-800 border-rose-300 bg-rose-100 hover:bg-rose-200 font-sans";
                                }
                              }
                            }

                            return (
                              <button
                                key={`pract-wd-${wIdx}`}
                                onClick={() => pronounceWord(word)}
                                className={`text-xs md:text-sm px-2.5 py-1 rounded-lg border font-medium transition-all pointer-events-auto cursor-pointer flex items-center gap-1 shadow-2xs ${badgeStyle}`}
                                title={`Click to hear how to say "${word}"`}
                              >
                                {word}
                                <Volume2 className="w-2.5 h-2.5 opacity-55" />
                              </button>
                            );
                          })}
                        </div>

                        {/* Error log if microphone permission failed */}
                        {speechError && (
                          <div className="text-xs p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 leading-relaxed font-sans">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="grow">
                              <p className="font-semibold">{speechError}</p>
                              <p className="text-[10px] opacity-80 mt-0.5">Please check microphone permission settings inside of browser or click simulated practice below to proceed.</p>
                            </div>
                          </div>
                        )}

                        {/* Speech Metrics Results Dashboard */}
                        {speechMetrics && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60 flex flex-col gap-3.5"
                          >
                            <div className="grid grid-cols-2 gap-3.5 animate-fade-in font-sans">
                              {/* circular design match scoring */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200/50 flex flex-col items-center justify-center text-center">
                                <div className="text-base font-bold text-indigo-700 tracking-tight font-mono">{speechMetrics.accuracy}%</div>
                                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Pronunciation Match</div>
                              </div>

                              {/* speed/pacing speedometer */}
                              <div className="bg-white rounded-lg p-3 border border-slate-200/50 flex flex-col items-center justify-center text-center">
                                <div className="text-base font-bold text-emerald-700 tracking-tight font-mono">{speechMetrics.wpm} WPM</div>
                                <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5 font-sans">Pacing tempo</div>
                              </div>
                            </div>

                            {/* comparative align outputs */}
                            <div className="font-sans">
                              <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 font-mono mb-1">What we heard:</div>
                              <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded border border-slate-200/50 leading-relaxed font-sans">
                                "{spokenTranscript || '...'}"
                              </p>
                              <p className="text-[10px] text-indigo-650 text-indigo-650 font-medium mt-1.5 flex items-center gap-1 font-sans">
                                <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600" /> {speechMetrics.pacingFeedback}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Mic recording controls */}
                        <div className="flex items-center gap-2 font-sans">
                          {!isRecording ? (
                            <button
                              onClick={startSpeechRecognition}
                              className="grow bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                            >
                              <Mic className="w-4 h-4 fill-white animate-pulse" /> Start Recording Line
                            </button>
                          ) : (
                            <button
                              onClick={stopSpeechRecognition}
                              className="grow bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 animate-pulse transition-all cursor-pointer"
                            >
                              <div className="w-2 h-2 bg-white rounded-full animate-ping mr-1" /> Stop & Analyze ({recordingDuration}s)
                            </button>
                          )}

                          <button
                            onClick={simulateRecording}
                            disabled={isRecording}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                            title="Simulate speech for sandbox testing"
                          >
                            Simulate Speech
                          </button>
                        </div>

                        {/* Submit dialogue line and continue */}
                        {speechMetrics && (
                          <motion.button
                            initial={{ scale: 0.98, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => {
                              // Save score
                              if (currentLineIndex !== null) {
                                setLineScores(prev => ({
                                  ...prev,
                                  [currentLineIndex]: { accuracy: speechMetrics.accuracy, wpm: speechMetrics.wpm }
                                }));
                              }
                              setSpokenTranscript('');
                              setSpeechMetrics(null);
                              setSpeechError(null);
                              
                              if (currentLineIndex !== null && currentLineIndex < script.length - 1) {
                                setIsPlaying(true);
                                setCurrentLineIndex(currentLineIndex + 1);
                              } else {
                                setIsPlaying(false);
                                setCurrentLineIndex(null);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-sans"
                          >
                            Submit & Continue Dialogue <ChevronRight className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    ) : roleMode === 'roleplay' && isActive && roleplayChoices.length > 0 ? (
                      <div className="space-y-3 mt-1.5 select-none">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                          <Check className="w-3.5 h-3.5 text-indigo-505" /> Choose the B2 Upgraded phrasing:
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {roleplayChoices.map((choice, cIdx) => {
                            const isSelected = selectedRoleplayChoice === cIdx;
                            const isCorrectType = choice.type === 'correct';
                            
                            let borderStyle = "border-slate-250 bg-white hover:border-slate-400 hover:bg-slate-50";
                            let iconBadge = null;

                            if (roleplaySubmitted) {
                              if (isCorrectType) {
                                borderStyle = "border-emerald-500 bg-emerald-50/65 text-emerald-950 font-medium";
                                iconBadge = <span className="bg-emerald-500 text-white rounded-full p-0.5"><Check className="w-2.5 h-2.5" /></span>;
                              } else if (isSelected) {
                                borderStyle = "border-red-400 bg-red-50/50 text-red-950";
                              }
                            } else if (isSelected) {
                              borderStyle = "border-indigo-500 bg-indigo-50/40 font-medium text-slate-900";
                            }

                            return (
                              <button
                                key={`rc-${cIdx}`}
                                disabled={roleplaySubmitted}
                                onClick={() => setSelectedRoleplayChoice(cIdx)}
                                className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all focus:outline-none flex justify-between items-center gap-3 cursor-pointer ${borderStyle}`}
                              >
                                <span>{choice.text}</span>
                                {iconBadge}
                              </button>
                            );
                          })}
                        </div>

                        {roleplayFeedback && (
                          <div className={`text-xs p-3 rounded-lg border leading-relaxed transition-all ${
                            roleplayChoices[selectedRoleplayChoice!]?.type === 'correct'
                              ? 'bg-emerald-50/50 border-emerald-250 text-emerald-800'
                              : 'bg-rose-50/50 border-rose-200 text-rose-800'
                          }`}>
                            {roleplayFeedback}
                          </div>
                        )}

                        {!roleplaySubmitted ? (
                          <button
                            onClick={handleRoleplaySubmit}
                            disabled={selectedRoleplayChoice === null}
                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              selectedRoleplayChoice !== null
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Verify & Speak Phrase
                          </button>
                        ) : (
                          roleplayChoices[selectedRoleplayChoice!]?.type !== 'correct' && (
                            <button
                              onClick={() => {
                                setRoleplaySubmitted(false);
                                setRoleplayFeedback(null);
                                setSelectedRoleplayChoice(null);
                              }}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Try Another Choice
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      isObscured && !isRevealed ? (
                        <motion.div 
                          initial={{ opacity: 0.8 }}
                          className="py-1 flex items-center justify-between gap-4 cursor-pointer"
                          onClick={() => toggleRevealLine(line.id)}
                        >
                          <span className="font-mono text-[11px] text-slate-300 select-none tracking-widest font-bold">
                            •••••••••••• •••••••••••• ••••••••••••
                          </span>
                          <span className="text-[9px] uppercase font-mono tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded shrink-0 flex items-center gap-1 group-hover:bg-slate-200 transition-colors">
                            <Eye className="w-3 h-3" /> Reveal line
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0.5, y: 1 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-slate-700 font-normal"
                        >
                          {renderTextWithHighlights(line)}
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded Player Dashboard Control panel */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Speed slider */}
        <div className="xl:min-w-[140px] flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">Speed:</span>
          <div className="flex gap-1.5">
            {[0.8, 1.0, 1.25].map(rate => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                id={`btn-speed-${rate}`}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                  playbackRate === rate 
                    ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                    : 'bg-white border-slate-200 text-slate-655 hover:bg-slate-50'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Global Progress Track */}
        {currentLineIndex !== null && (
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
            Line <span className="text-slate-900 font-bold">{currentLineIndex + 1}</span> of <span className="text-slate-900 font-bold">{script.length}</span>
          </div>
        )}

        {/* Play control triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStopReset}
            disabled={currentLineIndex === null}
            id="btn-global-reset"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-transparent hover:border-slate-200/60"
            title="Reset transcript"
          >
            <RotateCcw className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={handlePlayPause}
            id="btn-global-play-pause"
            className={`px-5 py-2 rounded-full font-medium shadow-xs flex items-center gap-2 text-xs uppercase tracking-widest transition-all cursor-pointer ${
              isPlaying
                ? 'bg-slate-800 hover:bg-slate-900 text-white font-bold'
                : 'bg-slate-900 hover:bg-slate-850 text-white font-semibold'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> {currentLineIndex === null ? 'Play Audio' : 'Resume'}
              </>
            )}
          </button>

          {/* Prompt manually if sequence is open in practice modes */}
          {roleMode !== 'all' && currentLineIndex !== null && (
            <button
              onClick={() => {
                if (currentLineIndex < script.length - 1) {
                  setCurrentLineIndex(prev => (prev !== null ? prev + 1 : null));
                  setIsPlaying(true);
                } else {
                  handleStopReset();
                }
              }}
              id="btn-practice-next"
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-800 font-semibold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
