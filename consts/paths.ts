// consts/paths.ts

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

// **transactions**  
// List and create: GET/POST → /api/finance/transactions  
export const transactionsUrl = `/finance/transactions`;  
// Detail: GET → /api/finance/transactions?id=<id>
export const transactionDetailUrl = `/finance/transactions`;

// products
export const productsUrl = `/products`;
export const productDetailUrl = `/products`;
export const productPublicUrl = `/products/public`;
export const productUpdateStatusUrl = `/products/:id/status`;

// integrations
export const webhooksUrl = `/webhooks`;

// finance (updated for new withdrawal system)
export const payoutsUrl = `/finance/withdrawals`;
export const payoutDetailUrl = `/finance/withdrawals`;
export const payoutAccountsUrl = `/finance/accounts`;
export const withdrawUrl = `/finance/withdraw`;
export const balanceUrl = `/finance/balance`;

// withdrawal config (admin endpoints - may not be directly used in merchant frontend)
export const withdrawConfigUrl = `/admin/withdraw/config`;
export const adminWithdrawalsUrl = `/admin/withdrawals`;

// settings
export const tfaStatusUrl = `/settings/tfa/status`;
export const profileUrl = `/settings/profile`;
export const profileOTPUrl = `/settings/profile/otp`;
export const passwordChangeUrl = `/settings/profile/changepassword`;
export const emailChangeUrl = `/settings/profile/changemail`;
export const mailOTPUrl = `/settings/profile/otpmail`;
export const authenticatorCodeUrl = `/settings/auth/app/code`;
export const authenticatorVerifyUrl = `/settings/auth/app/verify`;