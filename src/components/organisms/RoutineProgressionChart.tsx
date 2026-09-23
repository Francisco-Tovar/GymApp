import React, { useState, useMemo, useRef, useCallback } from 'react';
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
import { Combobox } from '../atoms/Combobox';
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
  title = 'Routine Progression Overload',
  subtitle,
  availableWorkouts,
  selectedWorkoutId,
  onSelectWorkoutId,
  onClose,
}) => {
  const [metricMode, setMetricMode] = useState<RoutineMetricMode>('relativeGrowth');
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [hasInitializedVisibility, setHasInitializedVisibility] = useState(false);
  const [hoveredSessionIndex, setHoveredSessionIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                {title}
              </Typography>
            </div>
            <Typography variant="caption" color="var(--text-muted)">
              {subtitle ||
                'Track all movements simultaneously across the shared routine timeline'}
            </Typography>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Routine Switcher if multiple workouts provided */}
            {availableWorkouts && availableWorkouts.length > 0 && onSelectWorkoutId && (
              <Combobox
                options={[
                  { value: '', label: 'All Routine Workouts' },
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
                  Tracked Lifts
                </Typography>
              </div>
              <Typography variant="body" style={{ fontWeight: 800, fontSize: '14px' }}>
                {activeVisibleIds.size} / {chartData.series.length} visible
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
                  Timeline Span
                </Typography>
              </div>
              <Typography variant="body" style={{ fontWeight: 800, fontSize: '14px' }}>
                {chartData.sessions.length} sessions
              </Typography>
            </div>

            {topGainer && topGainer.growthPercent !== null && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <Award size={13} color="var(--success)" />
                  <Typography variant="caption" color="var(--success)" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Top Gainer
                  </Typography>
                </div>
                <Typography
                  variant="body"
                  style={{
                    fontWeight: 800,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
            { id: 'relativeGrowth', label: 'Relative Growth (%)', icon: Flame },
            { id: 'e1rm', label: `Estimated 1RM (${unit})`, icon: TrendingUp },
            { id: 'topSet', label: `Top Set Load (${unit})`, icon: Award },
            { id: 'volume', label: `Total Volume (${unit})`, icon: Layers },
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
            No Routine Sessions Logged Yet
          </Typography>
          <Typography variant="caption" color="var(--text-muted)">
            Complete workouts under this routine to unlock multi-movement progression tracking.
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
            All Exercise Lines Hidden
          </Typography>
          <Typography variant="caption" color="var(--text-muted)" style={{ marginBottom: '12px' }}>
            Select an exercise tag from the legend below or click "Select All" to view progress.
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
            Show All Lines
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
              cursor: 'crosshair',
              touchAction: 'none',
            }}
            onMouseMove={onChartMouseMove}
            onTouchMove={onChartTouchMove}
            onMouseLeave={onChartLeave}
            onTouchEnd={onChartLeave}
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

          {/* Shared Floating Tooltip */}
          {activeHoveredSession && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                maxWidth: '320px',
                width: 'calc(100% - 24px)',
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Tooltip Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="var(--primary)" />
                  <Typography variant="caption" style={{ fontWeight: 800, color: '#ffffff' }}>
                    {activeHoveredSession.dateFormatted}
                  </Typography>
                </div>
                <Typography variant="caption" color="var(--text-muted)">
                  Session #{hoveredSessionIndex! + 1}
                </Typography>
              </div>

              {/* Tooltip List of Visible Exercises */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {chartData.series
                  .filter((s) => activeVisibleIds.has(s.id))
                  .map((series) => {
                    const point = series.points[hoveredSessionIndex!];
                    const hasData = point && point.hasData;

                    return (
                      <div
                        key={`tt-${series.id}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          fontSize: '11px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: series.color,
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                              {series.name}
                            </span>
                          </div>

                          <span
                            style={{
                              fontWeight: 700,
                              color: hasData ? series.color : 'var(--text-subtle)',
                            }}
                          >
                            {hasData ? point.displayValue : 'Skipped'}
                          </span>
                        </div>

                        {hasData && (
                          <div
                            style={{
                              paddingLeft: '14px',
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            {point.breakdown}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
                EXERCISES LEGEND
              </Typography>
              <Typography variant="caption" color="var(--text-subtle)" style={{ fontSize: '10px' }}>
                (Tap to toggle · Double-tap to isolate)
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
                <span>Select All</span>
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
                <span>Deselect All</span>
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
    </Card>
  );
};
