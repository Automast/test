export const US_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
    { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST/AKDT)' },
    { value: 'America/Adak', label: 'Hawaii-Aleutian Time (HAST/HADT)' },
  ];
  
  export const BR_TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT/BRST)' },
    { value: 'America/Bahia', label: 'Bahia Time (BRT)' },
    { value: 'America/Manaus', label: 'Amazon Time (AMT/AMST)' },
    { value: 'America/Noronha', label: 'Fernando de Noronha Time (FNT)' },
  ];
  
  export const getTimezonesForCountry = (country: 'US' | 'BR') => {
    return country === 'US' ? US_TIMEZONES : BR_TIMEZONES;
  };