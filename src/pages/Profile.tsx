import { Layout } from "@/components/layout";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

const Profile = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  // Function to get initials from name
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  // Handle loading and signed-out states
  if (!isLoaded) {
    return (
      <Layout>
        <div className="p-6 lg:p-12 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">User Profile</h1>
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-64" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isSignedIn || !user) {
     return (
      <Layout>
        <div className="p-6 lg:p-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">User Profile</h1>
          <p>Please sign in to view your profile.</p>
          {/* Optionally add a sign-in button here */}
        </div>
      </Layout>
    );
  }

  // Display user data
  return (
    <Layout>
      <div className="p-6 lg:p-12 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">User Profile</h1>
        <Card className="w-full max-w-2xl border border-gray-200 shadow-md">
          <CardHeader className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b">
             <Avatar className="h-16 w-16 text-xl">
                <AvatarImage src={user.imageUrl} alt={user.fullName ?? 'User'} />
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
             </Avatar>
             <div>
               <CardTitle className="text-2xl">{user.fullName ?? "N/A"}</CardTitle>
               <p className="text-sm text-muted-foreground">
                 {user.primaryEmailAddress?.emailAddress ?? "No primary email"}
               </p>
             </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
             <div className="flex justify-between">
               <span className="font-medium text-muted-foreground">First Name:</span>
               <span>{user.firstName ?? "N/A"}</span>
             </div>
             <div className="flex justify-between">
               <span className="font-medium text-muted-foreground">Last Name:</span>
               <span>{user.lastName ?? "N/A"}</span>
             </div>
             <div className="flex justify-between">
               <span className="font-medium text-muted-foreground">Primary Phone:</span>
               <span>{user.primaryPhoneNumber?.phoneNumber ?? "N/A"}</span>
             </div>
             <div className="flex justify-between">
               <span className="font-medium text-muted-foreground">User ID:</span>
               <span className="text-xs">{user.id}</span>
             </div>
             {/* Note: Clerk doesn't store 'age' by default. 
                 You'd need custom fields/metadata in Clerk for that. */}
          </CardContent>
        </Card>
         {/* Optionally add a link/button to Clerk's hosted profile management */}
         {/* <Button variant="outline" className="mt-6" onClick={() => clerk.openUserProfile()}>Manage Account</Button> */}
      </div>
    </Layout>
  );
};

export default Profile;