import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EventCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const EVENT_DATE = new Date("2025-08-22T05:00:00"); // Event date set to July 27, 2025 at 6:00 AM

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = EVENT_DATE.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <Card key={unit} className="p-4 text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary">
            {value.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground capitalize">
            {unit}
          </div>
        </Card>
      ))}
    </div>
  );
};
