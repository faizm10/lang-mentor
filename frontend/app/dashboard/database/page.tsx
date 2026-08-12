"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDatabaseStatus, type DatabaseStatus } from "@/lib/db/actions";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCell(value: string | number | boolean | null) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function StatBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium break-all">{children}</div>
    </div>
  );
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatabaseStatus();
      setStatus(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load database status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultTab = status?.tables[0]?.name ?? "mentor_profiles";

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Database
          </h2>
          <p className="prose-readable mt-1">
            Connection status and live table contents.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
          className="sm:shrink-0"
        >
          <RefreshCw
            className={cn(loading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-4">
          <CardContent className="flex items-start gap-3 px-4">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4">
          {loading && !status ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px] w-full rounded-lg" />
              ))}
            </div>
          ) : null}

          {status ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="Status">
                {status.connected ? (
                  <Badge className="bg-brand-subtle text-brand-subtle-foreground">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not connected</Badge>
                )}
              </StatBlock>
              <StatBlock label="DATABASE_URL">
                {status.configured ? "Set" : "Missing"}
              </StatBlock>
              <StatBlock label="Host">{status.host ?? "—"}</StatBlock>
              <StatBlock label="Database">{status.database ?? "—"}</StatBlock>
            </div>
          ) : null}

          {status?.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {status.error}
            </p>
          ) : null}

          {status?.postgresVersion ? (
            <p className="text-xs text-muted-foreground">
              {status.postgresVersion}
              <span className="mx-2">·</span>
              Checked {new Date(status.checkedAt).toLocaleString()}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {status?.connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tables</CardTitle>
            <p className="text-sm text-muted-foreground">
              Switch tabs to inspect each table and its current rows.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} key={defaultTab}>
              {/* Tab strip scrolls horizontally rather than wrapping awkwardly */}
              <div className="-mx-1 mb-4 overflow-x-auto px-1 pb-1">
                <TabsList className="h-auto w-max">
                  {status.tables.map((table) => (
                    <TabsTrigger key={table.name} value={table.name}>
                      <span className="font-mono text-xs">{table.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {table.exists ? table.rowCount : "missing"}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {status.tables.map((table) => (
                <TabsContent
                  key={table.name}
                  value={table.name}
                  className="space-y-3"
                >
                  {!table.exists ? (
                    <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
                      Table <code className="font-mono">{table.name}</code> does
                      not exist yet. Run{" "}
                      <code className="font-mono">npm run db:push</code> to
                      create it.
                    </p>
                  ) : table.rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Table exists but has no rows.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {table.columns.map((column) => (
                              <TableHead
                                key={column}
                                className="px-3 font-mono text-xs whitespace-nowrap"
                              >
                                {column}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {table.rows.map((row, index) => (
                            <TableRow key={`${table.name}-${index}`}>
                              {table.columns.map((column) => (
                                <TableCell
                                  key={column}
                                  className="max-w-[240px] truncate px-3 font-mono text-xs"
                                  title={formatCell(row[column] ?? null)}
                                >
                                  {formatCell(row[column] ?? null)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
