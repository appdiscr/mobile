# Manual Testing Checklist

Use this checklist before each release to ensure critical user flows work correctly.

## Pre-Testing Setup

- [ ] iOS Simulator is running
- [ ] Android Emulator is running (if testing Android)
- [ ] `.env` file is configured with Supabase credentials
- [ ] Supabase project is accessible (check dashboard)

## Authentication Flows

### Sign Up Flow

- [ ] **Empty Form Submission**
  - Tap "Create Account" with all fields empty
  - ✅ Should show validation errors for all required fields
  - ✅ Errors should be red and clearly visible

- [ ] **Invalid Email Format**
  - Enter "notanemail" in email field
  - Enter valid password in both password fields
  - Tap "Create Account"
  - ✅ Should show "Please enter a valid email" error

- [ ] **Password Too Short**
  - Enter valid email
  - Enter "1234567" (7 characters) in password field
  - Enter same in confirm password field
  - Tap "Create Account"
  - ✅ Should show "Password must be at least 8 characters" error

- [ ] **Passwords Don't Match**
  - Enter valid email
  - Enter "password123" in password field
  - Enter "password456" in confirm password field
  - Tap "Create Account"
  - ✅ Should show "Passwords do not match" error

- [ ] **Valid Sign Up**
  - Enter valid email (e.g., `test@example.com`)
  - Enter valid password (8+ characters)
  - Enter matching confirm password
  - Tap "Create Account"
  - ✅ Should show success message
  - ✅ Should redirect to sign-in screen

- [ ] **Duplicate Email**
  - Try signing up again with the same email
  - ✅ Should show error message from Supabase

### Sign In Flow

- [ ] **Empty Form Submission**
  - Tap "Sign In" with all fields empty
  - ✅ Should show validation errors for email and password

- [ ] **Invalid Email Format**
  - Enter "notanemail" in email field
  - Enter any password
  - Tap "Sign In"
  - ✅ Should show "Please enter a valid email" error

- [ ] **Wrong Credentials**
  - Enter valid email that doesn't exist
  - Enter any password
  - Tap "Sign In"
  - ✅ Should show authentication error from Supabase

- [ ] **Valid Sign In**
  - Enter email from previous sign up
  - Enter correct password
  - Tap "Sign In"
  - ✅ Should show loading indicator
  - ✅ Should navigate to main app (tabs)
  - ✅ Should not show sign-in screen anymore

### Navigation

- [ ] **Sign Up to Sign In Link**
  - From sign-up screen, tap "Already have an account? Sign in"
  - ✅ Should navigate to sign-in screen

- [ ] **Sign In to Sign Up Link**
  - From sign-in screen, tap "Don't have an account? Sign up"
  - ✅ Should navigate to sign-up screen

### Session Persistence

- [ ] **Stay Logged In After App Restart**
  - Sign in successfully
  - Close the app completely (not just minimize)
  - Reopen the app
  - ✅ Should go directly to main app (tabs)
  - ✅ Should NOT show sign-in screen

- [ ] **Sign Out**
  - While logged in, find and tap sign out button (if implemented)
  - ✅ Should clear session
  - ✅ Should redirect to sign-in screen
  - ✅ Reopening app should show sign-in screen

### Google OAuth (When Implemented)

- [ ] **Google Sign In**
  - Tap "Sign in with Google"
  - ✅ Should open system browser
  - ✅ Should show Google login page
  - Complete Google login
  - ✅ Should redirect back to app
  - ✅ Should navigate to main app (tabs)

- [ ] **Google Sign Up**
  - From sign-up screen, tap "Sign up with Google"
  - ✅ Should work same as Google sign in

## UI/UX Checks

### Visual

- [ ] **Loading States**
  - During sign in/up, verify loading indicator shows
  - ✅ Button should be disabled during loading
  - ✅ ActivityIndicator should be visible

- [ ] **Error Messages**
  - All error messages are clearly visible
  - ✅ Red color for errors
  - ✅ Positioned under relevant input field

- [ ] **Keyboard Behavior**
  - Tap input field
  - ✅ Keyboard should appear
  - ✅ Input field should not be hidden by keyboard
  - ✅ Can scroll if needed (sign-up screen)

### Accessibility

- [ ] **Text Readability**
  - All text is readable at normal font size
  - ✅ Sufficient contrast between text and background

- [ ] **Touch Targets**
  - All buttons are easy to tap
  - ✅ No accidental taps on nearby elements

## Cross-Platform Testing (If Testing Both)

### iOS

- [ ] All authentication flows work on iOS
- [ ] Keyboard dismisses properly
- [ ] Safe area insets respected (notch, home indicator)

### Android

- [ ] All authentication flows work on Android
- [ ] Back button behavior is correct
- [ ] Keyboard dismisses properly

## Edge Cases

- [ ] **Network Issues**
  - Turn off WiFi
  - Try to sign in
  - ✅ Should show appropriate error message
  - Turn WiFi back on
  - ✅ Retry should work

- [ ] **Special Characters in Password**
  - Use password with special chars: `P@ssw0rd!123`
  - ✅ Should work for sign up and sign in

- [ ] **Long Email Address**
  - Use very long email: `verylongemailaddress@example.com`
  - ✅ Should not overflow UI
  - ✅ Should work correctly

## Performance

- [ ] **Sign In Speed**
  - Time from tap to navigation
  - ✅ Should complete in < 3 seconds on good network

- [ ] **App Startup**
  - Cold start when logged in
  - ✅ Should reach main app in < 2 seconds

## Notes Section

Use this space to record any issues found during testing:

**Date:** ___

**Tester:** ___

**Platform:** [ ] iOS [ ] Android

**Issues Found:**

- (Add issues here)
