"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDatabaseStatus,
  type DatabaseStatus,
} from "@/lib/db/actions";
import { RefreshCw } from "lucide-react";

function formatCell(value: string | number | boolean | null) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
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
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Database
              </CardTitle>
              <p className="text-gray-600">
                Connection status and live table contents.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && !status && (
              <p className="text-gray-500 text-sm">Checking database…</p>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {status && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <div className="mt-2">
                    {status.connected ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                        Connected
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        Not connected
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    DATABASE_URL
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {status.configured ? "Set" : "Missing"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Host
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900 break-all">
                    {status.host ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Database
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {status.database ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {status?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                {status.error}
              </p>
            )}

            {status?.postgresVersion && (
              <p className="text-xs text-gray-500">
                {status.postgresVersion}
                <span className="mx-2">·</span>
                Checked {new Date(status.checkedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {status?.connected && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                Tables
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Switch tabs to inspect each table and its current rows.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={defaultTab} key={defaultTab}>
                <TabsList className="mb-4 flex h-auto flex-wrap">
                  {status.tables.map((table) => (
                    <TabsTrigger key={table.name} value={table.name}>
                      {table.name}
                      <Badge variant="secondary" className="ml-2">
                        {table.exists ? table.rowCount : "missing"}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {status.tables.map((table) => (
                  <TabsContent key={table.name} value={table.name} className="space-y-3">
                    {!table.exists ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-3">
                        Table <code>{table.name}</code> does not exist yet. Run{" "}
                        <code>npm run db:push</code> to create it.
                      </p>
                    ) : table.rows.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Table exists but has no rows.
                      </p>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {table.columns.map((column) => (
                                <TableHead key={column} className="whitespace-nowrap">
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
                                    className="max-w-[240px] truncate font-mono text-xs"
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
        )}
      </div>
    </div>
  );
}
