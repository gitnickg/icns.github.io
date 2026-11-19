import profilesData from '../data/profiles.json';

/** `footer`: also show this profile as an icon link in the site footer. */
export type Profile = { id: string; name: string; handle: string; url: string; footer?: boolean };

export function loadProfiles(): Profile[] {
  return (profilesData as Profile[]).map((p) => ({ ...p }));
}
