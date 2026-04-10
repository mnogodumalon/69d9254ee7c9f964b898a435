import { useDashboardData } from '@/hooks/useDashboardData';
import type { BenutzerRollen } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BenutzerRollenDialog } from '@/components/dialogs/BenutzerRollenDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconUsers, IconUserCheck, IconUserPlus, IconSearch,
  IconPencil, IconTrash, IconPlus, IconBuildingCommunity,
  IconShieldCheck, IconRobot, IconEye, IconStar,
} from '@tabler/icons-react';

const APPGROUP_ID = '69d9254ee7c9f964b898a435';
const REPAIR_ENDPOINT = '/claude/build/repair';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700 border-red-200', icon: <IconShieldCheck size={14} className="shrink-0" /> },
  facilitator: { label: 'Facilitator', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <IconStar size={14} className="shrink-0" /> },
  curator: { label: 'Curator', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <IconBuildingCommunity size={14} className="shrink-0" /> },
  ai_support: { label: 'AI-Support', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <IconRobot size={14} className="shrink-0" /> },
  contributor: { label: 'Contributor', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <IconUserCheck size={14} className="shrink-0" /> },
  viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <IconEye size={14} className="shrink-0" /> },
};

const ROLE_ORDER = ['admin', 'facilitator', 'curator', 'ai_support', 'contributor', 'viewer'];

function getRoleConfig(key?: string) {
  if (!key) return { label: 'Keine Rolle', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <IconUsers size={14} className="shrink-0" /> };
  return ROLE_CONFIG[key] ?? { label: key, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <IconUsers size={14} className="shrink-0" /> };
}

export default function DashboardOverview() {
  const { benutzerRollen, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BenutzerRollen | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BenutzerRollen | null>(null);

  const filtered = useMemo(() => {
    let list = benutzerRollen;
    if (filterRole) list = list.filter(u => u.fields.rolle?.key === filterRole);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        [u.fields.vorname, u.fields.nachname, u.fields.email, u.fields.abteilung]
          .some(v => v?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [benutzerRollen, search, filterRole]);

  const grouped = useMemo(() => {
    const map = new Map<string, BenutzerRollen[]>();
    for (const role of ROLE_ORDER) map.set(role, []);
    map.set('_none', []);
    for (const u of filtered) {
      const key = u.fields.rolle?.key ?? '_none';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    return map;
  }, [filtered]);

  const activeCount = useMemo(() => benutzerRollen.filter(u => u.fields.aktiv).length, [benutzerRollen]);
  const roleOptions = LOOKUP_OPTIONS['benutzer_&_rollen']?.rolle ?? [];

  const handleEdit = (u: BenutzerRollen) => { setEditRecord(u); setDialogOpen(true); };
  const handleCreate = () => { setEditRecord(null); setDialogOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteBenutzerRollenEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6 pb-10">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Benutzer gesamt"
          value={String(benutzerRollen.length)}
          description="Alle Mitglieder"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktiv"
          value={String(activeCount)}
          description="Aktive Konten"
          icon={<IconUserCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Rollen"
          value={String(new Set(benutzerRollen.map(u => u.fields.rolle?.key).filter(Boolean)).size)}
          description="Verschiedene Rollen"
          icon={<IconShieldCheck size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Abteilungen"
          value={String(new Set(benutzerRollen.map(u => u.fields.abteilung).filter(Boolean)).size)}
          description="Org-Bereiche"
          icon={<IconBuildingCommunity size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Name, E-Mail, Abteilung..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterRole(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterRole === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-accent'}`}
          >
            Alle
          </button>
          {roleOptions.map(opt => {
            const cfg = getRoleConfig(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => setFilterRole(filterRole === opt.key ? null : opt.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterRole === opt.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-accent'}`}
              >
                {cfg.icon}
                {cfg.label}
                <span className="ml-0.5 opacity-60">
                  {benutzerRollen.filter(u => u.fields.rolle?.key === opt.key).length}
                </span>
              </button>
            );
          })}
        </div>

        <Button size="sm" className="ml-auto shrink-0" onClick={handleCreate}>
          <IconPlus size={15} className="mr-1 shrink-0" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Directory — grouped by role */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
          <p className="text-muted-foreground text-sm">Keine Benutzer gefunden.</p>
          <Button size="sm" variant="outline" onClick={handleCreate}>
            <IconUserPlus size={15} className="mr-1" />
            Ersten Benutzer anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {ROLE_ORDER.map(roleKey => {
            const members = grouped.get(roleKey) ?? [];
            if (members.length === 0) return null;
            const cfg = getRoleConfig(roleKey);
            return (
              <RoleGroup
                key={roleKey}
                roleKey={roleKey}
                cfg={cfg}
                members={members}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            );
          })}
          {/* Unassigned */}
          {(grouped.get('_none') ?? []).length > 0 && (
            <RoleGroup
              roleKey="_none"
              cfg={{ label: 'Ohne Rolle', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <IconUsers size={14} className="shrink-0" /> }}
              members={grouped.get('_none')!}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <BenutzerRollenDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateBenutzerRollenEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createBenutzerRollenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['BenutzerRollen']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Benutzer löschen"
        description={`Soll "${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface RoleGroupProps {
  roleKey: string;
  cfg: { label: string; color: string; icon: React.ReactNode };
  members: BenutzerRollen[];
  onEdit: (u: BenutzerRollen) => void;
  onDelete: (u: BenutzerRollen) => void;
}

function RoleGroup({ roleKey: _roleKey, cfg, members, onEdit, onDelete }: RoleGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </span>
        <span className="text-xs text-muted-foreground">{members.length} {members.length === 1 ? 'Person' : 'Personen'}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {members.map(u => (
          <UserCard key={u.record_id} user={u} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: BenutzerRollen;
  onEdit: (u: BenutzerRollen) => void;
  onDelete: (u: BenutzerRollen) => void;
}) {
  const cfg = getRoleConfig(user.fields.rolle?.key);
  const initials = [user.fields.vorname?.[0], user.fields.nachname?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground truncate">
            {[user.fields.vorname, user.fields.nachname].filter(Boolean).join(' ') || '—'}
          </p>
          {user.fields.abteilung && (
            <p className="text-xs text-muted-foreground truncate">{user.fields.abteilung}</p>
          )}
        </div>
      </div>

      {user.fields.email && (
        <a
          href={`mailto:${user.fields.email}`}
          className="text-xs text-primary truncate hover:underline"
          onClick={e => e.stopPropagation()}
        >
          {user.fields.email}
        </a>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap mt-auto">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {user.fields.aktiv === false && (
            <Badge variant="outline" className="text-xs text-muted-foreground px-1.5">Inaktiv</Badge>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={14} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Löschen"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32 rounded-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Starte Reparatur...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte die Seite neu laden.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Nochmal versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Repariere...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte Support kontaktieren.</p>}
    </div>
  );
}
