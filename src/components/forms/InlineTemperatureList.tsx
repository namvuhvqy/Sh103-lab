"use client";

import React, { useState } from "react";
import { InlineTemperatureCard, InlineOccurrence } from "./InlineTemperatureCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CircleAlert } from "lucide-react";

interface InlineTemperatureListProps {
  initialOccurrences: InlineOccurrence[];
}

export function InlineTemperatureList({ initialOccurrences }: InlineTemperatureListProps) {
  const [occurrences, setOccurrences] = useState<InlineOccurrence[]>(initialOccurrences);

  const handleSaved = (occId: string, temp: number | null, hum: number | null) => {
    setOccurrences((prev) =>
      prev.map((occ) =>
        occ.id === occId
          ? {
              ...occ,
              status: temp != null ? "FULFILLED" : "PENDING",
              initialTemperature: temp,
              initialHumidity: hum,
            }
          : occ
      )
    );
  };

  const doneCount = occurrences.filter((o) => o.initialTemperature != null).length;
  const totalCount = occurrences.length;

  return (
    <section className="space-y-4">
      {/* Thanh trạng thái tiến độ nhanh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Ghi nhận nhiệt độ trực tiếp</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Chạm nhập số trực tiếp · Tự động lưu &amp; kiểm tra ngưỡng tức thì
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {doneCount}/{totalCount} đã đo
          </span>
        </div>
      </div>

      {occurrences.length ? (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {occurrences.map((occ) => (
            <InlineTemperatureCard
              key={occ.id}
              occurrence={occ}
              onSaved={handleSaved}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Không có điểm đo"
            description="Không có nghĩa vụ đo nhiệt độ phù hợp với bộ lọc hôm nay."
            icon={<CircleAlert />}
          />
        </div>
      )}
    </section>
  );
}
