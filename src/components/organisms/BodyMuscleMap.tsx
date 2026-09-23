import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Typography } from '../atoms/Typography';
import { Badge } from '../atoms/Badge';

export interface BodyMuscleMapProps {
  selectedMuscleGroups: string[]; // e.g. ['Chest', 'Quadriceps, Glutes', 'Biceps']
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Normalize muscle names to internal keys
export const normalizeMuscle = (muscleStr: string): string[] => {
  const normalized = muscleStr.toLowerCase().trim();
  const keys: string[] = [];

  if (normalized.includes('chest') || normalized.includes('pectoral')) keys.push('chest');
  if (normalized.includes('shoulder') || normalized.includes('deltoid') || normalized.includes('delt')) keys.push('shoulders');
  if (normalized.includes('bicep')) keys.push('biceps');
  if (normalized.includes('tricep')) keys.push('triceps');
  if (normalized.includes('forearm')) keys.push('forearms');
  if (normalized.includes('quad') || normalized.includes('thigh')) keys.push('quads');
  if (normalized.includes('hamstring')) keys.push('hamstrings');
  if (normalized.includes('glute') || normalized.includes('butt')) keys.push('glutes');
  if (normalized.includes('calf') || normalized.includes('calves')) keys.push('calves');
  if (normalized.includes('lat') || normalized.includes('lats')) keys.push('lats');
  if (normalized.includes('upper back') || normalized.includes('mid back') || (normalized.includes('back') && !normalized.includes('lower'))) {
    keys.push('upper_back');
    if (!keys.includes('lats')) keys.push('lats');
  }
  if (normalized.includes('lower back') || normalized.includes('erector')) keys.push('lower_back');
  if (normalized.includes('abs') || normalized.includes('abdom') || normalized.includes('core') || normalized.includes('oblique')) keys.push('abs');
  if (normalized.includes('trap')) keys.push('traps');

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

  // Compute active muscle key counts
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

  const isHighlighted = (muscleKey: string): boolean => {
    return Boolean(activeMuscleMap[muscleKey]);
  };

  const getFill = (muscleKey: string): string => {
    if (activeMuscleMap[muscleKey]) {
      // Glow highlight color (vibrant emerald / indigo gradient accent)
      return activeMuscleMap[muscleKey] > 1 ? '#F59E0B' : '#6366F1'; // Amber if multiple exercises, Indigo if single
    }
    return '#1E293B'; // Inactive dark slate
  };

  const getStroke = (muscleKey: string): string => {
    if (activeMuscleMap[muscleKey]) {
      return activeMuscleMap[muscleKey] > 1 ? '#FDE68A' : '#818CF8';
    }
    return '#334155';
  };

  const getBodyOutlineStroke = (): string => '#475569';
  const getBodyOutlineFill = (): string => '#0F172A';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => collapsible && setCollapsed(!collapsed)}
        activeOpacity={collapsible ? 0.7 : 1}
        style={styles.headerRow}
      >
        <View style={styles.titleWithBadge}>
          <Typography variant="label" color="#6366F1">
            {title}
          </Typography>
          <Badge
            label={`${activeCount} Targeted`}
            variant={activeCount > 0 ? 'accent' : 'neutral'}
            style={styles.targetedBadge}
          />
        </View>

        {collapsible ? (
          <Typography variant="caption" color="#6366F1" bold>
            {collapsed ? '▼ Show' : '▲ Hide'}
          </Typography>
        ) : null}
      </TouchableOpacity>

      {!collapsed ? (
        <View style={styles.bodyContent}>
          {/* View Mode Toggle: Both, Front, Back */}
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              onPress={() => setActiveView('both')}
              style={[styles.viewTab, activeView === 'both' && styles.viewTabActive]}
            >
              <Typography variant="caption" bold color={activeView === 'both' ? '#F8FAFC' : '#94A3B8'}>
                Both
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveView('front')}
              style={[styles.viewTab, activeView === 'front' && styles.viewTabActive]}
            >
              <Typography variant="caption" bold color={activeView === 'front' ? '#F8FAFC' : '#94A3B8'}>
                Anterior (Front)
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveView('back')}
              style={[styles.viewTab, activeView === 'back' && styles.viewTabActive]}
            >
              <Typography variant="caption" bold color={activeView === 'back' ? '#F8FAFC' : '#94A3B8'}>
                Posterior (Back)
              </Typography>
            </TouchableOpacity>
          </View>

