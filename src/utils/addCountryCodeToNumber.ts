import { countries } from 'countries-list';

export const addCountryCodeToNumber = (s: string, countryCode: string) =>
	(s.startsWith('+')
		? s
		: '+' +
		  countries[countryCode as keyof typeof countries].phone +
		  s.replace(/^./, '')
	).replace(/[- ]/g, '');
