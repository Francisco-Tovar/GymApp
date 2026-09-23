import React, { useState, useMemo, useEffect } from 'react';
import {
  WorkoutSessionRecord,
  ProgressionMode,
  ProcessedDataPoint,
  TimeRangeInterval,
  TIME_RANGE_OPTIONS,
  getAvailableExercises,
  processExerciseProgression,
  getModeYAxisLabel,
  calculateEpley1RM,
  calculateSessionTopSet,
  calculateSessionVolume,
  formatSetsBreakdown,
} from '../../utils/progressiveOverload';
import { Typography } from '../atoms/Typography';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { TrendingUp, Award, Activity, Calendar, Dumbbell, Sparkles } from 'lucide-react';

export interface ProgressiveOverloadChartProps {
  /**
   * Workout session records conforming to the required schema:
   * ExerciseId / ExerciseName, Date, Sets (Weight, Reps)
   */
  records?: WorkoutSessionRecord[];
  /**
   * Default selected exercise ID or name
   */
  defaultExerciseId?: string;
  /**
   * Default time interval range ('all' | '1m' | '3m' | '6m' | '1y')
   */
  defaultTimeRange?: TimeRangeInterval;
  /**
   * Display weight unit (lb / kg)
   */
  unit?: 'lb' | 'kg';
  /**
   * Optional title override
   */
  title?: string;
  /**
   * Optional custom style
   */
  style?: React.CSSProperties;
}

