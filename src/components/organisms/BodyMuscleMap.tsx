import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { t, translateMuscleGroup } from '../../utils/i18n';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';

export interface BodyMuscleMapProps {
  selectedMuscleGroups: string[]; // e.g. ['Chest', 'Quadriceps, Glutes', 'Biceps']
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Normalize muscle names to internal keys (supports both EN and ES)
export const normalizeMuscle = (muscleStr: string): string[] => {
  const normalized = muscleStr.toLowerCase().trim();
  const keys: string[] = [];

  if (normalized.includes('chest') || normalized.includes('pectoral') || normalized.includes('pecho')) keys.push('chest');
  if (normalized.includes('shoulder') || normalized.includes('deltoid') || normalized.includes('delt') || normalized.includes('hombro')) keys.push('shoulders');
  if (normalized.includes('bicep') || normalized.includes('bícep')) keys.push('biceps');
  if (normalized.includes('tricep') || normalized.includes('trícep')) keys.push('triceps');
  if (normalized.includes('forearm') || normalized.includes('antebrazo')) keys.push('forearms');
  if (normalized.includes('quad') || normalized.includes('thigh') || normalized.includes('cuádricep') || normalized.includes('cuadricep') || normalized.includes('muslo')) keys.push('quads');
  if (normalized.includes('hamstring') || normalized.includes('isquio') || normalized.includes('femoral')) keys.push('hamstrings');
  if (normalized.includes('glute') || normalized.includes('butt') || normalized.includes('glúteo') || normalized.includes('gluteo')) keys.push('glutes');
  if (normalized.includes('calf') || normalized.includes('calves') || normalized.includes('pantorrilla') || normalized.includes('gemelo')) keys.push('calves');
  if (normalized.includes('lat') || normalized.includes('lats') || normalized.includes('dorsal')) keys.push('lats');
  if (
    normalized.includes('upper back') ||
    normalized.includes('mid back') ||
    normalized.includes('espalda alta') ||
    ((normalized.includes('back') || normalized.includes('espalda')) && !normalized.includes('lower') && !normalized.includes('baja'))
  ) {
    keys.push('upper_back');
    if (!keys.includes('lats')) keys.push('lats');
  }
  if (normalized.includes('lower back') || normalized.includes('erector') || normalized.includes('espalda baja') || normalized.includes('lumbar')) keys.push('lower_back');
  if (normalized.includes('abs') || normalized.includes('abdom') || normalized.includes('core') || normalized.includes('oblique') || normalized.includes('oblicuo'))
    keys.push('abs');
  if (normalized.includes('trap') || normalized.includes('trapecio')) keys.push('traps');

  return keys;
};

export const BodyMuscleMap: React.FC<BodyMuscleMapProps> = ({
  selectedMuscleGroups,
  title = 'Muscle Group Heatmap',
  collapsible = true,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [activeView, setActiveView] = useState<'both' | 'front' | 'back'>('both');
  const { language } = useSettingsStore();

  const activeMuscleMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const group of selectedMuscleGroups) {
      if (!group) continue;
      const subMuscles = group.split(',');
      for (const item of subMuscles) {
        const keys = normalizeMuscle(item);
        for (const k of keys) {
          map[k] = (map[k] || 0) + 1;
        }
      }
    }
    return map;
  }, [selectedMuscleGroups]);

  const activeCount = Object.keys(activeMuscleMap).length;

  const getFill = (muscleKey: string): string => {
    if (activeMuscleMap[muscleKey]) {
      return activeMuscleMap[muscleKey] > 1 ? 'var(--warning)' : 'var(--primary)';
    }
    return 'var(--bg-elevated)';
  };

  const getStroke = (muscleKey: string): string => {
    if (activeMuscleMap[muscleKey]) {
      return activeMuscleMap[muscleKey] > 1 ? '#FDE68A' : '#818CF8';
    }
    return '#334155';
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        border: '1px solid var(--border-color)',
        margin: '12px 0',
      }}
    >
      <div
        onClick={() => collapsible && setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px 8px',
            minWidth: 0,
            flex: 1,
          }}
        >
          <Typography
            variant="label"
            color="var(--primary)"
            weight="bold"
            style={{ letterSpacing: '0.04em' }}
          >
            {title}
          </Typography>
          <Badge
            variant={activeCount > 0 ? 'accent' : 'muted'}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {activeCount} {t('targeted', language)}
          </Badge>
        </div>

        {collapsible && (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--primary)',
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              marginLeft: '4px',
            }}
          >
            {collapsed ? `▼ ${t('show', language)}` : `▲ ${t('hide', language)}`}
          </span>
        )}
      </div>

      {!collapsed && (
        <div style={{ marginTop: '12px' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px',
              marginBottom: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            {(['both', 'front', 'back'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveView(mode)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: activeView === mode ? 'var(--primary)' : 'transparent',
                  color: activeView === mode ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {mode === 'both' ? t('both', language) : mode === 'front' ? t('front', language) : t('back_view', language)}
              </button>
            ))}
          </div>

          {/* SVG Anatomy Canvas */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 8px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Front View */}
            {(activeView === 'both' || activeView === 'front') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>
                  {t('front', language).toUpperCase()}
                </span>
                <svg
                  viewBox="0 0 160 300"
                  width={activeView === 'both' ? 140 : 200}
                  height={activeView === 'both' ? 260 : 360}
                  style={{ display: 'block' }}
                >
                  <defs>
                    <linearGradient id="glowFront" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Head & Neck (35% bigger head) */}
                  <g stroke="#475569" strokeWidth="1" fill="#0F172A">
                    <path d="M69.2 11.7 C69.2 0.9 90.8 0.9 90.8 11.7 C90.8 25.2 85 30.6 84 36 L76 36 C75 30.6 69.2 25.2 69.2 11.7 Z" />
                  </g>

                  {/* Traps */}
                  <path d="M68 36 L76 36 L74 46 L62 48 Z" fill={getFill('traps')} stroke={getStroke('traps')} strokeWidth="1" />
                  <path d="M92 36 L84 36 L86 46 L98 48 Z" fill={getFill('traps')} stroke={getStroke('traps')} strokeWidth="1" />

                  {/* Shoulders */}
                  <path d="M58 48 C50 49 42 56 42 66 C42 74 48 80 54 80 C56 74 58 64 60 52 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.2" />
                  <path d="M102 48 C110 49 118 56 118 66 C118 74 112 80 106 80 C104 74 102 64 100 52 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.2" />

                  {/* Chest */}
                  <path d="M62 50 C68 49 76 50 78 52 L78 74 C72 78 60 76 56 70 C56 62 58 54 62 50 Z" fill={getFill('chest')} stroke={getStroke('chest')} strokeWidth="1.2" />
                  <path d="M98 50 C92 49 84 50 82 52 L82 74 C88 78 100 76 104 70 C104 62 102 54 98 50 Z" fill={getFill('chest')} stroke={getStroke('chest')} strokeWidth="1.2" />

                  {/* Biceps */}
                  <path d="M42 70 C38 74 38 88 40 98 C44 98 48 94 50 86 C50 78 46 72 42 70 Z" fill={getFill('biceps')} stroke={getStroke('biceps')} strokeWidth="1.2" />
                  <path d="M118 70 C122 74 122 88 120 98 C116 98 112 94 110 86 C110 78 114 72 118 70 Z" fill={getFill('biceps')} stroke={getStroke('biceps')} strokeWidth="1.2" />

                  {/* Forearms */}
                  <path d="M38 100 C34 104 32 120 34 136 L40 136 C42 124 44 112 46 100 Z" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.2" />
                  <path d="M122 100 C126 104 128 120 126 136 L120 136 C118 124 116 112 114 100 Z" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.2" />

                  {/* Hands */}
                  <path d="M34 137 C32 144 32 152 35 156 L38 152 L39 137 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M126 137 C128 144 128 152 125 156 L122 152 L121 137 Z" fill="#1E293B" stroke="#334155" />

                  {/* Abs */}
                  <path d="M68 76 L78 76 L78 86 L68 86 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M82 76 L92 76 L92 86 L82 86 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M68 88 L78 88 L78 98 L68 98 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M82 88 L92 88 L92 98 L82 98 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M70 100 L78 100 L78 114 L72 116 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M90 100 L82 100 L82 114 L88 116 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />

                  {/* Obliques */}
                  <path d="M58 78 C58 92 60 106 64 116 L68 116 L66 82 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  <path d="M102 78 C102 92 100 106 96 116 L92 116 L94 82 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />

                  {/* Quadriceps */}
                  <path d="M58 126 C52 136 50 158 54 182 C60 186 68 184 72 176 C76 160 76 138 74 126 Z" fill={getFill('quads')} stroke={getStroke('quads')} strokeWidth="1.2" />
                  <path d="M102 126 C108 136 110 158 106 182 C100 186 92 184 88 176 C84 160 84 138 86 126 Z" fill={getFill('quads')} stroke={getStroke('quads')} strokeWidth="1.2" />

                  {/* Knees */}
                  <path d="M56 184 C54 190 64 194 68 190 C70 186 64 182 56 184 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M104 184 C106 190 96 194 92 190 C90 186 96 182 104 184 Z" fill="#1E293B" stroke="#334155" />

                  {/* Calves */}
                  <path d="M54 196 C50 206 50 230 56 254 L66 254 C68 238 68 214 66 196 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.2" />
                  <path d="M106 196 C110 206 110 230 104 254 L94 254 C92 238 92 214 94 196 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.2" />

                  {/* Feet */}
                  <path d="M52 256 C46 266 48 274 58 276 L66 274 L66 256 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M108 256 C114 266 112 274 102 276 L94 274 L94 256 Z" fill="#1E293B" stroke="#334155" />
                </svg>
              </div>
            )}

            {/* Back View */}
            {(activeView === 'both' || activeView === 'back') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>
                  {t('back_view', language).toUpperCase()}
                </span>
                <svg
                  viewBox="0 0 160 300"
                  width={activeView === 'both' ? 140 : 200}
                  height={activeView === 'both' ? 260 : 360}
                  style={{ display: 'block' }}
                >
                  {/* Head & Neck (35% bigger head) */}
                  <path d="M69.2 11.7 C69.2 0.9 90.8 0.9 90.8 11.7 C90.8 25.2 85 30.6 84 36 L76 36 C75 30.6 69.2 25.2 69.2 11.7 Z" fill="#0F172A" stroke="#475569" strokeWidth="1" />

                  {/* Traps / Upper Back */}
                  <path
                    d="M62 48 L76 36 L84 36 L98 48 L88 66 L80 78 L72 66 Z"
                    fill={getFill('traps') !== '#1E293B' ? getFill('traps') : getFill('upper_back')}
                    stroke={getStroke('traps') !== '#334155' ? getStroke('traps') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />

                  {/* Rear Deltoids */}
                  <path d="M58 48 C50 49 42 56 42 66 C42 74 48 78 54 78 C56 70 58 60 60 50 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.2" />
                  <path d="M102 48 C110 49 118 56 118 66 C118 74 112 78 106 78 C104 70 102 60 100 50 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="1.2" />

                  {/* Triceps */}
                  <path d="M40 70 C36 76 36 90 38 100 C42 98 46 94 48 84 C48 76 46 72 40 70 Z" fill={getFill('triceps')} stroke={getStroke('triceps')} strokeWidth="1.2" />
                  <path d="M120 70 C124 76 124 90 122 100 C118 98 114 94 112 84 C112 76 114 72 120 70 Z" fill={getFill('triceps')} stroke={getStroke('triceps')} strokeWidth="1.2" />

                  {/* Forearms */}
                  <path d="M36 102 C32 106 30 120 32 136 L38 136 C40 124 42 112 44 102 Z" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.2" />
                  <path d="M124 102 C128 106 130 120 128 136 L122 136 C120 124 118 112 116 102 Z" fill={getFill('forearms')} stroke={getStroke('forearms')} strokeWidth="1.2" />

                  {/* Hands */}
                  <path d="M32 137 C30 144 30 152 33 156 L36 152 L37 137 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M128 137 C130 144 130 152 127 156 L124 152 L123 137 Z" fill="#1E293B" stroke="#334155" />

                  {/* Lats */}
                  <path
                    d="M60 62 C58 74 58 92 66 106 L74 104 L72 74 Z"
                    fill={getFill('lats') !== '#1E293B' ? getFill('lats') : getFill('upper_back')}
                    stroke={getStroke('lats') !== '#334155' ? getStroke('lats') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />
                  <path
                    d="M100 62 C102 74 102 92 94 106 L86 104 L88 74 Z"
                    fill={getFill('lats') !== '#1E293B' ? getFill('lats') : getFill('upper_back')}
                    stroke={getStroke('lats') !== '#334155' ? getStroke('lats') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />

                  {/* Lower Back */}
                  <path d="M72 86 L88 86 L86 116 L74 116 Z" fill={getFill('lower_back')} stroke={getStroke('lower_back')} strokeWidth="1.2" />

                  {/* Glutes */}
                  <path d="M58 118 C52 128 52 144 58 156 C66 160 76 156 78 144 L78 118 Z" fill={getFill('glutes')} stroke={getStroke('glutes')} strokeWidth="1.2" />
                  <path d="M102 118 C108 128 108 144 102 156 C94 160 84 156 82 144 L82 118 Z" fill={getFill('glutes')} stroke={getStroke('glutes')} strokeWidth="1.2" />

                  {/* Hamstrings */}
                  <path d="M56 160 C52 168 52 186 56 196 C62 198 72 196 74 186 C76 174 76 164 74 160 Z" fill={getFill('hamstrings')} stroke={getStroke('hamstrings')} strokeWidth="1.2" />
                  <path d="M104 160 C108 168 108 186 104 196 C98 198 88 196 86 186 C84 174 84 164 86 160 Z" fill={getFill('hamstrings')} stroke={getStroke('hamstrings')} strokeWidth="1.2" />

                  {/* Knees */}
                  <path d="M58 196 C56 200 68 200 70 196 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M102 196 C104 200 92 200 90 196 Z" fill="#1E293B" stroke="#334155" />

                  {/* Calves */}
                  <path d="M54 200 C48 210 50 230 56 254 L68 254 C72 238 72 216 68 200 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.2" />
                  <path d="M106 200 C112 210 110 230 104 254 L92 254 C88 238 88 216 92 200 Z" fill={getFill('calves')} stroke={getStroke('calves')} strokeWidth="1.2" />

                  {/* Feet */}
                  <path d="M54 256 C50 266 54 274 62 276 L68 274 L68 256 Z" fill="#1E293B" stroke="#334155" />
                  <path d="M106 256 C110 266 106 274 98 276 L92 274 L92 256 Z" fill="#1E293B" stroke="#334155" />
                </svg>
              </div>
            )}
          </div>

          {/* Active Muscle Chips */}
          {activeCount > 0 ? (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
              <Typography variant="caption" color="var(--text-muted)" style={{ marginBottom: '6px' }}>
                Targeted Muscle Groups:
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(activeMuscleMap).map(([mKey, count]) => {
                  const label = translateMuscleGroup(mKey.replace('_', ' '), language).toUpperCase();
                  return (
                    <Badge key={mKey} variant={count > 1 ? 'accent' : 'primary'}>
                      {label} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <Typography variant="caption" color="var(--text-subtle)">
                {t('muscle_map_help', language)}
              </Typography>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
