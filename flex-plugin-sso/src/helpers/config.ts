interface Companies {
  [key: string]: string;
}

// If you dont have the concept of multiple BPOs or multiple companies managing your contact-center,
// just delete the entries below, leaving an empty object like "companies = {}", this will
// hide some UI elements related to the "Company", as you dont need.
export const companies: Companies = {
  'bpo-spain': 'BPO in Spain',
  'bpo-germany': 'BPO in Germany',
};

export const hasManyCompanies = Object.keys(companies).length > 0;