          {/* SVG Anatomy Canvas */}
          <View style={styles.anatomyContainer}>
            {/* Front View */}
            {(activeView === 'both' || activeView === 'front') && (
              <View style={styles.figureWrapper}>
                <Typography variant="caption" color="#94A3B8" bold style={styles.figureLabel}>
                  FRONT
                </Typography>
                <Svg viewBox="0 0 160 300" width={activeView === 'both' ? 140 : 200} height={activeView === 'both' ? 260 : 360}>
                  <Defs>
                    <LinearGradient id="glowFront" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
                      <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
                    </LinearGradient>
                  </Defs>

                  {/* Base Body Silhouette (Anterior) */}
                  <G stroke={getBodyOutlineStroke()} strokeWidth="1" fill={getBodyOutlineFill()}>
                    {/* Head & Neck */}
                    <Path d="M72 18 C72 10 88 10 88 18 C88 28 84 32 84 36 L76 36 C76 32 72 28 72 18 Z" />
                  </G>

                  {/* Traps (Front) */}
                  <Path
                    d="M68 36 L76 36 L74 46 L62 48 Z"
                    fill={getFill('traps')}
                    stroke={getStroke('traps')}
                    strokeWidth="1"
                  />
                  <Path
                    d="M92 36 L84 36 L86 46 L98 48 Z"
                    fill={getFill('traps')}
                    stroke={getStroke('traps')}
                    strokeWidth="1"
                  />

                  {/* Shoulders / Front Deltoids */}
                  <Path
                    d="M58 48 C50 49 42 56 42 66 C42 74 48 80 54 80 C56 74 58 64 60 52 Z"
                    fill={getFill('shoulders')}
                    stroke={getStroke('shoulders')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M102 48 C110 49 118 56 118 66 C118 74 112 80 106 80 C104 74 102 64 100 52 Z"
                    fill={getFill('shoulders')}
                    stroke={getStroke('shoulders')}
                    strokeWidth="1.2"
                  />

                  {/* Chest / Pectorals */}
                  <Path
                    d="M62 50 C68 49 76 50 78 52 L78 74 C72 78 60 76 56 70 C56 62 58 54 62 50 Z"
                    fill={getFill('chest')}
                    stroke={getStroke('chest')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M98 50 C92 49 84 50 82 52 L82 74 C88 78 100 76 104 70 C104 62 102 54 98 50 Z"
                    fill={getFill('chest')}
                    stroke={getStroke('chest')}
                    strokeWidth="1.2"
                  />

                  {/* Biceps */}
                  <Path
                    d="M42 70 C38 74 38 88 40 98 C44 98 48 94 50 86 C50 78 46 72 42 70 Z"
                    fill={getFill('biceps')}
                    stroke={getStroke('biceps')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M118 70 C122 74 122 88 120 98 C116 98 112 94 110 86 C110 78 114 72 118 70 Z"
                    fill={getFill('biceps')}
                    stroke={getStroke('biceps')}
                    strokeWidth="1.2"
                  />

                  {/* Forearms (Front) */}
                  <Path
                    d="M38 100 C34 104 32 120 34 136 L40 136 C42 124 44 112 46 100 Z"
                    fill={getFill('forearms')}
                    stroke={getStroke('forearms')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M122 100 C126 104 128 120 126 136 L120 136 C118 124 116 112 114 100 Z"
                    fill={getFill('forearms')}
                    stroke={getStroke('forearms')}
                    strokeWidth="1.2"
                  />

                  {/* Hands */}
                  <Path d="M34 137 C32 144 32 152 35 156 L38 152 L39 137 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M126 137 C128 144 128 152 125 156 L122 152 L121 137 Z" fill="#1E293B" stroke="#334155" />

                  {/* Abs / Core / Obliques */}
                  <G>
                    {/* Upper Abs */}
                    <Path d="M68 76 L78 76 L78 86 L68 86 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    <Path d="M82 76 L92 76 L92 86 L82 86 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    {/* Mid Abs */}
                    <Path d="M68 88 L78 88 L78 98 L68 98 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    <Path d="M82 88 L92 88 L92 98 L82 98 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    {/* Lower Abs */}
                    <Path d="M70 100 L78 100 L78 114 L72 116 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    <Path d="M90 100 L82 100 L82 114 L88 116 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    {/* Obliques */}
                    <Path d="M58 78 C58 92 60 106 64 116 L68 116 L66 82 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                    <Path d="M102 78 C102 92 100 106 96 116 L92 116 L94 82 Z" fill={getFill('abs')} stroke={getStroke('abs')} strokeWidth="1" />
                  </G>

                  {/* Quadriceps (Front Thighs) */}
                  <Path
                    d="M58 126 C52 136 50 158 54 182 C60 186 68 184 72 176 C76 160 76 138 74 126 Z"
                    fill={getFill('quads')}
                    stroke={getStroke('quads')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M102 126 C108 136 110 158 106 182 C100 186 92 184 88 176 C84 160 84 138 86 126 Z"
                    fill={getFill('quads')}
                    stroke={getStroke('quads')}
                    strokeWidth="1.2"
                  />

                  {/* Knees */}
                  <Path d="M56 184 C54 190 64 194 68 190 C70 186 64 182 56 184 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M104 184 C106 190 96 194 92 190 C90 186 96 182 104 184 Z" fill="#1E293B" stroke="#334155" />

                  {/* Calves (Front Shin / Calves) */}
                  <Path
                    d="M54 196 C50 206 50 230 56 254 L66 254 C68 238 68 214 66 196 Z"
                    fill={getFill('calves')}
                    stroke={getStroke('calves')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M106 196 C110 206 110 230 104 254 L94 254 C92 238 92 214 94 196 Z"
                    fill={getFill('calves')}
                    stroke={getStroke('calves')}
                    strokeWidth="1.2"
                  />

                  {/* Feet */}
                  <Path d="M52 256 C46 266 48 274 58 276 L66 274 L66 256 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M108 256 C114 266 112 274 102 276 L94 274 L94 256 Z" fill="#1E293B" stroke="#334155" />
                </Svg>
              </View>
            )}

            {/* Back View */}
            {(activeView === 'both' || activeView === 'back') && (
              <View style={styles.figureWrapper}>
                <Typography variant="caption" color="#94A3B8" bold style={styles.figureLabel}>
                  BACK
                </Typography>
                <Svg viewBox="0 0 160 300" width={activeView === 'both' ? 140 : 200} height={activeView === 'both' ? 260 : 360}>
                  {/* Head & Neck (Back) */}
                  <Path d="M72 18 C72 10 88 10 88 18 C88 28 84 32 84 36 L76 36 C76 32 72 28 72 18 Z" fill="#0F172A" stroke="#475569" strokeWidth="1" />

                  {/* Traps / Upper Back */}
                  <Path
                    d="M62 48 L76 36 L84 36 L98 48 L88 66 L80 78 L72 66 Z"
                    fill={getFill('traps') !== '#1E293B' ? getFill('traps') : getFill('upper_back')}
                    stroke={getStroke('traps') !== '#334155' ? getStroke('traps') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />

                  {/* Rear Deltoids (Back Shoulders) */}
                  <Path
                    d="M58 48 C50 49 42 56 42 66 C42 74 48 78 54 78 C56 70 58 60 60 50 Z"
                    fill={getFill('shoulders')}
                    stroke={getStroke('shoulders')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M102 48 C110 49 118 56 118 66 C118 74 112 78 106 78 C104 70 102 60 100 50 Z"
                    fill={getFill('shoulders')}
                    stroke={getStroke('shoulders')}
                    strokeWidth="1.2"
                  />

                  {/* Triceps */}
                  <Path
                    d="M40 70 C36 76 36 90 38 100 C42 98 46 94 48 84 C48 76 46 72 40 70 Z"
                    fill={getFill('triceps')}
                    stroke={getStroke('triceps')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M120 70 C124 76 124 90 122 100 C118 98 114 94 112 84 C112 76 114 72 120 70 Z"
                    fill={getFill('triceps')}
                    stroke={getStroke('triceps')}
                    strokeWidth="1.2"
                  />

                  {/* Forearms (Back) */}
                  <Path
                    d="M36 102 C32 106 30 120 32 136 L38 136 C40 124 42 112 44 102 Z"
                    fill={getFill('forearms')}
                    stroke={getStroke('forearms')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M124 102 C128 106 130 120 128 136 L122 136 C120 124 118 112 116 102 Z"
                    fill={getFill('forearms')}
                    stroke={getStroke('forearms')}
                    strokeWidth="1.2"
                  />

                  {/* Hands (Back) */}
                  <Path d="M32 137 C30 144 30 152 33 156 L36 152 L37 137 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M128 137 C130 144 130 152 127 156 L124 152 L123 137 Z" fill="#1E293B" stroke="#334155" />

                  {/* Lats (Latissimus Dorsi) */}
                  <Path
                    d="M60 62 C58 74 58 92 66 106 L74 104 L72 74 Z"
                    fill={getFill('lats') !== '#1E293B' ? getFill('lats') : getFill('upper_back')}
                    stroke={getStroke('lats') !== '#334155' ? getStroke('lats') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M100 62 C102 74 102 92 94 106 L86 104 L88 74 Z"
                    fill={getFill('lats') !== '#1E293B' ? getFill('lats') : getFill('upper_back')}
                    stroke={getStroke('lats') !== '#334155' ? getStroke('lats') : getStroke('upper_back')}
                    strokeWidth="1.2"
                  />

                  {/* Lower Back / Erector Spinae */}
                  <Path
                    d="M72 86 L88 86 L86 116 L74 116 Z"
                    fill={getFill('lower_back')}
                    stroke={getStroke('lower_back')}
                    strokeWidth="1.2"
                  />

                  {/* Glutes */}
                  <Path
                    d="M58 118 C52 128 52 144 58 156 C66 160 76 156 78 144 L78 118 Z"
                    fill={getFill('glutes')}
                    stroke={getStroke('glutes')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M102 118 C108 128 108 144 102 156 C94 160 84 156 82 144 L82 118 Z"
                    fill={getFill('glutes')}
                    stroke={getStroke('glutes')}
                    strokeWidth="1.2"
                  />

                  {/* Hamstrings (Back of Thighs) */}
                  <Path
                    d="M56 160 C52 168 52 186 56 196 C62 198 72 196 74 186 C76 174 76 164 74 160 Z"
                    fill={getFill('hamstrings')}
                    stroke={getStroke('hamstrings')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M104 160 C108 168 108 186 104 196 C98 198 88 196 86 186 C84 174 84 164 86 160 Z"
                    fill={getFill('hamstrings')}
                    stroke={getStroke('hamstrings')}
                    strokeWidth="1.2"
                  />

                  {/* Back of Knees */}
                  <Path d="M58 196 C56 200 68 200 70 196 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M102 196 C104 200 92 200 90 196 Z" fill="#1E293B" stroke="#334155" />

                  {/* Calves (Back - Gastrocnemius / Soleus) */}
                  <Path
                    d="M54 200 C48 210 50 230 56 254 L68 254 C72 238 72 216 68 200 Z"
                    fill={getFill('calves')}
                    stroke={getStroke('calves')}
                    strokeWidth="1.2"
                  />
                  <Path
                    d="M106 200 C112 210 110 230 104 254 L92 254 C88 238 88 216 92 200 Z"
                    fill={getFill('calves')}
                    stroke={getStroke('calves')}
                    strokeWidth="1.2"
                  />

                  {/* Feet (Back) */}
                  <Path d="M54 256 C50 266 54 274 62 276 L68 274 L68 256 Z" fill="#1E293B" stroke="#334155" />
                  <Path d="M106 256 C110 266 106 274 98 276 L92 274 L92 256 Z" fill="#1E293B" stroke="#334155" />
                </Svg>
              </View>
            )}
          </View>

          {/* Targeted Muscle Tags Summary */}
          {activeCount > 0 ? (
            <View style={styles.tagsContainer}>
              <Typography variant="caption" color="#94A3B8" style={{ marginBottom: 6 }}>
                Targeted Muscle Groups:
              </Typography>
              <View style={styles.tagChips}>
                {Object.entries(activeMuscleMap).map(([mKey, count]) => {
                  const label = mKey.replace('_', ' ').toUpperCase();
                  return (
                    <Badge
                      key={mKey}
                      label={`${label} (${count})`}
                      variant={count > 1 ? 'accent' : 'primary'}
                      style={styles.muscleBadge}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            <Typography variant="caption" color="#64748B" align="center" style={styles.emptyPrompt}>
              Select exercises below to light up targeted muscle groups on the body map.
            </Typography>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bodyContent: {
    marginTop: 12,
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  viewTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  viewTabActive: {
    backgroundColor: '#6366F1',
  },
  anatomyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  figureWrapper: {
    alignItems: 'center',
  },
  figureLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  tagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleBadge: {
    marginRight: 4,
    marginBottom: 4,
  },
  emptyPrompt: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});
