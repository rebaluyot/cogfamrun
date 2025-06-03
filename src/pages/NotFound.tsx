import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background -mt-16">
      <div className="text-center space-y-6">
        <div className="mb-8">
          <img
            src="/assets/solid-fam-run-logo.png"
            alt="SOLID FAM RUN 2025"
            className="h-24 w-auto mx-auto"
          />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Oops! Page not found
          </h2>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't seem to exist.
          </p>
        </div>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
