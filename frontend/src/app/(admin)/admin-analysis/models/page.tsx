'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, PageHeader } from '@/features/admin/shared';
import { getAdminModelCatalog, updateAdminModelCatalogItem } from '@/services/admin.service';
import type { CatalogSku } from '@/types/ai-catalog';
import type { TierType } from '@/services/auth.service';

type TimeRange = '7d' | '30d' | '90d';

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

export default function AdminModelsPage() {
  const [items, setItems] = useState<CatalogSku[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CatalogDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminModelCatalog();
      const data = response.items ?? [];
      setItems(data);
      setDrafts(
        Object.fromEntries(data.map((item) => [item.sku_id, buildDraft(item)])),
      );
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
    const enabled = items.filter((item) => item.is_enabled).length;
    const visible = items.filter((item) => item.is_visible).length;
    const selectable = items.filter((item) => item.is_user_selectable).length;
    const native = items.filter((item) => item.billing_channel === 'native').length;
    const proxy = items.filter((item) => item.billing_channel === 'proxy').length;
    return { enabled, visible, selectable, native, proxy };
  }, [items]);

  const updateDraft = (skuId: string, patch: Partial<CatalogDraft>) => {
    setDrafts((current) => ({
      ...current,
      [skuId]: {
        ...current[skuId],
        ...patch,
      },
    }));
  };

  const handleSave = async (skuId: string) => {
    const draft = drafts[skuId];
    if (!draft) {
      return;
    }
    setSavingId(skuId);
    setError(null);
    try {
      await updateAdminModelCatalogItem(skuId, draft);
      await fetchCatalog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '更新模型目录失败');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-[1800px] space-y-6 bg-[#f4f4f0] px-8 py-8">
      <PageHeader
        title="模型目录管理"
        description={`平台 SKU 目录与计费元数据。当前 ${items.length} 个 SKU。`}
        action={(
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-none border px-3 py-2 text-xs shadow-sm ${
                  timeRange === range
                    ? 'border-[#002045] bg-[#002045] text-white'
                    : 'border-[#c4c6cf] bg-[#f4f4f0] text-[#002045]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      />

      {error ? (
        <div className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => void fetchCatalog()} className="text-xs underline">
              重新加载
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#74777f]">ENABLED</div>
          <div className="mt-2 text-2xl font-bold text-[#002045]">{summary.enabled}</div>
        </div>
        <div className="border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#74777f]">VISIBLE</div>
          <div className="mt-2 text-2xl font-bold text-[#002045]">{summary.visible}</div>
        </div>
        <div className="border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#74777f]">SELECTABLE</div>
          <div className="mt-2 text-2xl font-bold text-[#002045]">{summary.selectable}</div>
        </div>
        <div className="border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#74777f]">NATIVE</div>
          <div className="mt-2 text-2xl font-bold text-[#002045]">{summary.native}</div>
        </div>
        <div className="border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#74777f]">PROXY</div>
          <div className="mt-2 text-2xl font-bold text-[#002045]">{summary.proxy}</div>
        </div>
      </div>

      <section className="overflow-hidden rounded-none border border-[#c4c6cf] bg-[#f4f4f0] shadow-sm">
        <div className="border-b border-[#c4c6cf] px-5 py-4">
          <h2 className="font-serif text-xl font-bold text-[#002045]">平台级模型 SKU 目录</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c4c6cf]">
                {['SKU', '平台 / 厂商', '展示名', '账单通道', '价格 / 百万 Token', '开关', '保存'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-mono text-[10px] tracking-widest text-[#002045]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, row) => (
                  <tr key={row} className="border-b border-[#ddd8cf]">
                    {Array.from({ length: 7 }).map((__, col) => (
                      <td key={col} className="px-4 py-3">
                        <div className="h-3 w-24 animate-pulse bg-[#e1ded1]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState title="暂无模型目录" description="当前没有可展示的模型 SKU。" />
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const draft = drafts[item.sku_id] ?? buildDraft(item);
                  return (
                    <tr key={item.sku_id} className="border-b border-[#ddd8cf] align-top last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs text-[#002045]">
                        <div>{item.sku_id}</div>
                        <div className="mt-1 text-[#74777f]">{item.model_id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#43474e]">
                        <div>{item.provider}</div>
                        <div className="mt-1 text-xs text-[#74777f]">{item.vendor} · {item.family_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <input
                            value={draft.display_name}
                            onChange={(e) => updateDraft(item.sku_id, { display_name: e.target.value })}
                            className="w-full border border-[#c4c6cf] bg-white px-2 py-1 text-sm"
                          />
                          <select
                            value={draft.required_tier}
                            onChange={(e) => updateDraft(item.sku_id, { required_tier: e.target.value as TierType })}
                            className="w-full border border-[#c4c6cf] bg-white px-2 py-1 text-xs"
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="pro_plus">pro_plus</option>
                            <option value="ultra">ultra</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#43474e]">
                        <div>{item.billing_channel}</div>
                        <div className="mt-1 text-xs text-[#74777f]">{item.task_family}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            value={draft.input_price_cny_per_million}
                            onChange={(e) => updateDraft(item.sku_id, { input_price_cny_per_million: Number(e.target.value) })}
                            className="w-full border border-[#c4c6cf] bg-white px-2 py-1 text-xs"
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={draft.output_price_cny_per_million}
                            onChange={(e) => updateDraft(item.sku_id, { output_price_cny_per_million: Number(e.target.value) })}
                            className="w-full border border-[#c4c6cf] bg-white px-2 py-1 text-xs"
                          />
                          <input
                            value={draft.price_source}
                            onChange={(e) => updateDraft(item.sku_id, { price_source: e.target.value })}
                            placeholder="价格来源"
                            className="w-full border border-[#c4c6cf] bg-white px-2 py-1 text-xs"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid gap-2 text-xs text-[#43474e]">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draft.is_enabled}
                              onChange={(e) => updateDraft(item.sku_id, { is_enabled: e.target.checked })}
                            />
                            启用
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draft.is_visible}
                              onChange={(e) => updateDraft(item.sku_id, { is_visible: e.target.checked })}
                            />
                            可见
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draft.is_user_selectable}
                              onChange={(e) => updateDraft(item.sku_id, { is_user_selectable: e.target.checked })}
                            />
                            用户可选
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={draft.is_fallback_only}
                              onChange={(e) => updateDraft(item.sku_id, { is_fallback_only: e.target.checked })}
                            />
                            仅 fallback
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void handleSave(item.sku_id)}
                          disabled={savingId === item.sku_id}
                          className="border border-[#002045] bg-[#002045] px-3 py-1.5 text-xs text-white shadow-sm disabled:opacity-50"
                        >
                          {savingId === item.sku_id ? '保存中...' : '保存'}
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
    </div>
  );
}
