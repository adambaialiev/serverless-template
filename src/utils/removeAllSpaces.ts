export const removeAllSpaces = (s: string) =>
	s.replace(/\(|\)|-/g, '').replace(/\s/g, '');
