import React, { useState, useMemo, useRef } from 'react';
import { BodyMetricLog, WeightUnit } from '../../types';
import { convertWeight } from '../../utils/unitConversion';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { TrendingDown, TrendingUp, Scale, Percent, Calendar, CheckSquare, Square } from 'lucide-react';

export interface BodyMetricsChartProps {
  logs: BodyMetricLog[];
  heightCm?: number | null;
  onAddLogClick?: () => void;
}

type TimeFilter = 'all' | '1m' | '3m' | '6m' | '1y';
type ViewMetricMode = 'weight' | 'fat' | 'both';

export const BodyMetricsChart: React.FC<BodyMetricsChartProps> = ({
  logs,
  heightCm,
  onAddLogClick,
}) => {
  const { unit, language } = useSettingsStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMetricMode>('weight');
  const [showLabels, setShowLabels] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Filter logs by selected time window
  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (timeFilter === 'all') return sorted;

    const now = new Date().getTime();
    const daysMap: Record<TimeFilter, number> = {
      all: Infinity,
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };
    const cutoffTime = now - (daysMap[timeFilter] * 24 * 60 * 60 * 1000);
    const filtered = sorted.filter((item) => new Date(item.date).getTime() >= cutoffTime);
    return filtered.length > 0 ? filtered : sorted.slice(-10); // fallback if none in window
  }, [logs, timeFilter]);

  // 2. Normalized data points with current weight unit
  const normalizedData = useMemo(() => {
    return filteredLogs.map((log) => {
      const displayWeight = log.unit === unit
        ? log.weight
        : Math.round(convertWeight(log.weight, log.unit, unit) * 10) / 10;
      return {
        id: log.id,
        date: log.date,
        weight: displayWeight,
        fat: log.bodyFatPercentage != null ? log.bodyFatPercentage : null,
        notes: log.notes,
      };
    });
  }, [filteredLogs, unit]);

  // Check if we have fat data available
  const hasFatData = useMemo(() => {
    return normalizedData.some((d) => d.fat !== null && d.fat !== undefined);
  }, [normalizedData]);

  // 3. Coordinate bounds with ample left margin for large numbers
  const svgWidth = 640;
  const svgHeight = 300;
  const padding = { top: 32, right: 35, bottom: 44, left: 58 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Y-axis for Weight
  const weightValues = normalizedData.map((d) => d.weight);
  const minWeightRaw = weightValues.length > 0 ? Math.min(...weightValues) : 0;
  const maxWeightRaw = weightValues.length > 0 ? Math.max(...weightValues) : 100;
  const weightSpan = Math.max(maxWeightRaw - minWeightRaw, 2);
  const yWeightMin = Math.max(0, Math.floor(minWeightRaw - weightSpan * 0.18));
  const yWeightMax = Math.ceil(maxWeightRaw + weightSpan * 0.18);

  // Y-axis for Body Fat % (0 - 40 range approx)
  const fatValues = normalizedData.map((d) => d.fat).filter((v): v is number => v !== null);
  const minFatRaw = fatValues.length > 0 ? Math.min(...fatValues) : 10;
  const maxFatRaw = fatValues.length > 0 ? Math.max(...fatValues) : 30;
  const fatSpan = Math.max(maxFatRaw - minFatRaw, 2);
  const yFatMin = Math.max(0, Math.floor(minFatRaw - fatSpan * 0.18));
  const yFatMax = Math.ceil(maxFatRaw + fatSpan * 0.18);

  // Coordinate scales
  const getX = (index: number) => {
    if (normalizedData.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (normalizedData.length - 1)) * plotWidth;
  };

  const getYWeight = (val: number) => {
    const range = yWeightMax - yWeightMin || 1;
    return padding.top + plotHeight - ((val - yWeightMin) / range) * plotHeight;
  };

  const getYFat = (val: number) => {
    const range = yFatMax - yFatMin || 1;
    return padding.top + plotHeight - ((val - yFatMin) / range) * plotHeight;
  };

  // Build SVG Path strings
  const weightPath = useMemo(() => {
    if (normalizedData.length === 0) return '';
    return normalizedData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getYWeight(d.weight).toFixed(1)}`)
      .join(' ');
  }, [normalizedData, yWeightMin, yWeightMax]);

  const weightAreaPath = useMemo(() => {
    if (normalizedData.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    const firstX = getX(0).toFixed(1);
    const lastX = getX(normalizedData.length - 1).toFixed(1);
    return `${weightPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [weightPath, normalizedData]);

  const fatPath = useMemo(() => {
    const pointsWithFat: Array<{ x: number; y: number }> = [];
    normalizedData.forEach((d, i) => {
      if (d.fat !== null) {
        pointsWithFat.push({ x: getX(i), y: getYFat(d.fat) });
      }
    });
    if (pointsWithFat.length === 0) return '';
    return pointsWithFat
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');
  }, [normalizedData, yFatMin, yFatMax]);

  // Format date helper
  const formatDateLabel = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate trends
  const firstEntry = normalizedData[0];
  const lastEntry = normalizedData[normalizedData.length - 1];
  const weightDiff = lastEntry && firstEntry ? Math.round((lastEntry.weight - firstEntry.weight) * 10) / 10 : 0;

  if (normalizedData.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <Scale size={36} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px auto' }} />
        <Typography variant="h3" style={{ marginBottom: '6px' }}>
          {t('no_metrics_logged', language)}
        </Typography>
        <Typography variant="caption" color="secondary" style={{ marginBottom: '16px', display: 'block' }}>
          {t('log_first_weight', language)}
        </Typography>
        {onAddLogClick && (
          <button type="button" className="btn btn-primary" onClick={onAddLogClick}>
            {t('log_weight', language)}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '16px' }} ref={containerRef}>
      {/* Header controls: Metric toggle & Range filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        {/* Metric Selector Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${viewMode === 'weight' ? 'active' : ''}`}
            onClick={() => setViewMode('weight')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: viewMode === 'weight' ? 600 : 400,
              background: viewMode === 'weight' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'weight' ? '#fff' : 'var(--text-secondary)',
              borderRadius: '6px',
            }}
          >
            <Scale size={13} style={{ marginRight: '4px' }} />
            {t('metric_view_weight', language)} ({unit.toUpperCase()})
          </button>

          {hasFatData && (
            <>
              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'fat' ? 'active' : ''}`}
                onClick={() => setViewMode('fat')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: viewMode === 'fat' ? 600 : 400,
                  background: viewMode === 'fat' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'fat' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '6px',
                }}
              >
                <Percent size={13} style={{ marginRight: '4px' }} />
                {t('metric_view_fat', language)}
              </button>

              <button
                type="button"
                className={`btn btn-ghost btn-sm ${viewMode === 'both' ? 'active' : ''}`}
                onClick={() => setViewMode('both')}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: viewMode === 'both' ? 600 : 400,
                  background: viewMode === 'both' ? 'var(--bg-elevated)' : 'transparent',
                  color: viewMode === 'both' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderRadius: '6px',
                }}
              >
                {t('metric_view_both', language)}
              </button>
            </>
          )}
        </div>

        {/* Time Window Filters & Toggle Labels Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['1m', '3m', '6m', '1y', 'all'] as TimeFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTimeFilter(f)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: timeFilter === f ? 700 : 500,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: timeFilter === f ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  background: timeFilter === f ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: timeFilter === f ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? t('filter_all', language) : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Toggle Labels Checkbox */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              border: `1px solid ${showLabels ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
              background: showLabels ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
              color: showLabels ? '#60a5fa' : 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title={language === 'es' ? 'Mostrar/Ocultar valores en los puntos' : 'Toggle point value labels'}
          >
            {showLabels ? (
              <CheckSquare size={13} style={{ color: 'var(--primary)' }} />
            ) : (
              <Square size={13} style={{ color: 'var(--text-muted)' }} />
            )}
            <span>{language === 'es' ? 'Valores' : 'Labels'}</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fatAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + plotHeight * ratio;
            const wVal = Math.round(yWeightMax - (yWeightMax - yWeightMin) * ratio);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                {(viewMode === 'weight' || viewMode === 'both') && (
                  <text
                    x={padding.left - 12}
                    y={y + 5}
                    textAnchor="end"
                    fill="#cbd5e1"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {wVal}
                  </text>
                )}
                {(viewMode === 'fat' || viewMode === 'both') && hasFatData && (
                  <text
                    x={padding.left + plotWidth + 10}
                    y={y + 5}
                    textAnchor="start"
                    fill="#f472b6"
                    fontSize="13"
                    fontWeight="700"
                  >
                    {Math.round(yFatMax - (yFatMax - yFatMin) * ratio)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Area under weight curve */}
          {(viewMode === 'weight' || viewMode === 'both') && weightAreaPath && (
            <path d={weightAreaPath} fill="url(#weightAreaGrad)" />
          )}

          {/* Weight line */}
          {(viewMode === 'weight' || viewMode === 'both') && weightPath && (
            <path
              d={weightPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Fat % line */}
          {(viewMode === 'fat' || viewMode === 'both') && fatPath && (
            <path
              d={fatPath}
              fill="none"
              stroke="#f472b6"
              strokeWidth="3"
              strokeDasharray={viewMode === 'both' ? '5 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points & Point Value Badges */}
          {normalizedData.map((d, i) => {
            const x = getX(i);
            const yW = getYWeight(d.weight);
            const isHovered = hoveredIndex === i;

            return (
              <g key={d.id || i}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + plotHeight}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Point Value Pill Label above dot (toggled by checkmark) */}
                {showLabels && (viewMode === 'weight' || viewMode === 'both') && (
                  <g>
                    <rect
                      x={x - 22}
                      y={yW - 24}
                      width={44}
                      height={18}
                      rx={4}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={yW - 11}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {d.weight}
                    </text>
                  </g>
                )}

                {/* Fat % Point Value Pill Label (when in fat mode) */}
                {showLabels && viewMode === 'fat' && d.fat !== null && (
                  <g>
                    <rect
                      x={x - 22}
                      y={getYFat(d.fat) - 24}
                      width={44}
                      height={18}
                      rx={4}
                      fill="#0f172a"
                      stroke="#f472b6"
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={getYFat(d.fat) - 11}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {d.fat}%
                    </text>
                  </g>
                )}

                {/* Weight dot */}
                {(viewMode === 'weight' || viewMode === 'both') && (
                  <circle
                    cx={x}
                    cy={yW}
                    r={isHovered ? 6 : 4}
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                )}

                {/* Fat dot */}
                {(viewMode === 'fat' || viewMode === 'both') && d.fat !== null && (
                  <circle
                    cx={x}
                    cy={getYFat(d.fat)}
                    r={isHovered ? 6 : 4}
                    fill="#f472b6"
                    stroke="#0f172a"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                )}

                {/* X-axis date labels */}
                {(i === 0 || i === normalizedData.length - 1 || (normalizedData.length > 4 && i === Math.floor(normalizedData.length / 2))) && (
                  <text
                    x={x}
                    y={padding.top + plotHeight + 24}
                    textAnchor={i === 0 ? 'start' : i === normalizedData.length - 1 ? 'end' : 'middle'}
                    fill="#cbd5e1"
                    fontSize="13"
                    fontWeight="600"
                  >
                    {formatDateLabel(d.date)}
                  </text>
                )}

                {/* Transparent hit target for hover/touch */}
                <rect
                  x={x - (plotWidth / (normalizedData.length || 1)) / 2}
                  y={padding.top}
                  width={plotWidth / (normalizedData.length || 1)}
                  height={plotHeight + padding.bottom}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip card */}
      {hoveredIndex !== null && normalizedData[hoveredIndex] && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
            <Typography variant="body" style={{ fontWeight: 600 }}>
              {formatFullDate(normalizedData[hoveredIndex].date)}
            </Typography>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '14px' }}>
              {normalizedData[hoveredIndex].weight} {unit.toUpperCase()}
            </span>

            {normalizedData[hoveredIndex].fat !== null && (
              <span style={{ color: '#ec4899', fontWeight: 700, fontSize: '14px' }}>
                {normalizedData[hoveredIndex].fat}% Fat
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary metric stats chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '10px',
          marginTop: '14px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            {t('starting_weight', language)}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {firstEntry ? `${firstEntry.weight} ${unit.toUpperCase()}` : '--'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            {t('current_weight', language)}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>
            {lastEntry ? `${lastEntry.weight} ${unit.toUpperCase()}` : '--'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            {t('net_change', language)}
          </span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: weightDiff < 0 ? '#22c55e' : weightDiff > 0 ? '#f59e0b' : 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {weightDiff > 0 ? `+${weightDiff}` : weightDiff} {unit.toUpperCase()}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
            {t('lowest', language)} / {t('highest', language)}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {minWeightRaw} / {maxWeightRaw}
          </span>
        </div>
      </div>
    </div>
  );
};
