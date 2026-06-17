import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Send, UserCheck, Users, LogIn } from 'lucide-react';

interface PeerMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: any;
}

export default function PeerDiscussion({ unitId }: { unitId: number }) {
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Auth error", error);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !currentUser) {
      setMessages([]); // Clear messages if not authenticated
      return;
    }

    const topicId = `unit-${unitId}`;
    const q = query(
      collection(db, 'topics', topicId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: PeerMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as PeerMessage);
      });
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      console.error('Firestore Error: ', error.message);
    });

    return () => unsubscribe();
  }, [unitId, isAuthReady, currentUser]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const topicId = `unit-${unitId}`;
    try {
      await addDoc(collection(db, 'topics', topicId, 'messages'), {
        text: inputText.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Student',
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      alert("Error sending message. Check permissions.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#EBE3E3] shadow-sm flex flex-col justify-between h-[450px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-extrabold text-[#8C3A3A] tracking-wider uppercase font-mono block">
          Unit {unitId} Peer Discussion
        </span>
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-[#8A7A70] font-bold">
          <Users className="w-3.5 h-3.5" /> Live
        </div>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto pr-2 mb-4 scrollbar-thin">
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
             <div className="w-12 h-12 bg-stone-50 flex items-center justify-center rounded-full">
               <LogIn className="w-5 h-5 text-stone-400" />
             </div>
             <p className="text-xs text-[#8A7A70] italic">Please sign in to read and participate.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#8A7A70] italic">
            No messages yet. Start the discussion!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.authorId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[9px] font-mono text-[#8A7A70] opacity-80 uppercase tracking-widest pl-1">
                    {msg.authorName}
                  </span>
                )}
                <div
                  className={`p-3 rounded-xl text-xs max-w-[85%] ${
                    isMe
                      ? 'bg-[#2C241E] text-white rounded-br-sm'
                      : 'bg-[#F4ECEC]/60 text-[#3B312A] border border-[#EAE0E0]/40 rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 pt-3 border-t border-stone-100 mt-auto">
        {!currentUser ? (
           <button
             onClick={handleSignIn}
             className="w-full py-3 bg-[#2C241E] hover:bg-[#111926] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
           >
             <LogIn className="w-4 h-4" /> Sign In with Google
           </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Discuss this unit with peers..."
              className="flex-grow text-xs text-[#3B312A] p-3 bg-stone-50 border border-[#EAE0E0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C3A3A] leading-relaxed transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="px-4 py-2 bg-[#8C3A3A] hover:bg-[#6B2B2B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
