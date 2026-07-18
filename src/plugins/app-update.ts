import { registerPlugin } from '@capacitor/core';

export interface AppUpdatePlugin {
  downloadAndInstall(options: { url: string }): Promise<void>;
}

export const AppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate');
