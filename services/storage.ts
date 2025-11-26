import { Preferences } from '@capacitor/preferences';
import { Note, SoundType } from '../types';
import { INITIAL_NOTES } from '../constants';

const STORAGE_KEY_PREFIX = 'chronos_storage_';

export const StorageKeys = {
    NOTES: `${STORAGE_KEY_PREFIX}notes`,
    LANG: `${STORAGE_KEY_PREFIX}lang`,
    CRT: `${STORAGE_KEY_PREFIX}crt`,
    SOUND: `${STORAGE_KEY_PREFIX}sound`,
    VOLUME: `${STORAGE_KEY_PREFIX}volume`,
    SOUND_TYPE: `${STORAGE_KEY_PREFIX}sound_type`,
    HAPTIC: `${STORAGE_KEY_PREFIX}haptic`,
    IMAGE_STYLE: `${STORAGE_KEY_PREFIX}image_style`,
    SCREENSHOT: `${STORAGE_KEY_PREFIX}screenshot`,
    SCREENSHOT_SPLIT: `${STORAGE_KEY_PREFIX}screenshot_split`,
    SCREENSHOT_MARGIN: `${STORAGE_KEY_PREFIX}screenshot_margin`,
    SMART_ANALYSIS: `${STORAGE_KEY_PREFIX}smart_analysis`,
    MIGRATED: `${STORAGE_KEY_PREFIX}migrated_v1`,
};

export const StorageService = {
    // --- Migration Logic ---
    async migrateFromLocalStorage(): Promise<void> {
        const { value } = await Preferences.get({ key: StorageKeys.MIGRATED });
        if (value === 'true') return;

        console.log("Starting migration from localStorage to Preferences...");

        const keysToMigrate = [
            { key: StorageKeys.NOTES, type: 'json' },
            { key: StorageKeys.LANG, type: 'string' },
            { key: StorageKeys.CRT, type: 'boolean' },
            { key: StorageKeys.SOUND, type: 'boolean' },
            { key: StorageKeys.VOLUME, type: 'number' },
            { key: StorageKeys.SOUND_TYPE, type: 'string' },
            { key: StorageKeys.HAPTIC, type: 'boolean' },
            { key: StorageKeys.IMAGE_STYLE, type: 'boolean' },
            { key: StorageKeys.SCREENSHOT, type: 'boolean' },
            { key: StorageKeys.SCREENSHOT_SPLIT, type: 'boolean' },
            { key: StorageKeys.SCREENSHOT_MARGIN, type: 'boolean' },
            { key: StorageKeys.SMART_ANALYSIS, type: 'boolean' },
        ];

        for (const item of keysToMigrate) {
            const localValue = localStorage.getItem(item.key);
            if (localValue !== null) {
                await Preferences.set({ key: item.key, value: localValue });
            }
        }

        await Preferences.set({ key: StorageKeys.MIGRATED, value: 'true' });
        console.log("Migration completed.");

        // Optional: Clear localStorage after successful migration? 
        // Keeping it for safety for now, or maybe clear it to avoid confusion.
        // localStorage.clear(); 
    },

    // --- Notes ---
    async saveNotes(notes: Note[]): Promise<void> {
        await Preferences.set({
            key: StorageKeys.NOTES,
            value: JSON.stringify(notes),
        });
    },

    async loadNotes(): Promise<Note[]> {
        const { value } = await Preferences.get({ key: StorageKeys.NOTES });
        if (value) {
            try {
                return JSON.parse(value);
            } catch (e) {
                console.error("Failed to parse notes:", e);
                return INITIAL_NOTES;
            }
        }
        return INITIAL_NOTES;
    },

    // --- Settings Helpers ---
    async saveSetting(key: string, value: any): Promise<void> {
        await Preferences.set({
            key,
            value: String(value),
        });
    },

    async loadSetting<T>(key: string, defaultValue: T, parser?: (val: string) => T): Promise<T> {
        const { value } = await Preferences.get({ key });
        if (value === null) return defaultValue;
        if (parser) return parser(value);

        // Default basic parsers
        if (typeof defaultValue === 'boolean') return (value === 'true') as unknown as T;
        if (typeof defaultValue === 'number') return parseFloat(value) as unknown as T;
        return value as unknown as T;
    }
};
