"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UnavailabilityList } from '@/components/unavailability/unavailability-list';
import { UnavailabilityCreateDialog } from '@/components/unavailability/unavailability-create-dialog';
import { UnavailabilityFilterDialog, type UnavailabilityFilters } from '@/components/unavailability/unavailability-filter-dialog';
import { Filter, Plus } from 'lucide-react';

export function UnavailabilityClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<UnavailabilityFilters>({});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          New request
        </Button>
        <Button variant="outline" onClick={() => setFilterOpen(true)}>
          <Filter className="mr-2 size-4" />
          Filters
        </Button>
      </div>
      <UnavailabilityList filters={filters} />
      <UnavailabilityCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UnavailabilityFilterDialog open={filterOpen} onOpenChange={setFilterOpen} value={filters} onApply={setFilters} />
    </div>
  );
}
