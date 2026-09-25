import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BodyMetricLog, WeightUnit } from '../../types';
import { convertWeight } from '../../utils/unitConversion';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t } from '../../utils/i18n';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';
import { TrendingDown, TrendingUp, Scale, Calendar, CheckSquare, Square, X, Plus } from 'lucide-react';

export interface BodyMetricsChartProps {
  logs: BodyMetricLog[];
  heightCm?: number | null;
  onAddLogClick?: () => void;
  isZoomed?: boolean;
  onCloseZoom?: () => void;
}

type TimeFilter = 'all' | '1m' | '3m' | '6m' | '1y';
type ViewMetricMode = 'weight' | 'fat' | 'both';

export const BodyMetricsChart: React.FC<BodyMetricsChartProps> = ({
  logs,
  heightCm,
  onAddLogClick,
  isZoomed = false,
  onCloseZoom,
}) => {
  const { unit, language, theme } = useSettingsStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMetricMode>('weight');
  const [showLabels, setShowLabels] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [modalHoveredIndex, setModalHoveredIndex] = useState<number | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isZoomModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomModalOpen(false);
        setModalHoveredIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomModalOpen]);

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

  // Theme-aware indicator colors for high contrast in light mode (contrasting blue / black)
  const isLight = theme === 'light';
  const axisWeightColor = isLight ? '#1d4ed8' : '#cbd5e1'; // contrasting blue in light mode
  const axisFatColor = isLight ? '#be185d' : '#f472b6';    // contrasting dark rose in light mode
  const axisDateColor = isLight ? '#1d4ed8' : '#cbd5e1';   // contrasting blue in light mode
  const gridStrokeColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

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

  // Render SVG Line Graph (shared between compact card and zoomed modal)
  const renderSvgChart = (zoomed: boolean) => {
    const width = zoomed ? 960 : 640;
    const height = zoomed ? 780 : 280;
    const pad = zoomed
      ? { top: 24, right: (hasFatData && (viewMode === 'fat' || viewMode === 'both')) ? 36 : 14, bottom: 38, left: 48 }
      : { top: 28, right: (hasFatData && (viewMode === 'fat' || viewMode === 'both')) ? 38 : 16, bottom: 38, left: 46 };
    const pWidth = width - pad.left - pad.right;
    const pHeight = height - pad.top - pad.bottom;

    const getXCoord = (index: number) => {
      if (normalizedData.length <= 1) return pad.left + pWidth / 2;
      return pad.left + (index / (normalizedData.length - 1)) * pWidth;
    };

    const getYWeightCoord = (val: number) => {
      const range = yWeightMax - yWeightMin || 1;
      return pad.top + pHeight - ((val - yWeightMin) / range) * pHeight;
    };

    const getYFatCoord = (val: number) => {
      const range = yFatMax - yFatMin || 1;
      return pad.top + pHeight - ((val - yFatMin) / range) * pHeight;
    };

    const wPath = normalizedData.length === 0
      ? ''
      : normalizedData
          .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXCoord(i).toFixed(1)} ${getYWeightCoord(d.weight).toFixed(1)}`)
          .join(' ');

    const bottomY = pad.top + pHeight;
    const wAreaPath = normalizedData.length === 0
      ? ''
      : `${wPath} L ${getXCoord(normalizedData.length - 1).toFixed(1)} ${bottomY} L ${getXCoord(0).toFixed(1)} ${bottomY} Z`;

    const pointsWithFat: Array<{ x: number; y: number }> = [];
    normalizedData.forEach((d, i) => {
      if (d.fat !== null) {
        pointsWithFat.push({ x: getXCoord(i), y: getYFatCoord(d.fat) });
      }
    });
    const fPath = pointsWithFat.length === 0
      ? ''
      : pointsWithFat
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(' ');

    const activeHover = zoomed ? modalHoveredIndex : hoveredIndex;
    const gradWId = zoomed ? 'weightAreaGradZoom' : 'weightAreaGrad';
    const gradFId = zoomed ? 'fatAreaGradZoom' : 'fatAreaGrad';

    return (
      <div
        onClick={() => {
          if (!zoomed) {
            setIsZoomModalOpen(true);
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          cursor: !zoomed ? 'zoom-in' : 'default',
        }}
        title={!zoomed ? (language === 'es' ? 'Toca para ampliar el gráfico' : 'Tap/click to zoom into modal') : undefined}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 'auto', maxHeight: zoomed ? '82dvh' : undefined, display: 'block' }}
        >
          <defs>
            <linearGradient id={gradWId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={gradFId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = pad.top + pHeight * ratio;
            const wVal = Math.round(yWeightMax - (yWeightMax - yWeightMin) * ratio);
            return (
              <g key={idx}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={pad.left + pWidth}
                  y2={y}
                  stroke={gridStrokeColor}
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                {(viewMode === 'weight' || viewMode === 'both') && (
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill={axisWeightColor}
                    fontSize={zoomed ? '13' : '12'}
                    fontWeight="700"
                  >
                    {wVal}
                  </text>
                )}
                {(viewMode === 'fat' || viewMode === 'both') && hasFatData && (
                  <text
                    x={pad.left + pWidth + 8}
                    y={y + 4}
                    textAnchor="start"
                    fill={axisFatColor}
                    fontSize={zoomed ? '13' : '12'}
                    fontWeight="700"
                  >
                    {Math.round(yFatMax - (yFatMax - yFatMin) * ratio)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Area under weight curve */}
          {(viewMode === 'weight' || viewMode === 'both') && wAreaPath && (
            <path d={wAreaPath} fill={`url(#${gradWId})`} />
          )}

          {/* Weight line */}
          {(viewMode === 'weight' || viewMode === 'both') && wPath && (
            <path
              d={wPath}
              fill="none"
              stroke={isLight ? '#2563eb' : '#38bdf8'}
              strokeWidth={zoomed ? '3.5' : '3'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Fat % line */}
          {(viewMode === 'fat' || viewMode === 'both') && fPath && (
            <path
              d={fPath}
              fill="none"
              stroke={isLight ? '#db2777' : '#f472b6'}
              strokeWidth={zoomed ? '3.5' : '3'}
              strokeDasharray={viewMode === 'both' ? '6 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points & Point Value Badges */}
          {normalizedData.map((d, i) => {
            const x = getXCoord(i);
            const yW = getYWeightCoord(d.weight);
            const isHovered = activeHover === i;

            return (
              <g key={d.id || i}>
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={pad.top}
                    x2={x}
                    y2={pad.top + pHeight}
                    stroke={isLight ? '#2563eb' : '#38bdf8'}
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
                      fill={isLight ? '#ffffff' : '#0f172a'}
                      stroke={isLight ? '#2563eb' : '#38bdf8'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={yW - 11}
                      textAnchor="middle"
                      fill={isLight ? '#1d4ed8' : '#f8fafc'}
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
                      y={getYFatCoord(d.fat) - 24}
                      width={44}
                      height={18}
                      rx={4}
                      fill={isLight ? '#ffffff' : '#0f172a'}
                      stroke={isLight ? '#db2777' : '#f472b6'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={x}
                      y={getYFatCoord(d.fat) - 11}
                      textAnchor="middle"
                      fill={isLight ? '#be185d' : '#f8fafc'}
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
                    r={isHovered ? (zoomed ? 7 : 6) : (zoomed ? 5 : 4)}
                    fill={isLight ? '#2563eb' : '#38bdf8'}
                    stroke={isLight ? '#ffffff' : '#0f172a'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                )}

                {/* Fat dot */}
                {(viewMode === 'fat' || viewMode === 'both') && d.fat !== null && (
                  <circle
                    cx={x}
                    cy={getYFatCoord(d.fat)}
                    r={isHovered ? (zoomed ? 7 : 6) : (zoomed ? 5 : 4)}
                    fill={isLight ? '#db2777' : '#f472b6'}
                    stroke={isLight ? '#ffffff' : '#0f172a'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                )}

                {/* X-axis date labels */}
                {((!zoomed && (i === 0 || i === normalizedData.length - 1 || (normalizedData.length > 4 && i === Math.floor(normalizedData.length / 2)))) ||
                  (zoomed && (
                    i === 0 ||
                    i === normalizedData.length - 1 ||
                    normalizedData.length <= 8 ||
                    i === Math.floor(normalizedData.length * 0.25) ||
                    i === Math.floor(normalizedData.length * 0.5) ||
                    i === Math.floor(normalizedData.length * 0.75)
                  ))) && (
                  <text
                    x={x}
                    y={pad.top + pHeight + (zoomed ? 22 : 20)}
                    textAnchor={i === 0 ? 'start' : i === normalizedData.length - 1 ? 'end' : 'middle'}
                    fill={axisDateColor}
                    fontSize={zoomed ? '13' : '12'}
                    fontWeight="700"
                  >
                    {formatDateLabel(d.date)}
                  </text>
                )}

                {/* Transparent hit target for hover/touch */}
                <rect
                  x={x - (pWidth / (normalizedData.length || 1)) / 2}
                  y={pad.top}
                  width={pWidth / (normalizedData.length || 1)}
                  height={pHeight + pad.bottom}
                  fill="transparent"
                  style={{ cursor: !zoomed ? 'zoom-in' : 'pointer' }}
                  onMouseEnter={() => {
                    if (zoomed) setModalHoveredIndex(i);
                    else setHoveredIndex(i);
                  }}
                  onMouseLeave={() => {
                    if (zoomed) setModalHoveredIndex(null);
                    else setHoveredIndex(null);
                  }}
                  onClick={(e) => {
                    if (!zoomed) {
                      setIsZoomModalOpen(true);
                    } else {
                      e.stopPropagation();
                      setModalHoveredIndex(modalHoveredIndex === i ? null : i);
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
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={onAddLogClick}
            style={{
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>{t('log_weight', language)}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '16px',
      }}
      ref={containerRef}
    >
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

        {/* Time Window Filters, Toggle Labels Checkbox, & Zoom Button */}
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
                  borderColor: timeFilter === f ? 'var(--primary)' : 'var(--border-color)',
                  background: timeFilter === f ? 'var(--primary-subtle)' : 'transparent',
                  color: timeFilter === f ? 'var(--primary)' : 'var(--text-muted)',
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
              border: `1px solid ${showLabels ? 'var(--primary)' : 'var(--border-color)'}`,
              background: showLabels ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
              color: showLabels ? 'var(--primary)' : 'var(--text-secondary)',
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
      {renderSvgChart(false)}

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
            {(viewMode === 'weight' || viewMode === 'both') && (
              <span style={{ color: isLight ? '#1d4ed8' : '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
                {normalizedData[hoveredIndex].weight} {unit.toUpperCase()}
              </span>
            )}

            {(viewMode === 'fat' || viewMode === 'both') && normalizedData[hoveredIndex].fat !== null && (
              <span style={{ color: isLight ? '#be185d' : '#f472b6', fontWeight: 700, fontSize: '14px' }}>
                {normalizedData[hoveredIndex].fat}% {language === 'es' ? 'Grasa' : 'Fat'}
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

      {/* Fullscreen Zoom Modal (ZOOM ONLY THE LINE GRAPH) */}
      {isZoomModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-portal-backdrop animate-fade-in"
          onClick={() => {
            setIsZoomModalOpen(false);
            setModalHoveredIndex(null);
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
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--primary)" />
                <Typography variant="h3" style={{ fontSize: '17px', fontWeight: 800 }}>
                  {t('vitals_and_metrics', language)}
                </Typography>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsZoomModalOpen(false);
                  setModalHoveredIndex(null);
                }}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px' }}
                title={t('close', language)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Zoomed Chart Body - Line Graph ONLY */}
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

              {/* Hover Tooltip in Modal */}
              {modalHoveredIndex !== null && normalizedData[modalHoveredIndex] && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md, 8px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatFullDate(normalizedData[modalHoveredIndex].date)}
                    </span>
                  </div>

                  {(viewMode === 'weight' || viewMode === 'both') && (
                    <span style={{ color: isLight ? '#1d4ed8' : '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
                      {normalizedData[modalHoveredIndex].weight} {unit.toUpperCase()}
                    </span>
                  )}

                  {(viewMode === 'fat' || viewMode === 'both') && normalizedData[modalHoveredIndex].fat !== null && (
                    <span style={{ color: isLight ? '#be185d' : '#f472b6', fontWeight: 700, fontSize: '14px' }}>
                      {normalizedData[modalHoveredIndex].fat}% {language === 'es' ? 'Grasa' : 'Fat'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