export const ProgressiveOverloadChart: React.FC<ProgressiveOverloadChartProps> = ({
  records = [],
  defaultExerciseId,
  defaultTimeRange = 'all',
  unit = 'lb',
  title = 'Progressive Overload Tracker',
  style,
}) => {
  const [activeMode, setActiveMode] = useState<ProgressionMode>('e1rm');
  const [timeRange, setTimeRange] = useState<TimeRangeInterval>(defaultTimeRange);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<ProcessedDataPoint | null>(null);


  // Extract available exercises from records
  const availableExercises = useMemo(() => {
    return getAvailableExercises(records);
  }, [records]);

  // Sync selected exercise with available options or defaultExerciseId
  useEffect(() => {
    if (availableExercises.length === 0) {
      setSelectedExercise('');
      return;
    }

    if (defaultExerciseId) {
      const match = availableExercises.find(
        (ex) =>
          ex.id.toLowerCase() === defaultExerciseId.toLowerCase() ||
          ex.name.toLowerCase() === defaultExerciseId.toLowerCase()
      );
      if (match) {
        setSelectedExercise(match.id);
        return;
      }
    }

    // Default to the first exercise with the most recorded sessions if not already selected
    if (!selectedExercise || !availableExercises.some((ex) => ex.id === selectedExercise)) {
      const sortedByCount = [...availableExercises].sort((a, b) => b.sessionCount - a.sessionCount);
      setSelectedExercise(sortedByCount[0]?.id || availableExercises[0]?.id || '');
    }
  }, [availableExercises, defaultExerciseId, selectedExercise]);

  // Process data points for the active exercise, mode, and time range (computed in memory without re-fetching)
  const dataPoints = useMemo(() => {
    if (!selectedExercise) return [];
    return processExerciseProgression(records, selectedExercise, activeMode, unit, timeRange);
  }, [records, selectedExercise, activeMode, unit, timeRange]);

  // Auto-select latest data point for preview if none hovered
  useEffect(() => {
    if (dataPoints.length > 0) {
      setHoveredPoint(dataPoints[dataPoints.length - 1]);
    } else {
      setHoveredPoint(null);
    }
  }, [dataPoints]);

  // Summary KPIs: Current, Best (PR), and Delta %
  const stats = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const values = dataPoints.map((d) => d.value);
    const maxValue = Math.max(...values);
    const latest = dataPoints[dataPoints.length - 1];
    const initial = dataPoints[0];

    let deltaPct = 0;
    if (initial.value > 0 && dataPoints.length > 1) {
      deltaPct = Math.round(((latest.value - initial.value) / initial.value) * 100);
    }

    return {
      current: latest.displayValue,
      best: maxValue,
      deltaPct,
      hasProgressed: deltaPct > 0,
      sessionCount: dataPoints.length,
    };
  }, [dataPoints]);

  // SVG Chart Layout Metrics
  const chartWidth = 600;
  const chartHeight = 240;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const { minY, maxY, pointsWithCoords } = useMemo(() => {
    if (dataPoints.length === 0) {
      return { minY: 0, maxY: 100, pointsWithCoords: [] };
    }

    const values = dataPoints.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    let calcMin = Math.max(0, Math.floor(rawMin * 0.9));
    let calcMax = Math.ceil(rawMax * 1.1);

    if (calcMin === calcMax) {
      calcMin = Math.max(0, calcMin - 10);
      calcMax = calcMax + 10;
    }

    // Coordinates mapping
    const coords = dataPoints.map((point, index) => {
      let x = padLeft + innerWidth / 2;
      if (dataPoints.length > 1) {
        x = padLeft + (index / (dataPoints.length - 1)) * innerWidth;
      }

      const yRatio = (point.value - calcMin) / (calcMax - calcMin || 1);
      const y = chartHeight - padBottom - yRatio * innerHeight;

      return {
        ...point,
        x,
        y,
      };
    });

    return { minY: calcMin, maxY: calcMax, pointsWithCoords: coords };
  }, [dataPoints, innerWidth, innerHeight, padLeft, padBottom, chartHeight]);

  // Generate SVG path for line and gradient area
  const { linePath, areaPath } = useMemo(() => {
    if (pointsWithCoords.length === 0) return { linePath: '', areaPath: '' };

    if (pointsWithCoords.length === 1) {
      const p = pointsWithCoords[0];
      const startX = p.x - 20;
      const endX = p.x + 20;
      const lPath = `M ${startX} ${p.y} L ${endX} ${p.y}`;
      const aPath = `M ${startX} ${p.y} L ${endX} ${p.y} L ${endX} ${chartHeight - padBottom} L ${startX} ${chartHeight - padBottom} Z`;
      return { linePath: lPath, areaPath: aPath };
    }

    const first = pointsWithCoords[0];
    let lPath = `M ${first.x} ${first.y}`;

    // Smooth cubic bezier curves between points
    for (let i = 0; i < pointsWithCoords.length - 1; i++) {
      const p0 = pointsWithCoords[i];
      const p1 = pointsWithCoords[i + 1];
      const midX = (p0.x + p1.x) / 2;
      lPath += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const aPath = `${lPath} L ${last.x} ${chartHeight - padBottom} L ${first.x} ${chartHeight - padBottom} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [pointsWithCoords, chartHeight, padBottom]);

  // Calculate 4 clean tick marks for Y-axis
  const yTicks = useMemo(() => {
    const ticksCount = 4;
    const step = (maxY - minY) / (ticksCount - 1);
    const ticks: { value: number; y: number }[] = [];

    for (let i = 0; i < ticksCount; i++) {
      const val = Math.round(minY + step * i);
      const yRatio = (val - minY) / (maxY - minY || 1);
      const y = chartHeight - padBottom - yRatio * innerHeight;
      ticks.push({ value: val, y });
    }

    return ticks;
  }, [minY, maxY, innerHeight, padBottom, chartHeight]);

  const activeExerciseName =
    availableExercises.find((ex) => ex.id === selectedExercise)?.name || 'Selected Exercise';

  return (
    <Card
      className="glass-card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        ...style,
      }}
    >
      {/* Top Header & Exercise Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div>
            <Typography variant="h3" style={{ fontSize: '17px', lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="var(--text-muted)">
              {getModeYAxisLabel(activeMode, unit)}
            </Typography>
          </div>
        </div>

        {/* Exercise Dropdown Selector */}
        <div style={{ position: 'relative', minWidth: '180px', flex: '1 1 auto', maxWidth: '260px' }}>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            disabled={availableExercises.length === 0}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: availableExercises.length === 0 ? 'not-allowed' : 'pointer',
              outline: 'none',
              appearance: 'auto',
            }}
          >
            {availableExercises.length === 0 ? (
              <option value="">No exercises recorded</option>
            ) : (
              availableExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.sessionCount} session{ex.sessionCount !== 1 ? 's' : ''})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* 3-State Mode Toggle Segmented Control */}
      <div
        role="tablist"
        aria-label="Progressive Overload Calculation Modes"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          backgroundColor: 'var(--bg-main)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          gap: '4px',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'e1rm'}
          onClick={() => setActiveMode('e1rm')}
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: activeMode === 'e1rm' ? 'var(--primary)' : 'transparent',
            color: activeMode === 'e1rm' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeMode === 'e1rm' ? '0 2px 8px var(--primary-glow)' : 'none',
          }}
        >
          Estimated 1RM
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'topSet'}
          onClick={() => setActiveMode('topSet')}
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: activeMode === 'topSet' ? 'var(--primary)' : 'transparent',
            color: activeMode === 'topSet' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeMode === 'topSet' ? '0 2px 8px var(--primary-glow)' : 'none',
          }}
        >
          Top Set Load
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'volume'}
          onClick={() => setActiveMode('volume')}
          style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: activeMode === 'volume' ? 'var(--primary)' : 'transparent',
            color: activeMode === 'volume' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: activeMode === 'volume' ? '0 2px 8px var(--primary-glow)' : 'none',
          }}
        >
          Total Volume
        </button>
      </div>

      {/* Time Range Interval Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            color="var(--text-muted)"
            style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Time Window
          </Typography>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {dataPoints.length} session{dataPoints.length !== 1 ? 's' : ''} in view
          </span>
        </div>

        <div
          role="group"
          aria-label="Filter chart by time range"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            backgroundColor: 'var(--bg-main)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            gap: '3px',
          }}
        >
          {TIME_RANGE_OPTIONS.map((opt) => {
            const isSelected = timeRange === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTimeRange(opt.key)}
                title={opt.label}
                style={{
                  padding: '6px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div>
            <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
              Latest Value
            </Typography>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {stats.current}
            </div>
          </div>

          <div>
            <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
              All-Time Peak
            </Typography>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--accent)',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Award size={14} />
              {stats.best.toLocaleString()} {unit}
            </div>
          </div>

          <div>
            <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
              Net Overload
            </Typography>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: stats.deltaPct >= 0 ? 'var(--success)' : 'var(--danger)',
                marginTop: '2px',
              }}
            >
              {stats.sessionCount <= 1
                ? 'Base Log'
                : `${stats.deltaPct >= 0 ? '+' : ''}${stats.deltaPct}%`}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Line Chart Area */}
      {pointsWithCoords.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '220px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            padding: '24px',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <Dumbbell size={36} color="var(--text-subtle)" />
          <Typography variant="h3" style={{ fontSize: '15px' }}>
            No Data in Selected Interval
          </Typography>
          <Typography variant="caption" color="var(--text-muted)" style={{ maxWidth: '320px' }}>
            {availableExercises.length === 0
              ? 'Complete a workout session containing sets for this exercise to generate overload analytics.'
              : `No recorded history for "${activeExerciseName}" within ${
                  TIME_RANGE_OPTIONS.find((o) => o.key === timeRange)?.label.toLowerCase() || 'this range'
                }.`}
          </Typography>
          {timeRange !== 'all' && (
            <Button size="sm" variant="secondary" onClick={() => setTimeRange('all')} style={{ marginTop: '4px' }}>
              Show All Time
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            backgroundColor: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '12px 8px 8px 8px',
            overflow: 'hidden',
          }}
        >
          {/* Y-Axis Label Badge */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '12px',
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {getModeYAxisLabel(activeMode, unit)}
            </span>
          </div>

          {/* SVG Canvas */}
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <defs>
              {/* Gradient fill beneath line */}
              <linearGradient id="overloadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="80%" stopColor="#6366f1" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>

              {/* Point glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y-axis tick values */}
            {yTicks.map((tick, idx) => (
              <g key={`ytick-${idx}`}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={chartWidth - padRight}
                  y2={tick.y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={tick.y + 4}
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="var(--font-body)"
                  textAnchor="end"
                >
                  {tick.value.toLocaleString()}
                </text>
              </g>
            ))}

            {/* Area under the line */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#overloadGradient)"
                style={{ transition: 'd 0.3s ease-out' }}
              />
            )}

            {/* Main Progression Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'd 0.3s ease-out',
                  filter: 'drop-shadow(0px 2px 8px rgba(99, 102, 241, 0.5))',
                }}
              />
            )}

            {/* X-Axis Baseline */}
            <line
              x1={padLeft}
              y1={chartHeight - padBottom}
              x2={chartWidth - padRight}
              y2={chartHeight - padBottom}
              stroke="var(--border-color)"
              strokeWidth="1"
            />

            {/* Active Crosshair Line on hovered point */}
            {hoveredPoint && (
              (() => {
                const targetCoord = pointsWithCoords.find((p) => p.id === hoveredPoint.id);
                if (!targetCoord) return null;
                return (
                  <line
                    x1={targetCoord.x}
                    y1={padTop}
                    x2={targetCoord.x}
                    y2={chartHeight - padBottom}
                    stroke="rgba(99, 102, 241, 0.45)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                );
              })()
            )}

            {/* Data Points and X-Axis Date Labels */}
            {pointsWithCoords.map((point, index) => {
              const isHovered = hoveredPoint?.id === point.id;
              // Determine if we should display the date label below this point
              const shouldShowDate =
                pointsWithCoords.length <= 6 ||
                index === 0 ||
                index === pointsWithCoords.length - 1 ||
                index === Math.floor(pointsWithCoords.length / 2);

              return (
                <g key={point.id}>
                  {/* X-Axis Date Label */}
                  {shouldShowDate && (
                    <text
                      x={point.x}
                      y={chartHeight - padBottom + 18}
                      fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                      fontSize="10"
                      fontFamily="var(--font-body)"
                      textAnchor="middle"
                      fontWeight={isHovered ? 700 : 500}
                    >
                      {point.dateFormatted}
                    </text>
                  )}

                  {/* Pulsing halo around active/hovered point */}
                  {isHovered && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      fill="rgba(99, 102, 241, 0.25)"
                      filter="url(#glow)"
                    />
                  )}

                  {/* Visible data point circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 6 : 4.5}
                    fill={isHovered ? '#ffffff' : 'var(--primary)'}
                    stroke="#0f172a"
                    strokeWidth={isHovered ? 2.5 : 2}
                    style={{
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  />

                  {/* Large invisible tap/hover target (mobile friendly) */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="20"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onClick={() => setHoveredPoint(point)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Interactive Tooltip Card */}
      {hoveredPoint && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header: Date + Mode Metric */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} color="var(--text-muted)" />
              <Typography variant="caption" color="var(--text-secondary)" style={{ fontWeight: 600 }}>
                {hoveredPoint.date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Typography>
            </div>

            <Badge variant="primary" style={{ fontSize: '12px', padding: '3px 8px' }}>
              {hoveredPoint.displayValue}
            </Badge>
          </div>

          {/* Breakdown summary of all sets */}
          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              lineHeight: 1.4,
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginRight: '6px' }}>
              Sets Breakdown:
            </span>
            <span>{hoveredPoint.allSetsSummary}</span>
          </div>
        </div>
      )}
    </Card>
  );
};
