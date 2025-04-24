
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Moon className="h-5 w-5" />
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
