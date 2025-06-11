"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleDatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  className?: string;
}

export function SimpleDatePicker({ date, onSelect, className }: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="relative">
      {/* Button that mimics the DatePicker trigger */}
      <Button
        variant={"outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : <span>Pick a date</span>}
      </Button>
      
      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute mt-2 z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              onSelect(selected);
              setIsOpen(false);
            }}
            initialFocus
          />
          <div className="mt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Close
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                onSelect(undefined);
                setIsOpen(false);
              }}
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
