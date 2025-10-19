import { AccountSettings } from "@/components/AccountSettings";

const Account = () => {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, email, and password
          </p>
        </div>

        <AccountSettings />
      </div>
    </div>
  );
};

export default Account;
