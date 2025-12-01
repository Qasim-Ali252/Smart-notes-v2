# Supabase OTP Configuration

## Enable OTP Code Authentication

By default, Supabase sends magic links. To send 6-digit OTP codes instead, follow these steps:

### Step 1: Go to Supabase Dashboard

1. Visit https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Email Templates**

### Step 2: Configure Email Templates

#### For "Confirm signup" template:

Replace the default template with:

```html
<h2>Confirm your signup</h2>

<p>Your verification code is:</p>

<h1 style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px;">
  {{ .Token }}
</h1>

<p>This code will expire in 60 minutes.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

#### For "Magic Link" template:

Replace with:

```html
<h2>Sign in to Smart Notes</h2>

<p>Your verification code is:</p>

<h1 style="font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px;">
  {{ .Token }}
</h1>

<p>Enter this code in the app to sign in.</p>

<p>This code will expire in 60 minutes.</p>

<p>If you didn't request this, you can safely ignore this email.</p>
```

### Step 3: Update Email Settings

1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Make sure these are enabled:
   - ✅ Enable email confirmations
   - ✅ Enable email OTP

### Step 4: Test It

1. In your app, click "Sign In"
2. Enter your email
3. Click "Send verification code"
4. Check your email - you should now see a 6-digit code like: **123456**
5. Enter the code in the app
6. You're signed in!

---

## Alternative: Use Phone OTP (SMS)

If you want to use phone numbers instead of email:

### Step 1: Enable Phone Auth

1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure an SMS provider (Twilio, MessageBird, etc.)

### Step 2: Update Code

In `SignInDialog.tsx`, change:

```typescript
// From:
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    emailRedirectTo: undefined,
  },
})

// To:
const { error } = await supabase.auth.signInWithOtp({
  phone: phoneNumber, // Use phone instead of email
  options: {
    shouldCreateUser: true,
  },
})
```

---

## Troubleshooting

### Still receiving magic links?

1. **Clear browser cache** and try again
2. **Wait 5 minutes** for Supabase settings to propagate
3. **Check spam folder** - OTP emails might be there
4. **Verify email template** was saved correctly

### OTP not working?

1. Check that email confirmations are enabled
2. Verify the `{{ .Token }}` variable is in the template
3. Make sure you're using the latest Supabase client library
4. Check Supabase logs for errors

### Code expires too quickly?

1. Go to **Authentication** → **Settings**
2. Find "OTP Expiry"
3. Default is 60 minutes (3600 seconds)
4. You can increase this if needed

---

## Email Template Variables

Available variables in Supabase email templates:

- `{{ .Token }}` - The 6-digit OTP code
- `{{ .TokenHash }}` - Hashed token (for magic links)
- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - Magic link URL (don't use if you want OTP only)
- `{{ .Email }}` - User's email address

---

## Production Checklist

Before going live:

- [ ] Custom email templates configured
- [ ] OTP expiry time set appropriately
- [ ] Email provider configured (SendGrid, AWS SES, etc.)
- [ ] Test OTP flow with multiple email providers
- [ ] Rate limiting configured to prevent abuse
- [ ] Email deliverability tested (check spam scores)

---

**After configuring, you'll receive beautiful 6-digit codes instead of magic links!** 🎉
