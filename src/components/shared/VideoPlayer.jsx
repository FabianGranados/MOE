import { useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  className = '',
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden bg-surface-sunken group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="w-14 h-14 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-pop hover:scale-105 transition"
        >
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
      </div>
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
