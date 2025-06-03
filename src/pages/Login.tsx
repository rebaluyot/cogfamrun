import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    }
    
    setLoading(false);
  };

  return (
    <div className="-mt-16 min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img 
              src="/assets/solid-fam-run-logo.png" 
              alt="SOLID FAM RUN 2025" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>
            Enter your credentials to manage the FamRun event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="border-border/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-6 p-4 rounded-lg border border-border/50 bg-muted/50">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">This is a secure site. Input you access id and assigned pin code</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
