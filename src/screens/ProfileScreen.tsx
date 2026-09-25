import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveUserProfile, addBodyMetric, updateBodyMetric, deleteBodyMetric, clearAllBodyMetrics } from '../db/db';
import { UserProfile, BodyMetricLog } from '../types';
import { calculateAge, formatHeight, calculateBMI, getBMICategory } from '../utils/vitals';
import { convertWeight } from '../utils/unitConversion';
import { useSettingsStore } from '../store/useSettingsStore';
import { t } from '../utils/i18n';
import { Typography } from '../components/atoms/Typography';
import { Card } from '../components/atoms/Card';
import { Badge } from '../components/atoms/Badge';
import { Modal } from '../components/atoms/Modal';
import { Button } from '../components/atoms/Button';
import { BodyMetricsChart } from '../components/organisms/BodyMetricsChart';
import { ProfileEditModal } from '../components/organisms/ProfileEditModal';
import { BodyMetricModal } from '../components/organisms/BodyMetricModal';
import {
  User,
  Edit2,
  Plus,
  Scale,
  Percent,
  Activity,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Ruler,
  FileText,
  Trash2,
  Heart,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { unit, language } = useSettingsStore();

  // Live queries for Profile and Body Metrics
  const profile = useLiveQuery<UserProfile | null>(async () => {
    const p = await db.user_profile.toCollection().first();
    return p || null;
  });

  const logs = useLiveQuery<BodyMetricLog[]>(async () => {
    const list = await db.body_metrics.toArray();
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }) || [];

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<BodyMetricLog | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Derived calculations
  const age = calculateAge(profile?.dob);
  const heightDisplay = formatHeight(profile?.heightCm, profile?.heightUnit || 'cm');

  // Latest and starting entries
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const firstLog = logs.length > 0 ? logs[0] : null;

  const currentWeightDisplay = latestLog
    ? (latestLog.unit === unit
        ? latestLog.weight
        : Math.round(convertWeight(latestLog.weight, latestLog.unit, unit) * 10) / 10)
    : null;

  const firstWeightDisplay = firstLog
    ? (firstLog.unit === unit
        ? firstLog.weight
        : Math.round(convertWeight(firstLog.weight, firstLog.unit, unit) * 10) / 10)
    : null;

  const weightChange = currentWeightDisplay !== null && firstWeightDisplay !== null
    ? Math.round((currentWeightDisplay - firstWeightDisplay) * 10) / 10
    : null;

  const latestFat = latestLog?.bodyFatPercentage != null ? latestLog.bodyFatPercentage : null;

  // BMI computation
  const bmi = currentWeightDisplay !== null && profile?.heightCm
    ? calculateBMI(currentWeightDisplay, unit, profile.heightCm)
    : null;
  const bmiInfo = getBMICategory(bmi, language);

  // Pagination calculations
  const reversedLogs = useMemo(() => [...logs].reverse(), [logs]);
  const totalPages = Math.max(1, Math.ceil(reversedLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, reversedLogs.length);
  const paginatedLogs = useMemo(() => {
    return reversedLogs.slice(startIndex, startIndex + pageSize);
  }, [reversedLogs, startIndex, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    await saveUserProfile(updated);
  };

  const handleSaveMetric = async (entry: Omit<BodyMetricLog, 'id'>, editId?: number) => {
    if (editId) {
      await updateBodyMetric(editId, entry);
    } else {
      await addBodyMetric(entry);
    }
  };

  const handleDeleteMetric = async (id: number) => {
    await deleteBodyMetric(id);
  };

  const handleClearAllLogs = async () => {
    await clearAllBodyMetrics();
    setShowClearModal(false);
  };

  const formatLogDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="screen-container" style={{ paddingBottom: '90px' }}>
      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Typography variant="h1" style={{ fontSize: '24px', fontWeight: 800 }}>
            {t('profile', language)}
          </Typography>
          <Typography variant="caption" color="secondary">
            {t('vitals_and_metrics', language)}
          </Typography>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEntryToEdit(null);
            setIsLogModalOpen(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          {t('log_weight', language)}
        </button>
      </div>

      {/* 1. Profile & Vitals Card */}
      <Card style={{ marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(236, 72, 153, 0.2))',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontSize: '22px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={24} />}
            </div>

            <div>
              <Typography variant="h2" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {profile?.name || (language === 'es' ? 'Atleta' : 'Athlete')}
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {age !== null ? (
                  <Badge variant="primary">
                    <Sparkles size={11} style={{ marginRight: '3px' }} />
                    {age} {t('years_old', language)}
                  </Badge>
                ) : (
                  <Badge variant="muted" onClick={() => setIsEditProfileOpen(true)} style={{ cursor: 'pointer' }}>
                    + {t('dob', language)}
                  </Badge>
                )}

                {profile?.heightCm ? (
                  <Badge variant="muted">
                    <Ruler size={11} style={{ marginRight: '3px' }} />
                    {heightDisplay}
                  </Badge>
                ) : null}

                {profile?.gender && profile.gender !== 'unspecified' ? (
                  <Badge variant="muted">
                    {t(profile.gender, language)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditProfileOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit2 size={13} />
            {t('edit_profile', language)}
          </button>
        </div>
      </Card>

      {/* 2. Key Vitals Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {/* Current Weight Card */}
        <Card style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('current_weight', language)}
            </span>
            <Scale size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h2" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>
              {currentWeightDisplay !== null ? currentWeightDisplay : '--'}
            </Typography>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {unit.toUpperCase()}
            </span>
          </div>
          {weightChange !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '11px', color: weightChange < 0 ? '#22c55e' : weightChange > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
              {weightChange < 0 ? <TrendingDown size={12} /> : weightChange > 0 ? <TrendingUp size={12} /> : null}
              <span>{weightChange > 0 ? `+${weightChange}` : weightChange} {unit.toUpperCase()} {t('net_change', language).toLowerCase()}</span>
            </div>
          )}
        </Card>

        {/* Body Fat Card */}
        <Card style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('body_fat', language)}
            </span>
            <Percent size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h2" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)' }}>
              {latestFat !== null ? `${latestFat}%` : '--'}
            </Typography>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            {latestFat !== null ? (language === 'es' ? 'Último registro' : 'Latest measurement') : t('body_fat_optional', language)}
          </span>
        </Card>

        {/* BMI Card */}
        <Card style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('bmi', language)}
            </span>
            <Activity size={16} style={{ color: bmiInfo.color }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography variant="h2" style={{ fontSize: '22px', fontWeight: 800 }}>
              {bmi !== null ? bmi : '--'}
            </Typography>
            {bmi !== null && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: `${bmiInfo.color}22`,
                  color: bmiInfo.color,
                }}
              >
                {bmiInfo.category}
              </span>
            )}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            {profile?.heightCm ? `${heightDisplay} ${t('height', language).toLowerCase()}` : (language === 'es' ? 'Añade tu altura' : 'Add height in profile')}
          </span>
        </Card>

        {/* Total Logs Recorded */}
        <Card style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('weight_history', language)}
            </span>
            <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography variant="h2" style={{ fontSize: '22px', fontWeight: 800 }}>
              {logs.length}
            </Typography>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {language === 'es' ? 'pesaje(s)' : 'entries'}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
            {latestLog ? formatLogDate(latestLog.date) : '--'}
          </span>
        </Card>
      </div>

      {/* 3. Progression Line Graph */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <Typography variant="h3" style={{ fontSize: '16px', fontWeight: 700 }}>
            {t('vitals_and_metrics', language)}
          </Typography>
        </div>
        <BodyMetricsChart
          logs={logs}
          heightCm={profile?.heightCm}
          onAddLogClick={() => {
            setEntryToEdit(null);
            setIsLogModalOpen(true);
          }}
        />
      </div>

      {/* 4. Weigh-in History Log List (Collapsible, collapsed by default) */}
      {logs.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: isHistoryExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <Scale size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <Typography variant="h3" style={{ fontSize: '14px', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                {t('weight_history', language)}
              </Typography>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              <Badge variant="muted" style={{ whiteSpace: 'nowrap', padding: '2px 8px', fontSize: '11px' }}>
                {logs.length} {language === 'es' ? 'registros' : 'records'}
              </Badge>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  {isHistoryExpanded
                    ? (language === 'es' ? 'Ocultar' : 'Hide')
                    : (language === 'es' ? 'Mostrar' : 'Show')}
                </span>
                {isHistoryExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>
          </button>

          {isHistoryExpanded && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderTop: 'none',
                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
              }}
            >
              {/* Pagination Top Toolbar: Range indicator & Page size pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px 8px 4px',
                  borderBottom: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {t('showing', language)} <strong style={{ color: 'var(--text-primary)' }}>{logs.length > 0 ? startIndex + 1 : 0}–{endIndex}</strong> {t('of', language)} <strong style={{ color: 'var(--text-primary)' }}>{logs.length}</strong>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {t('per_page', language)}:
                    </span>
                    <div
                      style={{
                        display: 'inline-flex',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {[5, 10, 50].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handlePageSizeChange(size)}
                          style={{
                            background: pageSize === size ? 'var(--primary)' : 'transparent',
                            color: pageSize === size ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: pageSize === size ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    title={language === 'es' ? 'Limpiar historial de pesajes' : 'Clear all weigh-ins'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                    {language === 'es' ? 'Limpiar Todo' : 'Clear All'}
                  </button>
                </div>
              </div>

              {/* Paginated Log Items */}
              {paginatedLogs.map((log) => {
                const displayW = log.unit === unit
                  ? log.weight
                  : Math.round(convertWeight(log.weight, log.unit, unit) * 10) / 10;

                return (
                  <div
                    key={log.id}
                    className="card"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          backgroundColor: 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                        }}
                      >
                        <Scale size={18} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {displayW} {unit.toUpperCase()}
                          </span>
                          {log.bodyFatPercentage != null && (
                            <Badge variant="muted">
                              {log.bodyFatPercentage}% Fat
                            </Badge>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            {formatLogDate(log.date)}
                          </span>
                          {log.notes && (
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              • {log.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => {
                          setEntryToEdit(log);
                          setIsLogModalOpen(true);
                        }}
                        style={{ width: '32px', height: '32px' }}
                        title={t('edit', language)}
                      >
                        <Edit2 size={13} />
                      </button>
                      {log.id && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleDeleteMetric(log.id!)}
                          style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                          title={t('delete', language)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bottom Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      opacity: safeCurrentPage <= 1 ? 0.4 : 1,
                      cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronLeft size={16} />
                    {language === 'es' ? 'Anterior' : 'Previous'}
                  </button>

                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t('page', language)} {safeCurrentPage} {t('of', language)} {totalPages}
                  </span>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      opacity: safeCurrentPage >= totalPages ? 0.4 : 1,
                      cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {language === 'es' ? 'Siguiente' : 'Next'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile ?? null}
        onSave={handleSaveProfile}
      />

      <BodyMetricModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
        onSave={handleSaveMetric}
        onDelete={handleDeleteMetric}
      />

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        position="center"
        maxWidth="420px"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={24} color="var(--danger)" />
          <Typography variant="h2" style={{ fontSize: '18px', fontWeight: 800 }}>
            {language === 'es' ? '¿Limpiar todos los pesajes?' : 'Clear all weigh-ins?'}
          </Typography>
        </div>
        <Typography variant="body" color="var(--text-secondary)" style={{ marginBottom: '20px', fontSize: '14px' }}>
          {language === 'es'
            ? 'Esta acción eliminará todos los registros de peso y métricas corporales actuales. Esta acción no se puede deshacer.'
            : 'This will remove all current body weight and composition logs. This action cannot be undone.'}
        </Typography>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setShowClearModal(false)} style={{ flex: 1 }}>
            {t('cancel', language)}
          </Button>
          <Button variant="danger" onClick={handleClearAllLogs} style={{ flex: 1 }}>
            {language === 'es' ? 'Limpiar Todo' : 'Clear All'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
