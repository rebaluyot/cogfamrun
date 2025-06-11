import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, getCategoryColorClass, getCategoryDescription } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import { EventCountdown } from "@/components/EventCountdown";
import { useAppSettings } from "@/config/app-settings";
import { format } from "date-fns";

const Index = () => {
  const { data: categories, isLoading } = useCategories();
  const { settings } = useAppSettings();

  const races = categories ? categories.map((category) => ({
    distance: category.name,
    price: formatCurrency(category.price),
    description: getCategoryDescription(category.name),
    color: getCategoryColorClass(category.name),
    inclusions: category.inclusions || []
  })) : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-primary/5">
        <div className="container max-w-6xl mx-auto text-center">
              <div className="flex justify-center items-center mx-auto mb-8">
                <div className="w-full max-w-[400px] aspect-rectangle relative">
                  <img 
                    src={settings?.appLogoUrl || "/assets/solid-fam-run-logo.png"} 
                    alt={settings?.appTitle || "SOLID FAM RUN 2025"} 
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
              </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12">
            Join us on {settings?.eventDate ? format(settings.eventDate, "MMMM d, yyyy 'at' h:mm a") : "August 22, 2025 at 5:00 AM"}
          </p>
          
          {/* Countdown Timer */}
          <div className="mb-12">
            <EventCountdown />
          </div>

          <Button asChild size="lg" className="font-semibold">
            <Link to="/registration">Register Now</Link>
          </Button>
        </div>
      </section>

      {/* Race Categories */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Race Categories</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {races.map((race) => (
              <Card key={race.distance} className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className={cn("text-white", race.color.replace("bg-", "bg-gradient-to-r from-"))}>
                  <CardTitle className="text-2xl">{race.distance} Run</CardTitle>
                  <CardDescription className="text-white/90">{race.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold mb-4 text-primary">{race.price}</div>
                  <div className="space-y-2">
                    {race.inclusions.map((inclusion, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        <span className="text-sm text-muted-foreground">{inclusion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Route Information */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Race Routes</h2>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-lg border bg-white">
              <div className="aspect-[16/9] relative">
                <img 
                  src="/assets/routes.png" 
                  alt="Race Routes Map" 
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              </div>
            </div>
            <div className="mt-6 text-center text-muted-foreground">
              <p>All routes start and end at the New Dasmariñas Grandstand and Oval</p>
              <p className="text-sm mt-2">Click on the map to view detailed route information</p>
            </div>
          </div>
        </div>
      </section>

      {/* Freebies Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Race Kit Inclusions</h2>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-lg bg-white">
              <div className="aspect-[16/9] relative">
                <img 
                  src="/assets/freebies.png" 
                  alt="Race Kit Inclusions" 
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              </div>
            </div>
          </div>
          {/* Uncomment this section if you want to display the list of freebies)

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Race Kit Package</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Finisher Medal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Event Singlet</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Water</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Runner Bag</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Finisher Shirt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Race Bib with RFID</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">Important Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <span>Race kit claiming will be available at the venue from 4:00 AM onwards on race day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <span>Bring your registration confirmation and valid ID for race kit claiming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <span>The RFID bib must be properly worn throughout the race for accurate timing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        */}
        </div>
      </section>

      {/* Event Information */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Event Details</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">
                  {settings?.eventDate ? format(settings.eventDate, "MMMM d, yyyy") : "August 22, 2025"}
                </p>
                <p className="text-muted-foreground">
                  Starting at {settings?.eventDate ? format(settings.eventDate, "h:mm a") : "5:00 AM"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">Dasmariñas Grandstand</p>
                <p className="text-muted-foreground">Dasmariñas, Cavite</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">
                  Until {settings?.registrationDeadline ? format(settings.registrationDeadline, "MMMM d, yyyy") : "July 31, 2025"}
                </p>
                <p className="text-muted-foreground">Limited slots available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
