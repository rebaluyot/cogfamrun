/**
 * Test page for theme color implementation
 * This file provides a visual demonstration of the theme color system
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { hexToHSL } from "@/lib/color-utils";

const ThemeTestPage: React.FC = () => {
  const [currentColors, setCurrentColors] = useState({
    primaryHex: '',
    primaryHSL: '',
    secondaryHex: '',
    secondaryHSL: '',
  });

  // Read the current theme colors from CSS variables on component mount
  useEffect(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryHex = computedStyle.getPropertyValue('--primary-color').trim();
    const secondaryHex = computedStyle.getPropertyValue('--secondary-color').trim();
    
    setCurrentColors({
      primaryHex,
      primaryHSL: computedStyle.getPropertyValue('--primary').trim(),
      secondaryHex,
      secondaryHSL: computedStyle.getPropertyValue('--secondary').trim(),
    });
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Theme Color Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Current Theme Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Current Theme Colors</CardTitle>
            <CardDescription>Colors currently applied to the application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Primary Color</h3>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-md shadow-sm"
                    style={{ backgroundColor: currentColors.primaryHex }}
                  />
                  <div>
                    <p>HEX: {currentColors.primaryHex}</p>
                    <p>HSL: {currentColors.primaryHSL}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Secondary Color</h3>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-md shadow-sm"
                    style={{ backgroundColor: currentColors.secondaryHex }}
                  />
                  <div>
                    <p>HEX: {currentColors.secondaryHex}</p>
                    <p>HSL: {currentColors.secondaryHSL}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Color Change Tester */}
        <Card>
          <CardHeader>
            <CardTitle>Color Change Tester</CardTitle>
            <CardDescription>Change colors locally to test the theme system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={currentColors.primaryHex}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        document.documentElement.style.setProperty('--primary-color', newColor);
                        document.documentElement.style.setProperty('--primary', hexToHSL(newColor));
                        setCurrentColors(prev => ({
                          ...prev,
                          primaryHex: newColor,
                          primaryHSL: hexToHSL(newColor)
                        }));
                      }}
                      className="w-full h-10 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={currentColors.secondaryHex}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        document.documentElement.style.setProperty('--secondary-color', newColor);
                        document.documentElement.style.setProperty('--secondary', hexToHSL(newColor));
                        setCurrentColors(prev => ({
                          ...prev,
                          secondaryHex: newColor,
                          secondaryHSL: hexToHSL(newColor)
                        }));
                      }}
                      className="w-full h-10 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Changes made here are temporary and won't be saved to the database.
                  Use the App Settings page to make permanent changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Theme Component Preview */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Component Preview</CardTitle>
          <CardDescription>See how components look with current theme colors</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tailwind" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="tailwind">Tailwind Classes</TabsTrigger>
              <TabsTrigger value="css-vars">CSS Variables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tailwind" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle>Primary Color</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Using bg-primary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This card uses Tailwind's primary color</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary">Action</Button>
                  </CardFooter>
                </Card>
                
                <Card className="bg-secondary text-secondary-foreground">
                  <CardHeader>
                    <CardTitle>Secondary Color</CardTitle>
                    <CardDescription className="text-secondary-foreground/80">Using bg-secondary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This card uses Tailwind's secondary color</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="destructive">Action</Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Button className="w-full" variant="default">Primary Button</Button>
                <Button className="w-full" variant="secondary">Secondary Button</Button>
                <Button className="w-full" variant="outline">Outline Button</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="css-vars" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                  <CardHeader>
                    <CardTitle>Primary Color</CardTitle>
                    <CardDescription style={{ color: 'rgba(255,255,255,0.8)' }}>Using --primary-color</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This card uses the CSS variable directly</p>
                  </CardContent>
                  <CardFooter>
                    <button
                      style={{
                        backgroundColor: 'var(--secondary-color)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      Action
                    </button>
                  </CardFooter>
                </Card>
                
                <Card style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
                  <CardHeader>
                    <CardTitle>Secondary Color</CardTitle>
                    <CardDescription style={{ color: 'rgba(255,255,255,0.8)' }}>Using --secondary-color</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>This card uses the CSS variable directly</p>
                  </CardContent>
                  <CardFooter>
                    <button
                      style={{
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      Action
                    </button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    width: '100%'
                  }}
                >
                  CSS Variable Button
                </button>
                <button
                  className="w-full py-2 px-4 rounded-md text-white"
                  style={{ backgroundColor: 'var(--secondary-color)' }}
                >
                  Hybrid Button
                </button>
                <button
                  className="w-full bg-primary-custom text-white py-2 px-4 rounded-md"
                >
                  Custom Class Button
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>
          All theme implementation issues have been resolved. See{' '}
          <a href="/docs/THEME-SYSTEM-STATUS.md" className="underline">THEME-SYSTEM-STATUS.md</a>{' '}
          for full documentation.
        </p>
      </div>
    </div>
  );
};

export default ThemeTestPage;
