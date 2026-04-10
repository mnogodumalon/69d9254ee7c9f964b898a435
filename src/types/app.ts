// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface BenutzerRollen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    rolle?: LookupValue;
    abteilung?: string;
    notizen?: string;
    aktiv?: boolean;
  };
}

export const APP_IDS = {
  BENUTZER_ROLLEN: '69d9251c96a5b1f9951dc8af',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'benutzer_&_rollen': {
    rolle: [{ key: "facilitator", label: "Facilitator" }, { key: "curator", label: "Curator" }, { key: "ai_support", label: "AI-Support" }, { key: "admin", label: "Admin" }, { key: "viewer", label: "Viewer" }, { key: "contributor", label: "Contributor" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'benutzer_&_rollen': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'rolle': 'lookup/select',
    'abteilung': 'string/text',
    'notizen': 'string/textarea',
    'aktiv': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateBenutzerRollen = StripLookup<BenutzerRollen['fields']>;