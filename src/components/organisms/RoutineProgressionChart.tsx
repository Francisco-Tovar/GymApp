import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  RoutineSessionRecord,
  RoutineMetricMode,
  processRoutineProgression,
  calculateVisibleYBounds,
  ExerciseSeries,
} from '../../utils/routineProgression';
import { Typography } from '../atoms/Typography';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Combobox } from '../atoms/Combobox';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import {
  TrendingUp,
  Award,
  Layers,
  Calendar,
  CheckSquare,
  Square,
  HelpCircle,
  Eye,
  EyeOff,
  Flame,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Dumbbell,
} from 'lucide-react';

export interface RoutineProgressionChartProps {
  records: RoutineSessionRecord[];
  unit?: string;
  title?: string;
  subtitle?: string;
  availableWorkouts?: Array<{ id: number; name: string }>;
  selectedWorkoutId?: number | null;
  onSelectWorkoutId?: (id: number | null) => void;
  onClose?: () => void;
}

export const RoutineProgressionChart: React.FC<RoutineProgressionChartProps> = ({
  records,
  unit = 'lbs',
  title,
  subtitle,
  availableWorkouts,
  selectedWorkoutId,
  onSelectWorkoutId,
  onClose,
}) => {
  const { language } = useSettingsStore();
  const [metricMode, setMetricMode] = useState<RoutineMetricMode>('relativeGrowth');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [hasInitializedVisibility, setHasInitializedVisibility] = useState(false);
  const [hoveredSessionIndex, setHoveredSessionIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [modalSessionIndex, setModalSessionIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // 1. Process progression data across sessions
  const chartData = useMemo(() => {
    return processRoutineProgression(records, metricMode, unit);
  }, [records, metricMode, unit]);

  // 2. Initialize visible IDs on first data load
  useMemo(() => {
    if (!hasInitializedVisibility && chartData.series.length > 0) {
      setVisibleIds(new Set(chartData.series.map((s) => s.id)));
      setHasInitializedVisibility(true);
    }
  }, [chartData.series, hasInitializedVisibility]);

  // If new exercises appear, add them to visible set
  const allSeriesIds = useMemo(() => chartData.series.map((s) => s.id), [chartData.series]);
  const activeVisibleIds = useMemo(() => {
    if (visibleIds.size === 0 && !hasInitializedVisibility) {
      return new Set(allSeriesIds);
    }
    return visibleIds;
  }, [visibleIds, allSeriesIds, hasInitializedVisibility]);

  // 3. Dynamic Y bounds based strictly on currently visible series
  const { yMin, yMax } = useMemo(() => {
    return calculateVisibleYBounds(chartData.series, activeVisibleIds, metricMode);
  }, [chartData.series, activeVisibleIds, metricMode]);

  // SVG dimensions & coordinate scales
  const svgWidth = 720;
  const svgHeight = 340;
  const padding = { top: 25, right: 30, bottom: 42, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const sessionCount = chartData.sessions.length;

  const getX = useCallback(
    (index: number): number => {
      if (sessionCount <= 1) return padding.left + plotWidth / 2;
      return padding.left + (index / (sessionCount - 1)) * plotWidth;
    },
    [sessionCount, padding.left, plotWidth]
  );

  const getY = useCallback(
    (val: number): number => {
      const range = yMax - yMin || 1;
      const normalized = (val - yMin) / range;
      return padding.top + plotHeight - normalized * plotHeight;
    },
    [yMax, yMin, padding.top, plotHeight]
  );

  // 4. Generate multi-series SVG paths with clean line connection for non-missing points
  const visibleSeriesWithPaths = useMemo(() => {
    return chartData.series
      .filter((s) => activeVisibleIds.has(s.id))
      .map((series) => {
        const validPoints = series.points.filter((p) => p.hasData && p.value !== null);

        if (validPoints.length === 0) {
          return { series, pathD: '', validPoints: [] };
        }

        if (validPoints.length === 1) {
          const pt = validPoints[0];
          const x = getX(pt.sessionIndex);
          const y = getY(pt.value!);
          return { series, pathD: `M ${x} ${y} L ${x + 0.1} ${y}`, validPoints };
        }

        // Build continuous path connecting chronological data points
        let d = '';
        for (let i = 0; i < validPoints.length; i++) {
          const pt = validPoints[i];
          const x = getX(pt.sessionIndex);
          const y = getY(pt.value!);
          if (i === 0) {
            d += `M ${x} ${y}`;
          } else {
            d += ` L ${x} ${y}`;
          }
        }

        return { series, pathD: d, validPoints };
      });
  }, [chartData.series, activeVisibleIds, getX, getY]);

  // 5. Y-Axis tick generator
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    const step = (yMax - yMin) / (count - 1);
    for (let i = 0; i < count; i++) {
      const val = yMin + step * i;
      ticks.push(metricMode === 'relativeGrowth' ? Math.round(val) : Math.round(val * 10) / 10);
    }
    return ticks;
  }, [yMin, yMax, metricMode]);

  // 6. Legend interactions: click (toggle), double-click / long-press (solo), select/deselect all
  const toggleExercise = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const soloExercise = (id: string) => {
    setVisibleIds((prev) => {
      if (prev.size === 1 && prev.has(id)) {
        // If already soloed, restore all
        return new Set(chartData.series.map((s) => s.id));
      }
      return new Set([id]);
    });
  };

  const selectAll = () => {
    setVisibleIds(new Set(chartData.series.map((s) => s.id)));
  };

  const deselectAll = () => {
    setVisibleIds(new Set());
  };

  const handlePointerDown = (id: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      soloExercise(id);
    }, 550);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 7. Mouse/Touch Scrubbing
  const handleMouseMoveOrTouch = (
    clientX: number,
    clientY: number,
    rect: DOMRect
  ) => {
    if (sessionCount === 0) return;

    const relativeX = clientX - rect.left;
    const clampedX = Math.max(padding.left, Math.min(rect.width - padding.right, relativeX));
    const plotFraction = (clampedX - padding.left) / (rect.width - padding.left - padding.right);

    const closestIndex = Math.min(
      sessionCount - 1,
      Math.max(0, Math.round(plotFraction * (sessionCount - 1)))
    );

    setHoveredSessionIndex(closestIndex);
    setHoverPosition({
      x: relativeX,
      y: clientY - rect.top,
    });
  };

  const onChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMouseMoveOrTouch(e.clientX, e.clientY, rect);
  };

  const onChartTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      handleMouseMoveOrTouch(e.touches[0].clientX, e.touches[0].clientY, rect);
    }
  };

  const onChartLeave = () => {
    setHoveredSessionIndex(null);
    setHoverPosition(null);
  };

  // Handle click on chart to open fullscreen modal
  const handleChartClick = (clientX: number, target: SVGSVGElement) => {
    if (sessionCount === 0) return;
    const rect = target.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedX = Math.max(padding.left, Math.min(rect.width - padding.right, relativeX));
    const plotFraction = (clampedX - padding.left) / (rect.width - padding.left - padding.right);
    const closestIndex = Math.min(
      sessionCount - 1,
      Math.max(0, Math.round(plotFraction * (sessionCount - 1)))
    );
    setModalSessionIndex(closestIndex);
  };

  const onChartTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const onChartTouchEndWithTap = (e: React.TouchEvent<SVGSVGElement>) => {
    onChartLeave();
    if (e.changedTouches.length > 0 && touchStartPos.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartPos.current.y);
      if (dx < 10 && dy < 10) {
        handleChartClick(e.changedTouches[0].clientX, e.currentTarget);
      }
    }
  };

  // Keyboard navigation & body scroll lock for fullscreen modal
  useEffect(() => {
    if (modalSessionIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalSessionIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setModalSessionIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setModalSessionIndex((prev) => (prev !== null && prev < sessionCount - 1 ? prev + 1 : prev));
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalSessionIndex, sessionCount]);

  // 8. KPI Top Gainer Computation
  const topGainer = useMemo(() => {
    const valid = chartData.series.filter(
      (s) => activeVisibleIds.has(s.id) && s.growthPercent !== null
    );
    if (valid.length === 0) return null;
    valid.sort((a, b) => (b.growthPercent ?? 0) - (a.growthPercent ?? 0));
    return valid[0];
  }, [chartData.series, activeVisibleIds]);

  const activeHoveredSession =
    hoveredSessionIndex !== null ? chartData.sessions[hoveredSessionIndex] : null;

  const displayTitle = title || t('routine_progression_overload', language);
  const displaySubtitle = subtitle || t('routine_progression_subtitle', language);

  return (
    <Card
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '18px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Header & Routine Selector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  title="Go back"
                  aria-label="Go back"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <TrendingUp size={20} color="var(--primary)" />
              )}
              <Typography variant="h2" style={{ fontSize: '18px', fontWeight: 800 }}>
                {displayTitle}
              </Typography>
            </div>
            <Typography variant="caption" color="var(--text-muted)">
              {displaySubtitle}
            </Typography>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Routine Switcher if multiple workouts provided */}
            {availableWorkouts && availableWorkouts.length > 0 && onSelectWorkoutId && (
              <Combobox
                options={[
                  { value: '', label: language === 'es' ? 'Todas las Rutinas' : 'All Routine Workouts' },
                  ...availableWorkouts.map((w) => ({ value: w.id, label: w.name })),
                ]}
                value={selectedWorkoutId ?? ''}
                onChange={(val) => onSelectWorkoutId(val ? Number(val) : null)}
                size="sm"
                width="210px"
              />
            )}
          </div>
        </div>

        {/* KPI Mini Row */}
        {chartData.sessions.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Layers size={13} color="var(--text-muted)" />
                <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
                  {t('tracked_lifts', language)}
                </Typography>
              </div>
              <Typography variant="body" style={{ fontWeight: 800, fontSize: '14px' }}>
                {activeVisibleIds.size} / {chartData.series.length} {t('visible', language)}
              </Typography>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Calendar size={13} color="var(--text-muted)" />
                <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
                  {t('timeline_span', language)}
                </Typography>
              </div>
              <Typography variant="body" style={{ fontWeight: 800, fontSize: '14px' }}>
                {chartData.sessions.length} {t('sessions', language)}
              </Typography>
            </div>

            {topGainer && topGainer.growthPercent !== null && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  minWidth: '130px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Award size={13} color="var(--success)" />
                  <Typography variant="caption" color="var(--success)" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {t('top_gainer', language)}
                  </Typography>
                </div>
                <Typography
                  variant="body"
                  style={{
                    fontWeight: 800,
                    fontSize: '13px',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {topGainer.name} ({topGainer.growthPercent > 0 ? `+${topGainer.growthPercent}%` : `${topGainer.growthPercent}%`})
                </Typography>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Mode Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          backgroundColor: 'var(--bg-app)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '4px',
        }}
      >
        {(
          [
            { id: 'relativeGrowth', label: t('relative_growth', language), icon: Flame },
            { id: 'e1rm', label: `${t('estimated_1rm', language)} (${unit})`, icon: TrendingUp },
            { id: 'topSet', label: `${t('top_set_load', language)} (${unit})`, icon: Award },
            { id: 'volume', label: `${t('total_volume', language)} (${unit})`, icon: Layers },
          ] as const
        ).map((modeItem) => {
          const isActive = metricMode === modeItem.id;
          const Icon = modeItem.icon;
          return (
            <button
              key={modeItem.id}
              type="button"
              onClick={() => setMetricMode(modeItem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px var(--primary-glow)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={14} />
              <span>{modeItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Chart Graphic Area */}
      {sessionCount === 0 ? (
        <div
          style={{
            height: '240px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <Layers size={36} color="var(--text-subtle)" style={{ marginBottom: '8px' }} />
          <Typography variant="body" style={{ fontWeight: 600, marginBottom: '4px' }}>
            {t('no_routine_sessions', language)}
          </Typography>
          <Typography variant="caption" color="var(--text-muted)">
            {t('no_routine_sessions_desc', language)}
          </Typography>
        </div>
      ) : activeVisibleIds.size === 0 ? (
        <div
          style={{
            height: '240px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <EyeOff size={36} color="var(--text-subtle)" style={{ marginBottom: '8px' }} />
          <Typography variant="body" style={{ fontWeight: 600, marginBottom: '4px' }}>
            {t('all_lines_hidden', language)}
          </Typography>
          <Typography variant="caption" color="var(--text-muted)" style={{ marginBottom: '12px' }}>
            {t('all_lines_hidden_desc', language)}
          </Typography>
          <button
            type="button"
            onClick={selectAll}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('show_all_lines', language)}
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '8px 0',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              cursor: 'pointer',
              touchAction: 'none',
            }}
            onClick={(e) => handleChartClick(e.clientX, e.currentTarget)}
            onTouchStart={onChartTouchStart}
            onTouchEnd={onChartTouchEndWithTap}
            onMouseMove={onChartMouseMove}
            onTouchMove={onChartTouchMove}
            onMouseLeave={onChartLeave}
          >
            <defs>
              {/* Neon Glow Filter */}
              <filter id="neon-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((val, idx) => {
              const y = getY(val);
              const isBaseline100 = metricMode === 'relativeGrowth' && Math.abs(val - 100) < 0.5;

              return (
                <g key={`ytick-${idx}`} style={{ transition: 'all 0.3s ease' }}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke={
                      isBaseline100
                        ? 'rgba(255, 255, 255, 0.45)'
                        : 'rgba(255, 255, 255, 0.08)'
                    }
                    strokeWidth={isBaseline100 ? '1.5' : '1'}
                    strokeDasharray={isBaseline100 ? '4 3' : '2 2'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill={isBaseline100 ? '#ffffff' : 'var(--text-muted)'}
                    fontSize="10px"
                    fontWeight={isBaseline100 ? 700 : 500}
                    textAnchor="end"
                  >
                    {metricMode === 'relativeGrowth'
                      ? `${val}%`
                      : val.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Baseline indicator tag if Relative Growth */}
            {metricMode === 'relativeGrowth' && (
              <text
                x={svgWidth - padding.right}
                y={getY(100) - 6}
                fill="rgba(255, 255, 255, 0.5)"
                fontSize="9px"
                fontWeight={600}
                textAnchor="end"
              >
                100% Baseline
              </text>
            )}

            {/* X-Axis Date Labels */}
            {chartData.sessions.map((sess, idx) => {
              const x = getX(idx);
              const showTick =
                sessionCount <= 6 ||
                idx === 0 ||
                idx === sessionCount - 1 ||
                idx % Math.ceil(sessionCount / 5) === 0;

              if (!showTick) return null;

              return (
                <text
                  key={`xtick-${idx}`}
                  x={x}
                  y={svgHeight - 12}
                  fill="var(--text-muted)"
                  fontSize="10px"
                  textAnchor="middle"
                >
                  {sess.dateFormatted}
                </text>
              );
            })}

            {/* Multi-Line Exercise Paths */}
            {visibleSeriesWithPaths.map(({ series, pathD, validPoints }) => {
              if (!pathD) return null;

              return (
                <g key={`series-group-${series.id}`} style={{ transition: 'all 0.3s ease' }}>
                  {/* Outer line stroke */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neon-line-glow)"
                    style={{ transition: 'd 0.3s ease' }}
                  />

                  {/* Circular markers at individual session data points */}
                  {validPoints.map((pt, pIdx) => {
                    const cx = getX(pt.sessionIndex);
                    const cy = getY(pt.value!);
                    const isHovered = hoveredSessionIndex === pt.sessionIndex;

                    return (
                      <circle
                        key={`pt-${series.id}-${pIdx}`}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : 3.5}
                        fill={isHovered ? '#ffffff' : series.color}
                        stroke={series.color}
                        strokeWidth={isHovered ? 3 : 1.5}
                        style={{
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalSessionIndex(pt.sessionIndex);
                        }}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Vertical Crosshair Line on Hover / Scrub */}
            {hoveredSessionIndex !== null && (
              <g>
                <line
                  x1={getX(hoveredSessionIndex)}
                  y1={padding.top}
                  x2={getX(hoveredSessionIndex)}
                  y2={svgHeight - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Subtle Hint indicating the graph is interactive */}
      {sessionCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '2px 0',
            fontSize: '11px',
            color: 'var(--text-muted)',
            userSelect: 'none',
          }}
        >
          <Sparkles size={12} color="var(--primary)" />
          <span>{t('click_graph_hint', language)}</span>
        </div>
      )}

      {/* Interactive Legend with Solo Mode & Bulk Select */}
      {chartData.series.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Typography variant="caption" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                {t('exercises_legend', language)}
              </Typography>
              <Typography variant="caption" color="var(--text-subtle)" style={{ fontSize: '10px' }}>
                {t('legend_tip', language)}
              </Typography>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <CheckSquare size={12} />
                <span>{t('select_all', language)}</span>
              </button>

              <button
                type="button"
                onClick={deselectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <Square size={12} />
                <span>{t('deselect_all', language)}</span>
              </button>
            </div>
          </div>

          {/* Legend Exercise Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {chartData.series.map((series) => {
              const isVisible = activeVisibleIds.has(series.id);

              return (
                <button
                  key={series.id}
                  type="button"
                  onClick={() => toggleExercise(series.id)}
                  onDoubleClick={() => soloExercise(series.id)}
                  onPointerDown={() => handlePointerDown(series.id)}
                  onPointerUp={handlePointerUpOrLeave}
                  onPointerLeave={handlePointerUpOrLeave}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${isVisible ? series.color : 'rgba(255, 255, 255, 0.1)'}`,
                    backgroundColor: isVisible
                      ? `rgba(${parseInt(series.color.slice(1, 3), 16)}, ${parseInt(
                          series.color.slice(3, 5),
                          16
                        )}, ${parseInt(series.color.slice(5, 7), 16)}, 0.12)`
                      : 'rgba(255, 255, 255, 0.02)',
                    color: isVisible ? '#ffffff' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isVisible ? 700 : 500,
                    opacity: isVisible ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                  title="Click to toggle, double-click or long-press to solo"
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isVisible ? series.color : 'var(--text-subtle)',
                      boxShadow: isVisible ? `0 0 6px ${series.color}` : 'none',
                    }}
                  />
                  <span>{series.name}</span>
                  {series.growthPercent !== null && metricMode === 'relativeGrowth' && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: series.growthPercent >= 0 ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 700,
                      }}
                    >
                      {series.growthPercent > 0 ? `+${series.growthPercent}%` : `${series.growthPercent}%`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Fullscreen Session Detail Modal */}
      {modalSessionIndex !== null && typeof document !== 'undefined' && (() => {
        const modalSession = chartData.sessions[modalSessionIndex];
        if (!modalSession) return null;

        return createPortal(
          <div
            className="modal-portal-backdrop animate-fade-in"
            onClick={() => setModalSessionIndex(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100dvh',
              backgroundColor: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 10002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              className="modal-portal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '92dvh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-elevated)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color="var(--primary)" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Typography variant="h3" style={{ fontSize: '17px', fontWeight: 800 }}>
                        {t('session', language)} #{modalSessionIndex + 1}
                      </Typography>
                      <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {modalSession.dateFormatted}
                      </Badge>
                    </div>
                    <Typography variant="caption" color="var(--text-muted)">
                      {modalSession.date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </div>
                </div>

                {/* Session Stepper / Nav & Close */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={modalSessionIndex <= 0}
                    onClick={() => setModalSessionIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                    title={t('previous_session', language)}
                    aria-label={t('previous_session', language)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: modalSessionIndex <= 0 ? 'transparent' : 'var(--bg-surface)',
                      color: modalSessionIndex <= 0 ? 'var(--text-subtle)' : 'var(--text-primary)',
                      cursor: modalSessionIndex <= 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, padding: '0 4px' }}>
                    {modalSessionIndex + 1} / {sessionCount}
                  </span>

                  <button
                    type="button"
                    disabled={modalSessionIndex >= sessionCount - 1}
                    onClick={() => setModalSessionIndex((prev) => (prev !== null && prev < sessionCount - 1 ? prev + 1 : prev))}
                    title={t('next_session', language)}
                    aria-label={t('next_session', language)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: modalSessionIndex >= sessionCount - 1 ? 'transparent' : 'var(--bg-surface)',
                      color: modalSessionIndex >= sessionCount - 1 ? 'var(--text-subtle)' : 'var(--text-primary)',
                      cursor: modalSessionIndex >= sessionCount - 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalSessionIndex(null)}
                    title={t('close', language)}
                    aria-label={t('close', language)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      marginLeft: '6px',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Metric Mode Strip */}
              <div
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'es' ? 'Métrica activa:' : 'Active metric:'}
                  </span>
                  <Badge variant="accent" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {metricMode === 'relativeGrowth'
                      ? t('relative_growth', language)
                      : metricMode === 'e1rm'
                      ? `${t('estimated_1rm', language)} (${unit})`
                      : metricMode === 'topSet'
                      ? `${t('top_set_load', language)} (${unit})`
                      : `${t('total_volume', language)} (${unit})`}
                  </Badge>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {chartData.series.filter((s) => s.points[modalSessionIndex]?.hasData).length} {t('exercises', language).toLowerCase()}
                </span>
              </div>

              {/* Scrollable Exercises List */}
              <div
                style={{
                  padding: '16px 20px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flex: 1,
                }}
              >
                {chartData.series.map((series) => {
                  const point = series.points[modalSessionIndex];
                  const hasData = point && point.hasData;
                  const exData = modalSession.exercises.get(series.name.toLowerCase());

                  return (
                    <div
                      key={`modal-ex-${series.id}`}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: `1px solid ${hasData ? 'var(--border-color)' : 'rgba(255, 255, 255, 0.04)'}`,
                        borderLeft: `4px solid ${series.color}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        opacity: hasData ? 1 : 0.55,
                      }}
                    >
                      {/* Exercise Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: series.color,
                              boxShadow: `0 0 8px ${series.color}`,
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
                            {series.name}
                          </span>
                        </div>

                        {hasData ? (
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: series.color,
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {point.displayValue}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                            {t('skipped_session', language)}
                          </span>
                        )}
                      </div>

                      {/* Detailed Sets Breakdown */}
                      {hasData && exData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                            }}
                          >
                            {exData.sets.map((setObj, sIdx) => (
                              <div
                                key={`set-${sIdx}`}
                                style={{
                                  backgroundColor: 'var(--bg-main)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '5px 9px',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                  #{setObj.setNumber}:
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {setObj.weight} {unit}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>×</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {setObj.reps} {language === 'es' ? 'reps' : 'reps'}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Extra KPIs: Top Set, E1RM, Total Volume */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              paddingTop: '6px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>
                              <strong style={{ color: 'var(--text-secondary)' }}>Top Set:</strong> {exData.topSetWeight} {unit} × {exData.topSetReps}
                            </span>
                            <span>
                              <strong style={{ color: 'var(--text-secondary)' }}>e1RM:</strong> {exData.e1rm} {unit}
                            </span>
                            <span>
                              <strong style={{ color: 'var(--text-secondary)' }}>Volume:</strong> {exData.volume.toLocaleString()} {unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-elevated)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setModalSessionIndex(null)}
                  style={{ minWidth: '100px' }}
                >
                  {t('close', language)}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </Card>
  );
};
