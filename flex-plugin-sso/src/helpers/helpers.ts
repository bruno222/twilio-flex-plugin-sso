import { companies } from './config';

export const getCompanyName = (id: string) => {
  if (id === 'internal') {
    return 'Internal';
  }

  if (companies[id]) {
    return companies[id];
  }

  return '';
};
