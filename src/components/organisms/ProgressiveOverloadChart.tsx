import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { Combobox } from '../atoms/Combobox';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { TrendingUp, Award, Activity, Calendar, Dumbbell, Sparkles, ArrowLeft, X } from 'lucide-react';

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
  /**
   * Optional close modal callback
   */
  onClose?: () => void;
}

export const ProgressiveOverloadChart: React.FC<ProgressiveOverloadChartProps> = ({
  records = [],
  defaultExerciseId,
  defaultTimeRange = 'all',
  unit = 'lb',
  title,
  style,
  onClose,
}) => {
  const { language } = useSettingsStore();
  const [activeMode, setActiveMode] = useState<ProgressionMode>('e1rm');
  const [timeRange, setTimeRange] = useState<TimeRangeInterval>(defaultTimeRange);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [hoveredPoint, setHoveredPoint] = useState<ProcessedDataPoint | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [modalHoveredPoint, setModalHoveredPoint] = useState<ProcessedDataPoint | null>(null);

  useEffect(() => {
    if (!isZoomModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomModalOpen(false);
        setModalHoveredPoint(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomModalOpen]);

  const displayTitle = title || (language === 'es' ? 'Seguimiento de Sobrecarga Progresiva' : 'Progressive Overload Tracker');


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

  // Derive exercise type for the selected exercise (used in labels and mode tabs)
  const selectedExerciseMeta = useMemo(
    () => getAvailableExercises(records).find((ex) => ex.id === selectedExercise),
    [records, selectedExercise]
  );
  const isTimeBasedExercise = selectedExerciseMeta?.exerciseType === 'time_based';
  const activeExerciseName = selectedExerciseMeta?.name || 'Selected Exercise';

  // Render SVG Line Graph (shared between compact card and zoomed modal)
  const renderSvgChart = (zoomed: boolean) => {
    const chartWidth = zoomed ? 960 : 600;
    const chartHeight = zoomed ? 780 : 240;
    const padLeft = zoomed ? 50 : 54;
    const padRight = zoomed ? 20 : 24;
    const padTop = zoomed ? 26 : 24;
    const padBottom = zoomed ? 42 : 38;

    const innerWidth = chartWidth - padLeft - padRight;
    const innerHeight = chartHeight - padTop - padBottom;

    const values = dataPoints.map((p) => p.value);
    const rawMin = values.length > 0 ? Math.min(...values) : 0;
    const rawMax = values.length > 0 ? Math.max(...values) : 100;

    let calcMin = Math.max(0, Math.floor(rawMin * 0.9));
    let calcMax = Math.ceil(rawMax * 1.1);

    if (calcMin === calcMax) {
      calcMin = Math.max(0, calcMin - 10);
      calcMax = calcMax + 10;
    }

    const layoutPoints = dataPoints.map((point, index) => {
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

    let linePath = '';
    let areaPath = '';
    if (layoutPoints.length === 1) {
      const p = layoutPoints[0];
      const startX = p.x - 20;
      const endX = p.x + 20;
      linePath = `M ${startX} ${p.y} L ${endX} ${p.y}`;
      areaPath = `M ${startX} ${p.y} L ${endX} ${p.y} L ${endX} ${chartHeight - padBottom} L ${startX} ${chartHeight - padBottom} Z`;
    } else if (layoutPoints.length > 1) {
      const first = layoutPoints[0];
      linePath = `M ${first.x} ${first.y}`;

      for (let i = 0; i < layoutPoints.length - 1; i++) {
        const p0 = layoutPoints[i];
        const p1 = layoutPoints[i + 1];
        const midX = (p0.x + p1.x) / 2;
        linePath += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      const last = layoutPoints[layoutPoints.length - 1];
      areaPath = `${linePath} L ${last.x} ${chartHeight - padBottom} L ${first.x} ${chartHeight - padBottom} Z`;
    }

    const ticksCount = zoomed ? 6 : 4;
    const step = (calcMax - calcMin) / (ticksCount - 1);
    const yTicks: { value: number; y: number }[] = [];

    for (let i = 0; i < ticksCount; i++) {
      const val = Math.round(calcMin + step * i);
      const yRatio = (val - calcMin) / (calcMax - calcMin || 1);
      const y = chartHeight - padBottom - yRatio * innerHeight;
      yTicks.push({ value: val, y });
    }

    const activePoint = zoomed ? (modalHoveredPoint || dataPoints[dataPoints.length - 1]) : hoveredPoint;
    const gradId = zoomed ? 'overloadGradientZoom' : 'overloadGradient';
    const glowId = zoomed ? 'glowZoom' : 'glow';

    return (
      <div
        style={{
          position: 'relative',
          backgroundColor: zoomed ? 'transparent' : 'var(--bg-main)',
          borderRadius: zoomed ? '0' : 'var(--radius-md)',
          border: zoomed ? 'none' : '1px solid var(--border-color)',
          padding: zoomed ? '0' : '12px 8px 8px 8px',
          overflow: 'hidden',
          width: '100%',
          cursor: !zoomed ? 'zoom-in' : 'default',
        }}
        title={!zoomed ? (language === 'es' ? 'Toca para ampliar el gráfico' : 'Tap to zoom graph') : undefined}
        onClick={() => {
          if (!zoomed) {
            setIsZoomModalOpen(true);
            setModalHoveredPoint(hoveredPoint || dataPoints[dataPoints.length - 1]);
          }
        }}
      >
        {/* Y-Axis Label Badge */}
        <div
          style={{
            position: 'absolute',
            top: zoomed ? '6px' : '8px',
            left: zoomed ? '8px' : '12px',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: zoomed ? '11px' : '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {getModeYAxisLabel(activeMode, unit, isTimeBasedExercise ? 'time_based' : 'weight_reps')}
          </span>
        </div>

        {/* SVG Canvas */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: zoomed ? '78dvh' : undefined,
            display: 'block',
            overflow: 'visible',
            cursor: !zoomed ? 'zoom-in' : 'default',
          }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="80%" stopColor="var(--primary)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>

            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
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
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                fill="var(--text-muted)"
                fontSize={zoomed ? '13' : '11'}
                fontWeight="700"
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
              fill={`url(#${gradId})`}
              style={{ transition: 'd 0.3s ease-out' }}
            />
          )}

          {/* Main Progression Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={zoomed ? '4' : '3.5'}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'd 0.3s ease-out',
                filter: 'drop-shadow(0px 2px 8px var(--primary-glow))',
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
          {activePoint && (
            (() => {
              const targetCoord = layoutPoints.find((p) => p.id === activePoint.id);
              if (!targetCoord) return null;
              return (
                <line
                  x1={targetCoord.x}
                  y1={padTop}
                  x2={targetCoord.x}
                  y2={chartHeight - padBottom}
                  stroke="var(--primary)"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              );
            })()
          )}

          {/* Data Points and X-Axis Date Labels */}
          {layoutPoints.map((point, index) => {
            const isHovered = activePoint?.id === point.id;
            const shouldShowDate = zoomed
              ? (index === 0 || index === layoutPoints.length - 1 || layoutPoints.length <= 8 || index === Math.floor(layoutPoints.length * 0.25) || index === Math.floor(layoutPoints.length * 0.5) || index === Math.floor(layoutPoints.length * 0.75))
              : (layoutPoints.length <= 6 || index === 0 || index === layoutPoints.length - 1 || index === Math.floor(layoutPoints.length / 2));

            return (
              <g key={point.id}>
                {shouldShowDate && (
                  <text
                    x={point.x}
                    y={chartHeight - padBottom + (zoomed ? 22 : 18)}
                    fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontSize={zoomed ? '13' : '10'}
                    fontFamily="var(--font-body)"
                    textAnchor="middle"
                    fontWeight={isHovered ? 700 : 500}
                  >
                    {point.dateFormatted}
                  </text>
                )}

                {isHovered && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={zoomed ? '14' : '12'}
                    fill="var(--primary-subtle)"
                    filter={`url(#${glowId})`}
                  />
                )}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? (zoomed ? 8 : 6) : (zoomed ? 5.5 : 4.5)}
                  fill={isHovered ? '#ffffff' : 'var(--primary)'}
                  stroke="#0f172a"
                  strokeWidth={isHovered ? 2.5 : 2}
                  style={{
                    transition: 'all 0.15s ease',
                    cursor: !zoomed ? 'zoom-in' : 'pointer',
                  }}
                />

                {/* Large invisible tap/hover target */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={zoomed ? '26' : '20'}
                  fill="transparent"
                  style={{ cursor: !zoomed ? 'zoom-in' : 'pointer' }}
                  onMouseEnter={() => {
                    if (zoomed) setModalHoveredPoint(point);
                    else setHoveredPoint(point);
                  }}
                  onClick={(e) => {
                    if (!zoomed) {
                      setIsZoomModalOpen(true);
                      setHoveredPoint(point);
                      setModalHoveredPoint(point);
                    } else {
                      e.stopPropagation();
                      setModalHoveredPoint(point);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

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
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                title="Go back"
                aria-label="Go back"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <TrendingUp size={18} />
              </div>
            )}
            <div>
              <Typography variant="h3" style={{ fontSize: '17px', lineHeight: 1.2 }}>
                {displayTitle}
              </Typography>
              <Typography variant="caption" color="var(--text-muted)">
                {getModeYAxisLabel(activeMode, unit, isTimeBasedExercise ? 'time_based' : 'weight_reps')}
              </Typography>
            </div>
          </div>

          {/* Exercise Combobox Selector */}
          <div style={{ position: 'relative', minWidth: '180px', flex: '1 1 auto', maxWidth: '280px' }}>
            <Combobox
              options={availableExercises.map((ex) => ({
                value: ex.id,
                label: `${ex.exerciseType === 'time_based' ? '⏱️ ' : ''}${ex.name}`,
                subLabel: `${ex.sessionCount} ${language === 'es' ? 'sesiones' : 'sessions'}`,
              }))}
              value={selectedExercise}
              onChange={(val) => setSelectedExercise(val)}
              placeholder={language === 'es' ? 'Selecciona un ejercicio...' : 'Select an exercise...'}
              disabled={availableExercises.length === 0}
              size="md"
            />
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
            {isTimeBasedExercise ? (language === 'es' ? 'Hold Máximo' : 'Max Hold') : t('estimated_1rm', language)}
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
            {isTimeBasedExercise ? (language === 'es' ? 'Mayor Serie' : 'Peak Set') : t('top_set_load', language)}
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
            {isTimeBasedExercise ? (language === 'es' ? 'Tiempo Total' : 'Total Time') : t('total_volume', language)}
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
            {language === 'es' ? 'Ventana de Tiempo' : 'Time Window'}
          </Typography>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
            {language === 'es'
              ? `${dataPoints.length} sesión(es) en vista`
              : `${dataPoints.length} session${dataPoints.length !== 1 ? 's' : ''} in view`}
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
              {language === 'es' ? 'Último Valor' : 'Latest Value'}
            </Typography>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {stats.current}
            </div>
          </div>

          <div>
            <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
              {language === 'es' ? 'Récord Histórico' : 'All-Time Peak'}
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
              {isTimeBasedExercise
                ? `${stats.best} min`
                : `${stats.best.toLocaleString()} ${unit}`}
            </div>
          </div>

          <div>
            <Typography variant="caption" color="var(--text-muted)" style={{ fontSize: '11px' }}>
              {language === 'es' ? 'Sobrecarga Neta' : 'Net Overload'}
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
                ? (language === 'es' ? 'Base Inicial' : 'Base Log')
                : `${stats.deltaPct >= 0 ? '+' : ''}${stats.deltaPct}%`}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Line Chart Area */}
      {dataPoints.length === 0 ? (
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
            {language === 'es' ? 'Sin Datos en el Intervalo Seleccionado' : 'No Data in Selected Interval'}
          </Typography>
          <Typography variant="caption" color="var(--text-muted)" style={{ maxWidth: '320px' }}>
            {availableExercises.length === 0
              ? (language === 'es'
                  ? 'Completa una sesión de entrenamiento con series para este ejercicio para generar métricas de sobrecarga.'
                  : 'Complete a workout session containing sets for this exercise to generate overload analytics.')
              : (language === 'es'
                  ? `Sin historial registrado para "${activeExerciseName}" dentro de este intervalo.`
                  : `No recorded history for "${activeExerciseName}" within ${
                      TIME_RANGE_OPTIONS.find((o) => o.key === timeRange)?.label.toLowerCase() || 'this range'
                    }.`)}
          </Typography>
          {timeRange !== 'all' && (
            <Button size="sm" variant="secondary" onClick={() => setTimeRange('all')} style={{ marginTop: '4px' }}>
              {language === 'es' ? 'Mostrar Todo el Historial' : 'Show All Time'}
            </Button>
          )}
        </div>
      ) : (
        renderSvgChart(false)
      )}

      {/* Subtle Hint indicating the graph is interactive */}
      {dataPoints.length > 0 && (
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

      {/* Interactive Tooltip Card */}
      {hoveredPoint && (
        <div
          className="animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--primary-subtle-border)',
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
      {/* Fullscreen Zoom Modal (ZOOM VERSION OF THE EXERCISE GRAPH) */}
      {isZoomModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-portal-backdrop animate-fade-in"
          onClick={() => {
            setIsZoomModalOpen(false);
            setModalHoveredPoint(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <div
            className="modal-portal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg, 12px)',
              width: '100%',
              maxWidth: '1120px',
              maxHeight: '96dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
              animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-elevated)',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <TrendingUp size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <Typography variant="h3" style={{ fontSize: '17px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeExerciseName}
                </Typography>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsZoomModalOpen(false);
                  setModalHoveredPoint(null);
                }}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px', flexShrink: 0 }}
                title={t('close', language)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body - Zoomed Graph ONLY */}
            <div
              style={{
                padding: '10px 8px 14px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <div style={{ width: '100%' }}>
                {renderSvgChart(true)}
              </div>

              {/* Point Details Pill in Modal */}
              {(() => {
                const currentPt = modalHoveredPoint || dataPoints[dataPoints.length - 1];
                if (!currentPt) return null;

                return (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md, 8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      maxWidth: '920px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentPt.date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '14px' }}>
                        {currentPt.displayValue}
                      </span>
                      {currentPt.subValue && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({currentPt.subValue})
                        </span>
                      )}
                    </div>

                    {currentPt.allSetsSummary && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Dumbbell size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{currentPt.allSetsSummary}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </Card>
  );
};
