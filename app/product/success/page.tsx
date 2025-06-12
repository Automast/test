// app/product/success/page.tsx
'use client'; // This page component must be client-rendered to import and render the child client component

import SuccessRedirectComponent from './SuccessRedirectComponent';

// The main page component is minimal and just renders the client-side logic component
const SuccessPage = () => {
  return <SuccessRedirectComponent />;
};

export default SuccessPage;