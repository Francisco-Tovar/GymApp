import { SessionSet, WeightUnit, AppLanguage } from '../types';
import { convertWeight } from './unitConversion';
import { t } from './i18n';

interface WorkoutShareData {
  workout_name?: string;
  date: string;
  durationSeconds?: number;
}

export function generateWorkoutShareText(
  session: WorkoutShareData,
  sets: SessionSet[],
  unit: WeightUnit,
  language: AppLanguage = 'en'
): string {
  const d = new Date(session.date);
  const formattedDate = d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEs = language === 'es';
  const headerTitle = isEs ? '🏋️ *Registro de Entrenamiento - GymApp*' : '🏋️ *GymApp Workout Log*';
  const dateLabel = isEs ? '📅 *Fecha:*' : '📅 *Date:*';
  const routineLabel = isEs ? '🔥 *Rutina:*' : '🔥 *Routine:*';
  const exercisesTitle = isEs ? '💪 *Ejercicios y Series:*' : '💪 *Exercises & Sets:*';
  const summaryTitle = isEs ? '📊 *Resumen:*' : '📊 *Summary:*';
  const totalSetsLabel = isEs ? '• Series Totales:' : '• Total Sets:';
  const totalVolumeLabel = isEs ? '• Volumen Total:' : '• Total Volume:';
  const footer = isEs ? '✨ *Registrado con GymApp*' : '✨ *Logged with GymApp*';

  // Group sets by exercise
  const grouped = sets.reduce((acc, setItem) => {
    const name = setItem.exercise_name || (isEs ? `Ejercicio #${setItem.exercise_id}` : `Exercise #${setItem.exercise_id}`);
    if (!acc[name]) acc[name] = [];
    acc[name].push(setItem);
    return acc;
  }, {} as Record<string, SessionSet[]>);

  let totalVolume = 0;
  let totalValidSets = 0;

  const exerciseLines: string[] = [];

  for (const [exName, exSets] of Object.entries(grouped)) {
    const setLines: string[] = [];

    exSets.forEach((setItem) => {
      const isTimeBased =
        setItem.exercise_type === 'time_based' ||
        (setItem.duration_seconds !== undefined && setItem.duration_seconds > 0);
      const convertedWeight = convertWeight(setItem.weight, setItem.unit || 'lb', unit);

      if (isTimeBased) {
        const totalSecs = setItem.duration_seconds || 0;
        const mins = Math.floor(totalSecs / 60);
        const s = totalSecs % 60;
        let durStr = `${s}s`;
        if (mins > 0 && s > 0) durStr = `${mins}m ${s}s`;
        else if (mins > 0) durStr = `${mins} min`;

        const setPrefix = isEs ? `  - Serie ${setItem.set_number}:` : `  - Set ${setItem.set_number}:`;
        let line = `${setPrefix} ⏱️ ${durStr}`;
        if (setItem.notes && setItem.notes.trim() !== '') {
          line += ` (${setItem.notes.trim()})`;
        }
        setLines.push(line);
        totalValidSets++;
      } else {
        if (setItem.reps > 0 && setItem.weight > 0) {
          totalVolume += convertedWeight * setItem.reps;
          totalValidSets++;
          const setPrefix = isEs ? `  - Serie ${setItem.set_number}:` : `  - Set ${setItem.set_number}:`;
          let line = `${setPrefix} ${convertedWeight} ${unit} × ${setItem.reps} reps`;
          if (setItem.notes && setItem.notes.trim() !== '') {
            line += ` (${setItem.notes.trim()})`;
          }
          setLines.push(line);
        }
      }
    });

    if (setLines.length > 0) {
      exerciseLines.push(`• *${exName}:*\n${setLines.join('\n')}`);
    }
  }

  const volumeStr =
    totalVolume > 0
      ? `\n${totalVolumeLabel} ${Math.round(totalVolume).toLocaleString()} ${unit}`
      : '';

  return [
    headerTitle,
    `${dateLabel} ${formattedDate}`,
    `${routineLabel} ${session.workout_name || (isEs ? 'Entrenamiento' : 'Workout')}`,
    '',
    exercisesTitle,
    exerciseLines.length > 0 ? exerciseLines.join('\n\n') : (isEs ? '  (Sin series registradas)' : '  (No sets recorded)'),
    '',
    summaryTitle,
    `${totalSetsLabel} ${totalValidSets}${volumeStr}`,
    '',
    footer,
  ].join('\n');
}

export function shareViaWhatsApp(text: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareViaNavigator(title: string, text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('System share error:', err);
      }
    }
  }
  return false;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  }
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    return true;
  } catch (err) {
    return false;
  }
}
