import { getSettings } from "@/app/actions";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500">
          Customize how the AI writes for you and what your generated images look like.
        </p>
      </header>
      <SettingsForm initial={settings} />
    </div>
  );
}
