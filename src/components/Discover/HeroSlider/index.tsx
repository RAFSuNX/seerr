import CachedImage from '@app/components/Common/CachedImage';
import RequestModal from '@app/components/RequestModal';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import {
  ArrowDownTrayIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { MediaStatus } from '@server/constants/media';
import type { MovieResult, TvResult } from '@server/models/Search';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

interface TrendingResponse {
  results: (MovieResult | TvResult)[];
}

const ROTATE_INTERVAL = 7000;

const HeroSlider = () => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<MediaStatus | undefined>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPaused = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const isAnimating = useRef(false);

  const { data } = useSWR<TrendingResponse>('/api/v1/discover/trending');

  const items = (data?.results ?? [])
    .filter(
      (r): r is MovieResult | TvResult =>
        (r.mediaType === 'movie' || r.mediaType === 'tv') && !!r.backdropPath
    )
    .slice(0, 8);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating.current || index === currentIndex) return;
      isAnimating.current = true;

      // Fade out content
      setContentVisible(false);

      setTimeout(() => {
        setCurrentIndex(index);
        setCurrentStatus(undefined);
        // Fade in content slightly after slide starts
        setTimeout(() => {
          setContentVisible(true);
          isAnimating.current = false;
        }, 200);
      }, 150);
    },
    [currentIndex]
  );

  const next = useCallback(() => {
    if (items.length === 0) return;
    goTo((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, goTo]);

  const prev = useCallback(() => {
    if (items.length === 0) return;
    goTo((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, goTo]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused.current) next();
    }, ROTATE_INTERVAL);
  }, [next]);

  useEffect(() => {
    if (items.length > 1) startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length, startInterval]);

  if (items.length === 0) return null;

  const featured = items[currentIndex];
  const isMovie = featured.mediaType === 'movie';
  const title = isMovie
    ? (featured as MovieResult).title
    : (featured as TvResult).name;
  const year = (
    isMovie
      ? (featured as MovieResult).releaseDate
      : (featured as TvResult).firstAirDate
  )?.slice(0, 4);
  const detailUrl = isMovie ? `/movie/${featured.id}` : `/tv/${featured.id}`;
  const status = currentStatus ?? featured.mediaInfo?.status;

  const showRequestButton = hasPermission(
    [
      Permission.REQUEST,
      isMovie ? Permission.REQUEST_MOVIE : Permission.REQUEST_TV,
    ],
    { type: 'or' }
  );

  const canRequest =
    showRequestButton &&
    (!status ||
      status === MediaStatus.UNKNOWN ||
      status === MediaStatus.DELETED);

  return (
    <div
      className="relative -mx-4 -mt-16 mb-8 h-[48vw] max-h-[520px] min-h-[320px] overflow-hidden"
      onMouseEnter={() => {
        isPaused.current = true;
      }}
      onMouseLeave={() => {
        isPaused.current = false;
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            next();
          } else {
            prev();
          }
          startInterval();
        }
        touchStartX.current = null;
      }}
    >
      <RequestModal
        tmdbId={featured.id}
        show={showRequestModal}
        type={isMovie ? 'movie' : 'tv'}
        onComplete={(s) => {
          setCurrentStatus(s);
          setShowRequestModal(false);
        }}
        onUpdating={() => void 0}
        onCancel={() => setShowRequestModal(false)}
      />

      {/* Sliding backdrop track */}
      <div
        className="absolute inset-0 flex h-full"
        style={{
          width: `${items.length * 100}%`,
          transform: `translateX(-${(currentIndex * 100) / items.length}%)`,
          transition: 'transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="relative h-full"
            style={{ width: `${100 / items.length}%` }}
          >
            <CachedImage
              type="tmdb"
              src={`https://image.tmdb.org/t/p/w1280${item.backdropPath}`}
              alt=""
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Subtle left vignette for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />

      {/* Blur layer — bottom to middle, fades out upward */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          maskImage: 'linear-gradient(to top, black 0%, black 35%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 35%, transparent 100%)',
        }}
      />

      {/* Black hue over the blur zone */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
          maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 100%)',
        }}
      />

      {/* Content — staggered slide-in from left */}
      <div className="absolute inset-0 flex items-end pb-8 pl-6 pr-4 sm:pl-10 lg:pl-12">
        <div className="max-w-lg">
          <style>{`
            @keyframes heroSlideIn {
              from { opacity: 0; transform: translateX(22px); }
              to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes heroSlideOut {
              from { opacity: 1; transform: translateX(0); }
              to   { opacity: 0; transform: translateX(-14px); }
            }
            .hero-item {
              animation-fill-mode: both;
              animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
            }
            .hero-item-in  { animation-name: heroSlideIn; animation-duration: 500ms; }
            .hero-item-out { animation-name: heroSlideOut; animation-duration: 250ms; }
          `}</style>
          <div key={`hero-content-${currentIndex}`} style={{ display: 'contents' }}>

          {/* Title */}
          <h1
            className="mb-2 font-bold leading-[1.15] tracking-tight text-white hero-item hero-item-in"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', animationDelay: '60ms' }}
          >
            {title}
          </h1>

          {/* Overview */}
          {featured.overview && (
            <p
              className="mb-5 text-xs leading-relaxed text-white/50 sm:text-sm hero-item hero-item-in"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
                maxWidth: '38ch',
                animationDelay: '120ms',
              }}
            >
              {featured.overview}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href={detailUrl}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
            >
              View Details
            </Link>
            {canRequest && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600/90 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 transition hover:bg-indigo-500"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                {intl.formatMessage(globalMessages.request)}
              </button>
            )}
          </div>
          </div>{/* end key wrapper */}
        </div>
      </div>

      {/* Meta col — bottom right, top-to-bottom */}
      <div
        key={`hero-meta-${currentIndex}`}
        className="absolute bottom-8 right-6 flex flex-col items-end gap-1.5 hero-item hero-item-in"
        style={{ animationDelay: '0ms' }}
      >
        {/* Tag */}
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isMovie ? 'bg-blue-400' : 'bg-violet-400'}`}
            style={{ boxShadow: isMovie ? '0 0 6px rgba(96,165,250,0.8)' : '0 0 6px rgba(167,139,250,0.8)' }}
          />
          <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isMovie ? 'text-blue-300' : 'text-violet-300'}`}>
            {isMovie
              ? intl.formatMessage(globalMessages.movie)
              : intl.formatMessage(globalMessages.tvshow)}
          </span>
        </span>

        {/* Rating | Year */}
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/50">
          {featured.voteAverage > 0 && (
            <span className="flex items-center gap-1">
              <StarIcon className="h-3 w-3 text-yellow-400/70" />
              <span className="text-yellow-400/70">{featured.voteAverage.toFixed(1)}</span>
            </span>
          )}
          {featured.voteAverage > 0 && year && (
            <span className="text-white/25">|</span>
          )}
          {year && <span>{year}</span>}
        </span>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                goTo(i);
                startInterval();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
