import React from "react";
import { Fixture } from "@/lib/types/fixture";
import { Tag } from "@/lib/types/measurement";
import { Badge } from "../ui/badge";
import { Tag as TagIcon } from "lucide-react";

interface FixtureSummaryProps {
  fixtures: Fixture[];
  tags: Tag[];
}

export const FixtureSummary: React.FC<FixtureSummaryProps> = ({
  fixtures,
  tags,
}) => {
  if (fixtures.length === 0) return null;

  // Group fixtures by tag
  const fixturesByTag = fixtures.reduce((acc, fixture) => {
    const tagId = fixture.tag?.id || "untagged";
    if (!acc[tagId]) {
      acc[tagId] = {
        tag: fixture.tag,
        fixtures: [],
        count: 0,
      };
    }
    acc[tagId].fixtures.push(fixture);
    acc[tagId].count += 1;
    return acc;
  }, {} as Record<string, { tag?: { id: string; name: string; color: string }; fixtures: Fixture[]; count: number }>);

  // Calculate total count
  const totalCount = fixtures.length;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Fixture Count Summary</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(fixturesByTag).map(([tagId, data]) => (
          <div
            key={tagId}
            className="bg-primary/5 border border-primary/20 rounded-md px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {data.tag ? (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: data.tag.color,
                      color: "white",
                      borderColor: data.tag.color,
                    }}
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {data.tag.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Untagged
                  </span>
                )}
              </div>
            </div>
            <div className="text-xl font-semibold text-primary">
              {data.count} {data.count === 1 ? "fixture" : "fixtures"}
            </div>
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">
            Total Fixtures
          </span>
          <span className="text-2xl font-bold text-primary">
            {totalCount} {totalCount === 1 ? "fixture" : "fixtures"}
          </span>
        </div>
      </div>
    </div>
  );
};

