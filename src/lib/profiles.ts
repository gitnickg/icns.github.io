import profilesData from '../data/profiles.json';

export type Profile = { id: string; name: string; handle: string; url: string };

export function loadProfiles(): Profile[] {
  return (profilesData as Profile[]).map((p) => ({ ...p }));
}
