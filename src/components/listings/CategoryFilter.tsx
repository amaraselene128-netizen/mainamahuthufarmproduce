import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSectionsForType,
  findSection,
  type ListingTypeScope,
} from "@/lib/categories";

export interface CategoryFilterValue {
  /** Section slug ("" / "all" = no filter). */
  section: string;
  /** Category label ("" = no filter). */
  category: string;
  /** Subcategory label ("" = no filter). */
  subcategory: string;
}

interface CategoryFilterProps {
  scope: ListingTypeScope;
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  /** Render compact (3 dropdowns share row width). Defaults to true. */
  compact?: boolean;
}

/**
 * Reusable cascading category filter (Section → Category → Subcategory)
 * driven by the master taxonomy in `src/lib/categories.ts`.
 */
export function CategoryFilter({ scope, value, onChange, compact = true }: CategoryFilterProps) {
  const sections = useMemo(() => getSectionsForType(scope), [scope]);
  const activeSection = useMemo(() => findSection(value.section), [value.section]);
  const activeCategory = useMemo(
    () => activeSection?.categories.find((c) => c.label === value.category),
    [activeSection, value.category],
  );

  const containerClass = compact
    ? "grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 w-full md:w-auto"
    : "grid grid-cols-1 gap-3";

  return (
    <div className={containerClass}>
      {/* Section */}
      <Select
        value={value.section || "all"}
        onValueChange={(v) =>
          onChange({
            section: v === "all" ? "" : v,
            category: "",
            subcategory: "",
          })
        }
      >
        <SelectTrigger className="md:w-44">
          <SelectValue placeholder="All sections" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="all">All sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.slug} value={s.slug}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={value.category || "all"}
        onValueChange={(v) =>
          onChange({
            ...value,
            category: v === "all" ? "" : v,
            subcategory: "",
          })
        }
        disabled={!activeSection}
      >
        <SelectTrigger className="md:w-48">
          <SelectValue placeholder={activeSection ? "All categories" : "Pick section"} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="all">All categories</SelectItem>
          {activeSection?.categories.map((c) => (
            <SelectItem key={c.label} value={c.label}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Subcategory */}
      <Select
        value={value.subcategory || "all"}
        onValueChange={(v) =>
          onChange({ ...value, subcategory: v === "all" ? "" : v })
        }
        disabled={!activeCategory?.subcategories?.length}
      >
        <SelectTrigger className="md:w-48">
          <SelectValue
            placeholder={
              activeCategory?.subcategories?.length ? "All subcategories" : "—"
            }
          />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="all">All subcategories</SelectItem>
          {activeCategory?.subcategories?.map((sc) => (
            <SelectItem key={sc.label} value={sc.label}>
              {sc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
