import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Store, Truck, ShoppingBag, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import dealersData from "../data/dealers_data.json";
import chemicalsData from "../data/chemicals_data.json";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Dealer {
  "Sl No": string;
  "State": string;
  "District": string;
  "No of Wholesalers": string;
  "No of Retailers": string;
}

interface Chemical {
  Item: string;
  Year: number;
  Unit: string;
  Value: number;
}

const markets = [
  { name: "Rajkot APMC", type: "Wholesale", distance: "15.2 km", commodities: "Rice, Wheat, Cotton", currentPrice: "₹ 2,450/quintal (Wheat)" },
  { name: "Gondal Mandi", type: "Wholesale", distance: "22.7 km", commodities: "Rice, Millet, Pulses", currentPrice: "₹ 3,250/quintal (Rice)" },
  { name: "Junagadh Farmers Market", type: "Retail", distance: "35.1 km", commodities: "Vegetables, Fruits, Grains", currentPrice: "₹ 28/kg (Tomatoes)" },
  { name: "Jasdan Agricultural Market", type: "Mixed", distance: "18.5 km", commodities: "All agricultural products", currentPrice: "Varies by product" },
];

// Fisher-Yates (Knuth) Shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export default function SupplyChain() {
  // Shuffle the dealersData before slicing
  const shuffledDealersData = shuffleArray([...dealersData as Dealer[]]);
  const limitedDealersData = shuffledDealersData.slice(0, 5);
  const limitedChemicalsData = (chemicalsData as Chemical[]).slice(0, 5);

  const chemicalChartData = limitedChemicalsData.map(item => ({
    name: item.Year.toString(),
    value: item.Value,
  }));

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Agricultural Supply Chain</h1>

        {/* Tractor Animation Container */}
        <div className="tractor-animation-container">
          <div className="tractor">
            <div className="smoke"></div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closest Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-xl font-bold">5.2 km</div>
                  <p className="text-xs text-muted-foreground">Akshar Seeds Ltd.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closest Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Store className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-xl font-bold">15.2 km</div>
                  <p className="text-xs text-muted-foreground">Rajkot APMC</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Market Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-xl font-bold">₹ 2,450</div>
                  <p className="text-xs text-muted-foreground">Wheat (per quintal)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Logistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="text-xl font-bold">2 Services</div>
                  <p className="text-xs text-muted-foreground">Available nearby</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="suppliers">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suppliers">Suppliers & Services</TabsTrigger>
              <TabsTrigger value="markets">Markets & Buyers</TabsTrigger>
            </TabsList>
            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <CardTitle>Fertilizer Dealers by District (up to 2013-14)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Sl No</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead className="text-right">Wholesalers</TableHead>
                        <TableHead className="text-right">Retailers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {limitedDealersData.map((dealer: Dealer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{dealer["State"]}</TableCell>
                          <TableCell>{dealer["District"]}</TableCell>
                          <TableCell className="text-right">{dealer["No of Wholesalers"]}</TableCell>
                          <TableCell className="text-right">{dealer["No of Retailers"]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="markets">
              <Card>
                <CardHeader>
                  <CardTitle>Agricultural Markets Near You</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 bg-muted p-3 font-medium">
                      <div>Market Name</div>
                      <div>Type</div>
                      <div>Distance</div>
                      <div>Current Prices</div>
                    </div>
                    {markets.map((market, index) => (
                      <div key={index} className="grid grid-cols-4 p-3 border-t hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="font-medium">{market.name}</div>
                        <div>{market.type}</div>
                        <div>{market.distance}</div>
                        <div>{market.currentPrice}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Package className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">Bulk Purchasing</h3>
                    <p className="text-muted-foreground">Coordinate with nearby farmers to make bulk purchases of seeds and fertilizers, potentially saving 15-20% on costs.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Truck className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">Shared Transportation</h3>
                    <p className="text-muted-foreground">Share transportation costs with other farmers in your area when bringing produce to the Rajkot APMC market.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                  <Store className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">Diversify Sales Channels</h3>
                    <p className="text-muted-foreground">Consider selling a portion of your crop directly to consumers at the Junagadh Farmers Market for potentially higher margins.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
