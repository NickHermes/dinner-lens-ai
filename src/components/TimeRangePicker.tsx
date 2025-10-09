import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useTimeRange, TimeRangeType } from "@/hooks/useTimeRange";

export function TimeRangePicker({
  value,
  onChange,
}: {
  value: TimeRangeType;
  onChange: (v: TimeRangeType) => void;
}) {
  return (
    <Card className="p-2">
      <Tabs value={value} onValueChange={(v) => onChange(v as TimeRangeType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="week">Last Week</TabsTrigger>
          <TabsTrigger value="recent">Last 30 Days</TabsTrigger>
          <TabsTrigger value="year">Last Year</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
        {/* Placeholder for custom later */}
        <TabsContent value="week" />
        <TabsContent value="recent" />
        <TabsContent value="year" />
        <TabsContent value="all" />
      </Tabs>
    </Card>
  );
}

export function useTimeRangeController(initial: TimeRangeType = "month") {
  const { range, setType } = useTimeRange(initial);
  return { range, setType };
}


