"use client"

import React from 'react';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Instead of trying to dynamically import, let's create a direct implementation
// This avoids any import issues completely by reimplementing the DatePicker component
interface DatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  className,
}: DatePickerProps) {
  console.log("Using re-implemented DatePicker in DatePickerReexport.tsx");
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
