'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ConfirmDialog,
  EmptyState,
  KpiCard,
  PageHeader,
  TableSkeletonRows,
} from '@/features/admin/shared';
import { getAdminModelCatalog, updateAdminModelCatalogItem } from '@/services/admin.service';
import type { CatalogSku } from '@/types/ai-catalog';
import type { TierType } from '@/services/auth.service';

interface CatalogDraft {
  display_name: string;
  required_tier: TierType;
  is_enabled: boolean;
  is_visible: boolean;
  is_user_selectable: boolean;
  is_fallback_only: boolean;
  input_price_cny_per_million: number;
  output_price_cny_per_million: number;
  price_source: string;
  sort_order: number;
}

function buildDraft(item: CatalogSku): CatalogDraft {
  return {
    display_name: item.display_name,
    required_tier: item.required_tier,
    is_enabled: item.is_enabled,
    is_visible: item.is_visible,
    is_user_selectable: item.is_user_selectable,
    is_fallback_only: item.is_fallback_only,
    input_price_cny_per_million: item.input_price_cny_per_million,
    output_price_cny_per_million: item.output_price_cny_per_million,
    price_source: item.price_source ?? '',
    sort_order: item.sort_order,
  };
}

function isDraftDirty(draft: CatalogDraft, original: CatalogSku): boolean {
  return (
    draft.display_name !== original.display_name ||
    draft.required_tier !== original.required_tier ||
    draft.is_enabled !== original.is_enabled ||
    draft.is_visible !== original.is_visible ||
    draft.is_user_selectable !== original.is_user_selectable ||
    draft.is_fallback_only !== original.is_fallback_only ||
    draft.input_price_cny_per_million !== original.input_price_cny_per_million ||
    draft.output_price_cny_per_million !== original.output_price_cny_per_million ||
    draft.price_source !== (original.price_source ?? '') ||
    draft.sort_order !== original.sort_order
  );
}

const TIER_LABELS: Record<string, string> = {
  free: '免费',
  pro: '专业版',
  pro_plus: '增强版',
  ultra: '旗舰版',
};

