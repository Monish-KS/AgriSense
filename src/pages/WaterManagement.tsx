
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Droplets, Cloud, Waves, Timer } from "lucide-react";

const waterData = [
  { month: 'Jan', rainfall: 12, irrigation: 40, requirement: 50 },
  { month: 'Feb', rainfall: 18, irrigation: 35, requirement: 52 },
  { month: 'Mar', rainfall: 25, irrigation: 30, requirement: 55 },
  { month: 'Apr', rainfall: 32, irrigation: 25, requirement: 58 },
  { month: 'May', rainfall: 45, irrigation: 15, requirement: 60 },
  { month: 'Jun', rainfall: 80, irrigation: 0, requirement: 55 },
  { month: 'Jul', rainfall: 95, irrigation: 0, requirement: 50 },
  { month: 'Aug', rainfall: 85, irrigation: 0, requirement: 48 },
  { month: 'Sep', rainfall: 72, irrigation: 0, requirement: 45 },
  { month: 'Oct', rainfall: 45, irrigation: 10, requirement: 42 },
  { month: 'Nov', rainfall: 25, irrigation: 20, requirement: 45 },
  { month: 'Dec', rainfall: 15, irrigation: 30, requirement: 48 },
];

const irrigationSchedule = [
  { day: 'Monday', time: '6:00 AM - 7:30 AM', zone: 'North Field', method: 'Drip Irrigation' },
  { day: 'Wednesday', time: '6:00 AM - 7:30 AM', zone: 'East Field', method: 'Drip Irrigation' },
  { day: 'Friday', time: '6:00 AM - 7:30 AM', zone: 'South Field', method: 'Sprinkler' },
  { day: 'Saturday', time: '5:30 AM - 7:00 AM', zone: 'West Field', method: 'Sprinkler' },
];

export default function WaterManagement() {
  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Water Management</h1>
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Water Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Droplets className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">Efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rainfall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Cloud className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-2xl font-bold">85mm</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Irrigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Waves className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-2xl font-bold">25mm</div>
                  <p className="text-xs text-muted-foreground">Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Next Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Timer className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-xl font-bold">Monday</div>
                  <p className="text-xs text-muted-foreground">6:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Water Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={waterData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: 'Water (mm)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rainfall" stackId="1" stroke="#8884d8" fill="#8884d8" name="Rainfall" />
                    <Area type="monotone" dataKey="irrigation" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Irrigation" />
                    <Area type="monotone" dataKey="requirement" stroke="#ff7300" fill="none" name="Requirement" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Irrigation Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 bg-muted p-3 font-medium">
                  <div>Day</div>
                  <div>Time</div>
                  <div>Zone</div>
                  <div>Method</div>
                </div>
                {irrigationSchedule.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 p-3 border-t">
                    <div>{item.day}</div>
                    <div>{item.time}</div>
                    <div>{item.zone}</div>
                    <div>{item.method}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
