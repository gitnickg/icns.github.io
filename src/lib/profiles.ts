import profilesData from '../data/profiles.json';

/**
 * `footer`: show as an icon link in the site footer.
 * `terminal`: list in the terminal's `profiles` command.
 */
export type Profile = { id: string; name: string; handle: string; url: string; footer?: boolean; terminal?: boolean };

export function loadProfiles(): Profile[] {
  return (profilesData as Profile[]).map((p) => ({ ...p }));
}
