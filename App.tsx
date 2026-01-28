
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CinematicStyle, GenerationState, MediaState } from './types';
import { CINEMATIC_STYLES, VEO_LOADING_MESSAGES } from './constants';
import { GeminiService } from './services/geminiService';

export default function App() {
  const [state, setState] = useState<GenerationState>('idle');
  const [excerpt, setExcerpt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<CinematicStyle | null>(null);
  const [media, setMedia] = useState<MediaState>({
    imageUrl: null,
    videoUrl: null,
    excerpt: '',
    selectedStyle: null,
    lastPrompt: ''
  });
  const [editPrompt, setEditPrompt] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // Accessing environment-provided aistudio global. 
      // Using @ts-ignore to avoid property existence checks on window if typings are incomplete.
      // @ts-ignore
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    };
    checkKey();
  }, []);

  const handleDraftKeyframe = async () => {
    if (!excerpt || !selectedStyle) return;
    
    setState('drafting');
    setError(null);
    try {
      const imageUrl = await GeminiService.generateKeyframe(excerpt, selectedStyle.promptSuffix);
      setMedia(prev => ({
        ...prev,
        imageUrl,
        videoUrl: null,
        excerpt,
        selectedStyle,
        lastPrompt: excerpt
      }));
      setState('completed');
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
      setState('error');
    }
  };

  const handleEditImage = async () => {
    if (!media.imageUrl || !editPrompt) return;
    
    setState('editing');
    setError(null);
    try {
      const newImageUrl = await GeminiService.editImage(media.imageUrl, editPrompt);
      setMedia(prev => ({ ...prev, imageUrl: newImageUrl }));
      setEditPrompt('');
      setState('completed');
    } catch (err: any) {
      setError(err.message || "Failed to edit image");
      setState('completed');
    }
  };

  const handleAnimate = async () => {
    if (!media.imageUrl) return;

    // Trigger API Key selection if not already selected
    // @ts-ignore
    if (!hasApiKey && window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      // Proceeding directly after triggering key selection to mitigate race conditions
    }

    setState('animating');
    setError(null);
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadingMsg(VEO_LOADING_MESSAGES[msgIndex % VEO_LOADING_MESSAGES.length]);
      msgIndex++;
    }, 5000);

    try {
      const videoUrl = await GeminiService.animateImage(media.imageUrl, media.lastPrompt);
      setMedia(prev => ({ ...prev, videoUrl }));
      setState('completed');
    } catch (err: any) {
      // Reset key state if the session expired or key was invalid
      if (err.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key session expired. Please re-select your key.");
      } else {
        setError(err.message || "Animation failed");
      }
      setState('completed');
    } finally {
      clearInterval(interval);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        setMedia({
          imageUrl: base64,
          videoUrl: null,
          excerpt: 'Uploaded image',
          selectedStyle: null,
          lastPrompt: 'Uploaded image'
        });
        setState('completed');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="py-12 text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
          CINEMATICA
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Transform your favorite book excerpts into richly animated cinematography.
          Draft keyframes, edit styles, and breathe life into scenes.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-10">
          <section className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="p-2 bg-blue-500/20 rounded-lg"><svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></span>
              Book Excerpt
            </h2>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Paste a vivid description from a book..."
              className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-zinc-700"
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 rounded-lg"><svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg></span>
              Choose Styling
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {CINEMATIC_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`relative group overflow-hidden rounded-xl border-2 transition-all text-left ${
                    selectedStyle?.id === style.id ? 'border-blue-500' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <img src={style.previewUrl} alt={style.name} className="w-full h-24 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <span className="text-sm font-medium block">{style.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleDraftKeyframe}
              disabled={!excerpt || !selectedStyle || state === 'drafting'}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {state === 'drafting' ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Rendering Draft...</>
              ) : (
                'Draft Initial Keyframe'
              )}
            </button>
            <div className="relative">
              <input type="file" onChange={handleFileUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
              <button className="w-full py-3 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 font-medium rounded-xl transition-all">
                Or Upload Reference Photo
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Iteration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl aspect-video relative group">
            {!media.imageUrl && !media.videoUrl && state === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                <p>The screen is dark. Start your production.</p>
              </div>
            )}

            {media.videoUrl ? (
              <video
                src={media.videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
            ) : media.imageUrl ? (
              <img src={media.imageUrl} alt="Keyframe" className="w-full h-full object-cover" />
            ) : null}

            {(state === 'drafting' || state === 'animating' || state === 'editing') && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">
                  {state === 'drafting' ? 'Painting the Scene' : state === 'editing' ? 'Applying Edits' : 'Bringing to Life'}
                </h3>
                <p className="text-zinc-400 animate-pulse italic">
                  {state === 'animating' ? loadingMsg : "Consulting the creative director..."}
                </p>
              </div>
            )}
          </div>

          {media.imageUrl && state !== 'animating' && (
            <div className="space-y-6">
              {/* Image Editor */}
              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Keyframe
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., 'Add a retro filter', 'Make it rain', 'Change the lighting to sunset'..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleEditImage}
                    disabled={!editPrompt || state === 'editing'}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Animate Trigger */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleAnimate}
                  className="group px-12 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                  {media.videoUrl ? 'Re-animate Scene' : 'ANIMATE (VEO 3.1)'}
                </button>
                {!hasApiKey && (
                  <p className="mt-4 text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700">
                    * Veo generation requires selecting a paid API Key
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
        <p>Built with Google Gemini 2.5 & Veo 3.1 Fast | Cinematic Text-to-Video Studio</p>
      </footer>
    </div>
  );
}
