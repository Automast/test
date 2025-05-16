// utils/auth-check.ts
export const checkOnboardingStatus = async () => {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('No token found');
    }
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      const result = await response.json();
  
      if (!result.success) {
        throw new Error('Invalid token');
      }
  
      return {
        isAuthenticated: true,
        onboardingComplete: result.data.user.onboardingComplete,
        user: result.data.user,
        merchant: result.data.merchant
      };
    } catch (error) {
      throw error;
    }
  };