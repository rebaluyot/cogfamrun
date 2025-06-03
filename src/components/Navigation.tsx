import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Registration", path: "/registration" },
    { name: "Admin", path: "/admin" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex w-full justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-6 hover:opacity-90 transition-opacity">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border shadow-sm">
                <img 
                  src="/assets/solid-fam-run-logo.png" 
                  alt="SOLID FAM RUN 2025" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="font-bold text-xl leading-tight">COG Solid FamRun</h1>
                <p className="text-sm text-muted-foreground leading-tight">2025</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={isActive(item.path) ? "bg-primary hover:bg-primary/90" : ""}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
            {isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="flex items-center gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-base"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="absolute left-0 top-full w-full border-b bg-background p-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive(item.path) ? "bg-primary hover:bg-primary/90" : ""
                    }`}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
              {isAuthenticated && (
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full justify-start flex items-center gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </nav>
  );
};
