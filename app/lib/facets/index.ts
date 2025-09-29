import genresData from './genres.json';
import tonesData from './tones.json';
import ageGroupsData from './ageGroups.json';

export interface FacetOption {
  value: string;
  label: string;
  description: string;
}

export interface GenreOption extends FacetOption {}

export interface ToneOption extends FacetOption {
  category:
    | 'positif'
    | 'neutre'
    | 'reflexif'
    | 'intense'
    | 'sombre'
    | 'critique'
    | 'artistique';
}

export interface AgeGroupOption extends FacetOption {
  minAge: number;
  maxAge: number | null;
  category: 'enfance' | 'jeunesse' | 'adulte' | 'universel';
}

// Export raw data
export const genres: GenreOption[] = genresData.genres as GenreOption[];
export const tones: ToneOption[] = tonesData.tones as ToneOption[];
export const ageGroups: AgeGroupOption[] =
  ageGroupsData.ageGroups as AgeGroupOption[];

// Utility functions
export const getGenreByValue = (value: string): GenreOption | undefined => {
  return genres.find((genre) => genre.value === value);
};

export const getToneByValue = (value: string): ToneOption | undefined => {
  return tones.find((tone) => tone.value === value);
};

export const getAgeGroupByValue = (
  value: string
): AgeGroupOption | undefined => {
  return ageGroups.find((ageGroup) => ageGroup.value === value);
};

export const getTonesByCategory = (
  category: ToneOption['category']
): ToneOption[] => {
  return tones.filter((tone) => tone.category === category);
};

export const getAgeGroupsByCategory = (
  category: AgeGroupOption['category']
): AgeGroupOption[] => {
  return ageGroups.filter((ageGroup) => ageGroup.category === category);
};

// Get age groups suitable for a specific age
export const getAgeGroupsForAge = (age: number): AgeGroupOption[] => {
  return ageGroups.filter((ageGroup) => {
    const withinMin = age >= ageGroup.minAge;
    const withinMax = ageGroup.maxAge === null || age <= ageGroup.maxAge;
    return withinMin && withinMax;
  });
};

// Search functions
export const searchGenres = (query: string): GenreOption[] => {
  const lowercaseQuery = query.toLowerCase();
  return genres.filter(
    (genre) =>
      genre.label.toLowerCase().includes(lowercaseQuery) ||
      genre.description.toLowerCase().includes(lowercaseQuery) ||
      genre.value.toLowerCase().includes(lowercaseQuery)
  );
};

export const searchTones = (query: string): ToneOption[] => {
  const lowercaseQuery = query.toLowerCase();
  return tones.filter(
    (tone) =>
      tone.label.toLowerCase().includes(lowercaseQuery) ||
      tone.description.toLowerCase().includes(lowercaseQuery) ||
      tone.value.toLowerCase().includes(lowercaseQuery)
  );
};

export const searchAgeGroups = (query: string): AgeGroupOption[] => {
  const lowercaseQuery = query.toLowerCase();
  return ageGroups.filter(
    (ageGroup) =>
      ageGroup.label.toLowerCase().includes(lowercaseQuery) ||
      ageGroup.description.toLowerCase().includes(lowercaseQuery) ||
      ageGroup.value.toLowerCase().includes(lowercaseQuery)
  );
};
