export const apiBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}`;

// auth
export const signupUrl = `/auth/register`;
export const signinUrl = `/auth/login`;
export const meUrl = `/auth/me`;
export const sendVerificationEmailUrl = `/auth/send-verification-email`;
export const verifyEmailUrl = `/auth/verify-email`;

// onboarding
export const onboardingBusinessUrl = `/onboarding/business`;
export const onboardingAddressUrl = `/onboarding/address`;
export const onboardingSellingUrl = `/onboarding/selling-method`;

// verification
export const verificationStatusUrl = `/verification/status`;
export const verificationSubmitUrl = `/verification/submit`;

// notifications
export const notiUrl = `/notifications`;

// transactions
export const transactionsUrl = `/transactions`;
export const transactionDetailUrl = `/transactions`;

// products
export const productsUrl = `/products`;
export const productDetailUrl = `/products`;

// integrations
export const webhooksUrl = `/webhooks`;

// finance
export const payoutsUrl = `/payouts`;
export const payoutDetailUrl = `/payouts`;
export const payoutAccountsUrl = `/payouts/accounts`;

// settings
export const tfaStatusUrl = `/settings/tfa/status`;
export const profileUrl = `/settings/profile`;
export const profileOTPUrl = `/settings/profile/otp`;
export const passwordChangeUrl = `/settings/profile/changepassword`;
export const emailChangeUrl = `/settings/profile/changemail`;
export const mailOTPUrl = `/settings/profile/otpmail`;
export const authenticatorCodeUrl = `/settings/auth/app/code`;
export const authenticatorVerifyUrl = `/settings/auth/app/verify`;