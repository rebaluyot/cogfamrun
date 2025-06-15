import React from 'react';
import { DatePicker as DatePickerOriginal } from "@/components/ui/date-picker";
import { DatePicker as DatePickerReexport } from "@/components/DatePickerReexport";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";

// This file is just used to test the DatePicker imports
export function TestDatePickerLoading() {
  console.log("DatePicker Loading Test:");
  console.log("Original DatePicker:", !!DatePickerOriginal);
  console.log("Re-exported DatePicker:", !!DatePickerReexport);
  
  const CurrentDatePicker = DatePickerOriginal || DatePickerReexport || SimpleDatePicker;
  
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-2xl font-bold mb-4">DatePicker Test</h2>
      <p>Using: {CurrentDatePicker.name || "Unknown"}</p>
      {CurrentDatePicker && (
        <CurrentDatePicker 
          date={new Date()} 
          onSelect={(date) => console.log("Date selected:", date)} 
        />
      )}
    </div>
  );
}
