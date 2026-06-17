import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getAccessToken, googleSignIn, initAuth } from '../lib/auth';
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react';

export default function CalendarViewer() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        fetchEvents(token);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchEvents(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchEvents = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch events from primary calendar
      // We limit to upcoming events
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=15&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const data = await res.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error('Fetch events error:', err);
      setError(err.message || 'Failed to fetch events.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatEventTime = (startNode: any, endNode: any) => {
    if (!startNode) return 'No time specified';
    
    // Handle all-day events
    if (startNode.date) {
      return new Date(startNode.date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      }) + ' (All Day)';
    }

    // Handle specific times
    if (startNode.dateTime) {
      const startDate = new Date(startNode.dateTime);
      const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const startDayStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      let endStr = '';
      if (endNode && endNode.dateTime) {
        const endDate = new Date(endNode.dateTime);
        if (endDate.toDateString() === startDate.toDateString()) {
          endStr = ' - ' + endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
      }
      
      return `${startDayStr}, ${startTime}${endStr}`;
    }
    
    return 'TBA';
  };

  // Helper formatting for attendees
  const renderAttendees = (attendees: any[]) => {
    if (!attendees || attendees.length === 0) return null;
    return (
      <div className="flex -space-x-2 overflow-hidden mt-2">
        {attendees.slice(0, 5).map((att, i) => (
          <div key={i} className="inline-block h-6 w-6 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-stone-600 bg-stone-100" title={att.email}>
            {att.email.charAt(0).toUpperCase()}
          </div>
        ))}
        {attendees.length > 5 && (
          <div className="inline-block h-6 w-6 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-stone-600">
            +{attendees.length - 5}
          </div>
        )}
      </div>
    );
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif">Connect Google Calendar</h3>
        <p className="text-sm text-stone-500 mb-8 max-w-sm leading-relaxed">
          Sign in to view your upcoming lessons, study sessions, and events directly within the platform.
        </p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="gsi-material-button w-64 bg-white border border-stone-300 rounded shadow-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
          style={{ height: '40px', padding: 0 }}
        >
          <div className="gsi-material-button-state"></div>
          <div className="gsi-material-button-content-wrapper flex items-center h-full px-2">
            <div className="gsi-material-button-icon h-[18px] w-[18px] min-w-[18px]">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            </div>
            <span className="gsi-material-button-contents ml-3 text-sm font-medium text-stone-600 font-sans">
              {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#2C241E] tracking-tight font-serif flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Class Schedule & Events
          </h3>
          <p className="text-xs text-[#8A7A70] font-normal leading-relaxed mt-1">
            View upcoming lessons and study sessions from your Google Calendar.
          </p>
        </div>
        <button 
          onClick={async () => {
             const token = await getAccessToken();
             if (token) fetchEvents(token);
          }}
          className="px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold rounded shadow-sm hover:bg-stone-50 uppercase tracking-wider font-mono flex items-center gap-1 cursor-pointer"
        >
          {isLoading ? 'Syncing...' : 'Sync Calendar'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-blue-500 animate-spin mb-4" />
          <p className="text-stone-500 text-sm font-mono">Loading upcoming events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 shadow-sm border-dashed">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h4 className="text-stone-700 font-semibold mb-1">No Upcoming Events</h4>
          <p className="text-stone-500 text-sm">You don't have any lessons or study sessions scheduled soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={event.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3 hover:border-blue-200 transition-colors"
            >
              <div className="flex gap-3 items-start">
                <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: event.colorId ? '#4285F4' : '#10B981' }} />
                <div>
                  <h4 className="font-bold text-stone-900 text-sm leading-snug">{event.summary || 'Untitled Event'}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {formatEventTime(event.start, event.end)}
                  </div>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-1.5 text-xs text-stone-600 pl-5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" />
                  <span className="line-clamp-2 leading-relaxed">{event.location}</span>
                </div>
              )}
              
              {event.hangoutLink && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 pl-5">
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <a href={event.hangoutLink} target="_blank" rel="noreferrer" className="hover:underline font-semibold">Join Video Call</a>
                </div>
              )}

              {event.attendees && event.attendees.length > 0 && (
                <div className="pl-5 pt-2 border-t border-stone-100/50 mt-2">
                  <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-400 mb-1">Attendees</div>
                  {renderAttendees(event.attendees)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
