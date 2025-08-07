"use client";

import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/database/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select"; // اگر این کامپوننت را ندارید، به سادگی با یک <select> بومی جایگزین کنید.
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type Filter = "all" | "success" | "error";

type LogRow = {
  id?: number;
  startedAt: string;
  endedAt: string;
  ok: boolean;
  tryCount: number;
  pushStats?: {
    attempted?: number;
    sent?: number;
    applied?: number;
    conflicts?: number;
    errors?: number;
  } | null;
  pullStats?: {
    contacts?: { upserts?: number; deletes?: number } | null;
    groups?: { upserts?: number; deletes?: number } | null;
    total?: number;
  } | null;
  error?: string | null;

  // فیلدهای telemetry جدید
  endpointUsed?: string;
  lastSyncBefore?: string | null;
  lastSyncAfter?: string | null;
  durationMs?: number;
};

export default function ReportSyncLogs({
  pageSize = 50,
}: {
  pageSize?: number;
}) {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState<number>(pageSize);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let coll = db.sync_logs.orderBy("endedAt").reverse();
      if (filter === "success") {
        const all = await coll.toArray();
        const filtered = all.filter((r) => !!r.ok).slice(0, limit);
        setRows(filtered);
      } else if (filter === "error") {
        const all = await coll.toArray();
        const filtered = all.filter((r) => !r.ok).slice(0, limit);
        setRows(filtered);
      } else {
        const all = await coll.limit(limit).toArray();
        setRows(all);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, limit]);

  // listener برای sync:completed/sync:failed جهت رفرش خودکار + تایمر زنده
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const lazyLoad = () => {
      // رفرش با کمی تاخیر کوتاه برای جلوگیری از چندبار بارگذاری پشت‌سرهم
      if (timer) return;
      timer = setTimeout(() => {
        load();
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      }, 150);
    };

    const onCompleted = () => lazyLoad();
    const onFailed = () => lazyLoad();

    window.addEventListener("sync:completed", onCompleted as EventListener);
    window.addEventListener("sync:failed", onFailed as EventListener);

    // Auto-refresh دوره‌ای سبک هنگام باز بودن تب Advanced
    const auto = setInterval(() => {
      // اگر تب visible است، رفرش سبک انجام بده
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        load();
      }
    }, 10_000);

    return () => {
      window.removeEventListener("sync:completed", onCompleted as EventListener);
      window.removeEventListener("sync:failed", onFailed as EventListener);
      if (auto) clearInterval(auto);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const successCount = useMemo(
    () => rows.filter((r) => !!r.ok).length,
    [rows]
  );
  const errorCount = useMemo(
    () => rows.filter((r) => !r.ok).length,
    [rows]
  );

  // Badge آخرین وضعیت سنک با شمارنده تضاد/خطا
  const latestBadge = useMemo(() => {
    if (!rows.length) return null;
    const last: any = rows[0];

    // تلاش برای خواندن از فیلدهای متداول
    const conflicts =
      last.conflictsCount ??
      last.pushConflicts ??
      last.pushStats?.conflicts ??
      0;

    const errors =
      last.errorsCount ??
      last.pushErrors ??
      last.pushStats?.errors ??
      (last.ok === false ? 1 : 0);

    const isError = errors > 0 || last.ok === false;
    const hasIssues = conflicts > 0 || errors > 0;

    const variant = (isError ? "destructive" : hasIssues ? "secondary" : "default") as
      | "default"
      | "secondary"
      | "destructive";

    const text = isError
      ? `آخرین سنک: خطا${hasIssues ? ` • تضاد: ${conflicts} • خطا: ${errors}` : ""}`
      : hasIssues
      ? `آخرین سنک: موفق با هشدار • تضاد: ${conflicts} • خطا: ${errors}`
      : "آخرین سنک: موفق";

    return <Badge variant={variant}>{text}</Badge>;
  }, [rows]);

  const handleClear = async () => {
    if (!confirm(t("sync.logs.clearConfirm"))) return;
    await db.sync_logs.clear();
    await load();
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "startedAt",
      "endedAt",
      "ok",
      "tryCount",
      "push_attempted",
      "push_sent",
      "push_applied",
      "push_conflicts",
      "push_errors",
      "pull_contacts_upserts",
      "pull_contacts_deletes",
      "pull_groups_upserts",
      "pull_groups_deletes",
      "pull_total",
      "endpointUsed",
      "lastSyncBefore",
      "lastSyncAfter",
      "durationMs",
      "error"
    ];
    const esc = (v: any) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [
      headers.join(","),
      ...rows.map(r => {
        const push = r.pushStats ?? {};
        const pull = r.pullStats ?? {};
        return [
          r.id ?? "",
          r.startedAt ?? "",
          r.endedAt ?? "",
          r.ok ? "1" : "0",
          r.tryCount ?? 0,
          push.attempted ?? 0,
          push.sent ?? 0,
          push.applied ?? 0,
          push.conflicts ?? 0,
          push.errors ?? 0,
          pull.contacts?.upserts ?? 0,
          pull.contacts?.deletes ?? 0,
          pull.groups?.upserts ?? 0,
          pull.groups?.deletes ?? 0,
          pull.total ?? 0,
          r.endpointUsed ?? "",
          r.lastSyncBefore ?? "",
          r.lastSyncAfter ?? "",
          r.durationMs ?? Math.max(0, (new Date(r.endedAt).getTime() - new Date(r.startedAt).getTime())),
          r.error ?? ""
        ].map(esc).join(",");
      })
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `sync-logs-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass p-4 rounded-lg border backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="font-semibold text-lg">{t("sync.logs.title")}</h3>
        {/* Badge وضعیت آخرین سنک */}
        <div className="flex items-center gap-2">
          {latestBadge}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            className="h-9 rounded border px-2 text-sm bg-background"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            aria-label="Filter"
            title="Filter"
          >
            <option value="all">{t("sync.logs.filter.all")}</option>
            <option value="success">{t("sync.logs.filter.success")}</option>
            <option value="error">{t("sync.logs.filter.error")}</option>
          </select>
          <Button type="button" variant="outline" onClick={exportCsv} title={t("sync.logs.exportCsv")}>
            {t("sync.logs.exportCsv")}
          </Button>

          <Input
            type="number"
            min={5}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Math.max(5, Math.min(500, Number(e.target.value) || pageSize)))}
            className="w-24"
            placeholder={t("sync.logs.limit")}
            aria-label={t("sync.logs.limit")}
            title={t("sync.logs.limit")}
          />

          <Button type="button" variant="secondary" onClick={load} disabled={loading}>
            {loading ? t("sync.logs.refreshLoading") : t("sync.logs.refresh")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleClear}>
            {t("sync.logs.clear")}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        {t("sync.logs.summary", { count: rows.length, ok: successCount, err: errorCount })}
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-right">ID</th>
              <th className="p-2 text-right">{t("sync.logs.table.started")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.ended")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.duration")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.status")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.endpoint")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.window")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.push")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.pull")}</th>
              <th className="p-2 text-right">{t("sync.logs.table.error")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-3 text-center text-muted-foreground" colSpan={10}>
                  {t("sync.logs.table.empty")}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const push = r.pushStats ?? {};
                const pull = r.pullStats ?? {};
                const started = new Date(r.startedAt);
                const ended = new Date(r.endedAt);
                const durMs = (typeof r.durationMs === "number" ? r.durationMs : Math.max(0, ended.getTime() - started.getTime()));
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono">{r.id ?? "-"}</td>
                    <td className="p-2">
                      <span title={r.startedAt}>{started.toLocaleString()}</span>
                    </td>
                    <td className="p-2"><span title={r.endedAt}>{ended.toLocaleString()}</span></td>
                    <td className="p-2 font-mono">{durMs}</td>
                    <td className="p-2">
                      <span className={r.ok ? "text-green-600" : "text-red-600"}>
                        {r.ok ? "OK" : "ERR"}
                      </span>
                    </td>
                    <td className="p-2" title={r.endpointUsed ?? ""}>
                      <span className="block max-w-[220px] truncate">{r.endpointUsed ?? "-"}</span>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        <div><span className="text-muted-foreground">before:</span> <span title={r.lastSyncBefore ?? ""}>{r.lastSyncBefore ? new Date(r.lastSyncBefore).toLocaleString() : "-"}</span></div>
                        <div><span className="text-muted-foreground">after:</span> <span title={r.lastSyncAfter ?? ""}>{r.lastSyncAfter ? new Date(r.lastSyncAfter).toLocaleString() : "-"}</span></div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-pre">
                      {(push.attempted ?? 0)}/{(push.sent ?? 0)}/{(push.applied ?? 0)}/{(push.conflicts ?? 0)}/{(push.errors ?? 0)}
                    </td>
                    <td className="p-2 whitespace-pre">
                      {(pull.contacts?.upserts ?? 0)}/{(pull.contacts?.deletes ?? 0)} • {(pull.groups?.upserts ?? 0)}/{(pull.groups?.deletes ?? 0)} • {(pull.total ?? 0)}
                    </td>
                    <td className="p-2 text-red-600 max-w-[320px] truncate" title={r.error ?? ""}>{r.error ?? "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}