export function AdminModelsPageView() {
  const [items, setItems] = useState<CatalogSku[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CatalogDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmSkuId, setConfirmSkuId] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminModelCatalog();
      const data = response.items ?? [];
      setItems(data);
      setDrafts(Object.fromEntries(data.map((item) => [item.sku_id, buildDraft(item)])));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取模型目录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const summary = useMemo(() => {
    const enabled = items.filter((i) => i.is_enabled).length;
    const visible = items.filter((i) => i.is_visible).length;
    const selectable = items.filter((i) => i.is_user_selectable).length;
    const native = items.filter((i) => i.billing_channel === 'native').length;
    const proxy = items.filter((i) => i.billing_channel === 'proxy').length;
    return { enabled, visible, selectable, native, proxy };
  }, [items]);

  const updateDraft = (skuId: string, patch: Partial<CatalogDraft>) => {
    setDrafts((cur) => ({ ...cur, [skuId]: { ...cur[skuId], ...patch } }));
  };

  const handleSaveConfirm = async () => {
    if (!confirmSkuId) return;
    const draft = drafts[confirmSkuId];
    if (!draft) return;
    setSavingId(confirmSkuId);
    setConfirmSkuId(null);
    setError(null);
    try {
      await updateAdminModelCatalogItem(confirmSkuId, draft);
      await fetchCatalog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '更新模型目录失败');
    } finally {
      setSavingId(null);
    }
  };

  const confirmItem = confirmSkuId ? items.find((i) => i.sku_id === confirmSkuId) : null;
  const confirmDraft = confirmSkuId ? drafts[confirmSkuId] : null;

  return (
    <div className="mx-auto min-h-full max-w-[1600px] space-y-6 px-6 py-6">
      <PageHeader
        title="模型目录管理"
        description={`平台 SKU 目录与计费元数据，当前 ${items.length} 个 SKU`}
      />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => void fetchCatalog()} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-card px-4 py-1.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10">重试</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="已启用" value={String(summary.enabled)} sub={`共 ${items.length} 个 SKU`} />
        <KpiCard label="可见" value={String(summary.visible)} />
        <KpiCard label="用户可选" value={String(summary.selectable)} />
        <KpiCard label="Native" value={String(summary.native)} />
        <KpiCard label="Proxy" value={String(summary.proxy)} />
      </div>

      <section className="admin-table-container">
        <div className="admin-table-header flex items-center justify-between">
          <h2 className="scholarly-label text-foreground/70" style={{ fontSize: '11px' }}>平台级模型 SKU 目录</h2>
          <span className="text-[11px] font-medium text-muted-foreground/50 tracking-wider">TOTAL: {items.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-left border-collapse">
            <thead>
              <tr>
                {['SKU / 模型', '平台 / 厂商', '展示名 / 等级', '账单通道', '价格 (¥/百万Token)', '开关', '操作'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={6} cols={7} />
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="p-12"><EmptyState title="暂无模型目录" description="当前没有可展示的模型 SKU。" /></td></tr>
              ) : (
                items.map((item) => {
                  const draft = drafts[item.sku_id] ?? buildDraft(item);
                  const dirty = isDraftDirty(draft, item);
                  const saving = savingId === item.sku_id;
                  return (
                    <tr key={item.sku_id} className="align-top">
                      <td>
                        <div className="font-mono text-[12px] font-bold text-foreground">{item.sku_id}</div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground/60">{item.model_id}</div>
                      </td>
                      <td className="text-muted-foreground/80">
                        <div className="font-semibold">{item.provider}</div>
                        <div className="mt-1 text-[11px] opacity-70">{item.vendor} · {item.family_name}</div>
                      </td>
                      <td>
                        <div className="space-y-2 min-w-[180px]">
                          <input value={draft.display_name} onChange={(e) => updateDraft(item.sku_id, { display_name: e.target.value })} className="admin-input admin-input-sm" />
                          <select value={draft.required_tier} onChange={(e) => updateDraft(item.sku_id, { required_tier: e.target.value as TierType })} className="admin-input admin-input-sm cursor-pointer">
                            {Object.entries(TIER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="text-muted-foreground/80">
                        <div className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">{item.billing_channel}</div>
                        <div className="mt-1.5 text-[11px] opacity-70">{item.task_family}</div>
                      </td>
                      <td>
                        <div className="grid gap-2 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground/40 w-4">IN</span>
                            <input type="number" step="0.0001" value={draft.input_price_cny_per_million} onChange={(e) => updateDraft(item.sku_id, { input_price_cny_per_million: Number(e.target.value) })} className="admin-input admin-input-sm font-mono" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground/40 w-4">OUT</span>
                            <input type="number" step="0.0001" value={draft.output_price_cny_per_million} onChange={(e) => updateDraft(item.sku_id, { output_price_cny_per_million: Number(e.target.value) })} className="admin-input admin-input-sm font-mono" />
                          </div>
                          <input value={draft.price_source} onChange={(e) => updateDraft(item.sku_id, { price_source: e.target.value })} placeholder="价格来源" className="admin-input admin-input-sm" style={{ fontSize: '11px' }} />
                        </div>
                      </td>
                      <td>
                        <div className="grid gap-2 text-[12px]">
                          {([['is_enabled', '启用'], ['is_visible', '可见'], ['is_user_selectable', '用户可选'], ['is_fallback_only', '仅 fallback']] as const).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2.5 cursor-pointer group/label">
                              <div className="relative flex h-4 w-4 items-center justify-center">
                                <input type="checkbox" checked={draft[key]} onChange={(e) => updateDraft(item.sku_id, { [key]: e.target.checked })} className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-border/60 bg-card transition-all checked:border-primary checked:bg-primary" />
                                <span className="material-symbols-outlined pointer-events-none absolute text-[12px] text-primary-foreground opacity-0 peer-checked:opacity-100">check</span>
                              </div>
                              <span className="text-muted-foreground/70 transition-colors group-hover/label:text-foreground">{label}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => setConfirmSkuId(item.sku_id)}
                          disabled={!dirty || saving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          {saving ? (
                            <><span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span></>
                          ) : '保存'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={!!confirmSkuId}
        title="确认保存模型配置"
        description={confirmItem ? `即将更新 ${confirmItem.display_name} (${confirmItem.sku_id}) 的配置，此操作将直接修改数据库并立即生效。` : ''}
        confirmLabel="确认保存"
        cancelLabel="取消"
        variant="warning"
        loading={!!savingId}
        onConfirm={() => void handleSaveConfirm()}
        onCancel={() => setConfirmSkuId(null)}
      >
        {confirmDraft && confirmItem && (
          <div className="scholarly-code mt-4 max-h-48 overflow-y-auto">
            {confirmDraft.display_name !== confirmItem.display_name && <div className="flex justify-between border-b border-border/20 pb-1 mb-1"><span>展示名:</span> <span className="font-bold">{confirmItem.display_name} → {confirmDraft.display_name}</span></div>}
            {confirmDraft.required_tier !== confirmItem.required_tier && <div className="flex justify-between border-b border-border/20 pb-1 mb-1"><span>等级:</span> <span className="font-bold">{confirmItem.required_tier} → {confirmDraft.required_tier}</span></div>}
            {confirmDraft.is_enabled !== confirmItem.is_enabled && <div className="flex justify-between border-b border-border/20 pb-1 mb-1"><span>启用:</span> <span className="font-bold">{String(confirmItem.is_enabled)} → {String(confirmDraft.is_enabled)}</span></div>}
            {confirmDraft.is_visible !== confirmItem.is_visible && <div className="flex justify-between border-b border-border/20 pb-1 mb-1"><span>可见:</span> <span className="font-bold">{String(confirmItem.is_visible)} → {String(confirmDraft.is_visible)}</span></div>}
            {confirmDraft.input_price_cny_per_million !== confirmItem.input_price_cny_per_million && <div className="flex justify-between border-b border-border/20 pb-1 mb-1"><span>输入价格:</span> <span className="font-bold">{confirmItem.input_price_cny_per_million} → {confirmDraft.input_price_cny_per_million}</span></div>}
            {confirmDraft.output_price_cny_per_million !== confirmItem.output_price_cny_per_million && <div className="flex justify-between"><span>输出价格:</span> <span className="font-bold">{confirmItem.output_price_cny_per_million} → {confirmDraft.output_price_cny_per_million}</span></div>}
          </div>
        )}
      </ConfirmDialog>

    </div>
  );
}
