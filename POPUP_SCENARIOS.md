# Popup/Modal Scenarios - Soul Seam Ecommerce

## Overview
This document lists all popup/modal scenarios across the ecommerce platform, organized by page/section. Each popup specifies:
- **Trigger Point**: When it appears
- **Purpose**: Why it's needed
- **Popup Type**: confirmation / info / warning / success
- **Design**: Global reusable popup OR Custom popup (Order Success only)

---

## 1. HEADER / NAVIGATION

### 1.1 Track Order Popup
- **Trigger Point**: User clicks "Track Your Order" button in header
- **Purpose**: Inform user about redirecting to external tracking site
- **Popup Type**: Info
- **Design**: Global reusable popup
- **Status**: ✅ Implemented (TrackOrderModal using GlobalModal)

---

## 2. PRODUCT PAGE

### 2.1 Size Selection Warning
- **Trigger Point**: User clicks "Add to Cart" or "Buy Now" without selecting size
- **Purpose**: Remind user to select size before proceeding
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently shows inline error, should be popup

### 2.2 Out of Stock Warning
- **Trigger Point**: User tries to add out-of-stock item to cart
- **Purpose**: Inform user item is unavailable
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented (currently disabled button)

### 2.3 Quantity Limit Warning
- **Trigger Point**: User tries to add more items than available stock
- **Purpose**: Inform user about stock limitation
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented (currently disabled button)

### 2.4 Add to Cart Success
- **Trigger Point**: Item successfully added to cart
- **Purpose**: Confirm successful addition
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast - current implementation)
- **Status**: ✅ Implemented (Toast notification)

---

## 3. CART PAGE

### 3.1 Remove Item Confirmation
- **Trigger Point**: User clicks remove/delete icon on cart item
- **Purpose**: Confirm deletion to prevent accidental removal
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented (currently removes immediately)

### 3.2 Clear Cart Confirmation
- **Trigger Point**: User attempts to clear entire cart (if feature exists)
- **Purpose**: Prevent accidental cart clearing
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 3.3 Coupon Application Success
- **Trigger Point**: Coupon successfully applied
- **Purpose**: Show discount amount and savings
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ⚠️ Currently inline display, could be popup

### 3.4 Coupon Application Error
- **Trigger Point**: Invalid/expired coupon code entered
- **Purpose**: Inform user why coupon failed
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently inline error, should be popup

### 3.5 Add Message Modal
- **Trigger Point**: User clicks "Add a Message 💌" button
- **Purpose**: Allow user to add personal message to order
- **Popup Type**: Info (form modal)
- **Design**: Custom modal (currently implemented inline)
- **Status**: ✅ Implemented (custom modal in cart page)

### 3.6 Empty Cart Warning
- **Trigger Point**: User tries to proceed to checkout with empty cart
- **Purpose**: Prevent checkout with no items
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented (redirects to empty cart state)

---

## 4. CHECKOUT PAGE

### 4.1 Guest Checkout Info
- **Trigger Point**: Guest user proceeds without login
- **Purpose**: Inform about benefits of creating account
- **Popup Type**: Info
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 4.2 Shipping Address Validation Error
- **Trigger Point**: Invalid shipping address entered
- **Purpose**: Show validation errors
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently inline validation

### 4.3 Delivery Not Available Warning
- **Trigger Point**: Delivery not available to entered pincode
- **Purpose**: Inform user about delivery limitation
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 4.4 Payment Method Selection Info
- **Trigger Point**: User selects payment method (COD/Online)
- **Purpose**: Show payment terms and conditions
- **Popup Type**: Info
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 4.5 Payment Gateway Error
- **Trigger Point**: Payment gateway fails to initialize
- **Purpose**: Inform user about payment error
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 4.6 Order Placement Confirmation
- **Trigger Point**: Before final order submission
- **Purpose**: Final confirmation before placing order
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 4.7 Order Success Modal
- **Trigger Point**: Order successfully placed and payment confirmed
- **Purpose**: Celebrate successful order with animation
- **Popup Type**: Success
- **Design**: Custom popup (OrderSuccessModal)
- **Status**: ✅ Implemented (OrderSuccessModal with confetti)

### 4.8 Payment Verification Failed
- **Trigger Point**: Payment completed but verification fails
- **Purpose**: Inform user about verification issue
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

---

## 5. PROFILE / ACCOUNT PAGE

### 5.1 Logout Confirmation
- **Trigger Point**: User clicks logout button
- **Purpose**: Confirm logout to prevent accidental sign-out
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses confirm() - should be GlobalModal

### 5.2 Delete Address Confirmation
- **Trigger Point**: User clicks delete on saved address
- **Purpose**: Confirm deletion to prevent accidental removal
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses confirm() - should be GlobalModal

### 5.3 Profile Update Success
- **Trigger Point**: Profile information successfully updated
- **Purpose**: Confirm successful update
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.4 Profile Update Error
- **Trigger Point**: Profile update fails
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.5 Address Save Success
- **Trigger Point**: Address successfully saved
- **Purpose**: Confirm successful save
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.6 Address Save Error
- **Trigger Point**: Address save fails or validation error
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.7 Address Validation Error
- **Trigger Point**: Invalid address fields entered
- **Purpose**: Show validation errors
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.8 Payment Initialization Error
- **Trigger Point**: Failed to initialize payment for COD order
- **Purpose**: Inform user about payment error
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.9 Payment Success
- **Trigger Point**: Payment successfully completed for COD order
- **Purpose**: Confirm successful payment
- **Popup Type**: Success
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.10 Exchange Request Success
- **Trigger Point**: Exchange request successfully submitted
- **Purpose**: Confirm successful submission
- **Popup Type**: Success
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 5.11 Exchange Request Modal
- **Trigger Point**: User clicks "REQUEST EXCHANGE" button on delivered order
- **Purpose**: Collect exchange details and video upload
- **Popup Type**: Info (form modal)
- **Design**: Custom modal (ExchangeRequestModal)
- **Status**: ✅ Implemented (ExchangeRequestModal)

### 5.12 Return Request Modal
- **Trigger Point**: User clicks return button on eligible order
- **Purpose**: Collect return details and mandatory video upload
- **Popup Type**: Info (form modal)
- **Design**: Custom modal (ReturnRequestModal)
- **Status**: ✅ Implemented (ReturnRequestModal)

### 5.13 Exchange Eligibility Error
- **Trigger Point**: User tries to exchange ineligible order
- **Purpose**: Inform user why exchange is not available
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented (currently inline message)

---

## 6. AUTHENTICATION PAGES

### 6.1 Login Error
- **Trigger Point**: Invalid credentials or login failure
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup (or Toast)
- **Status**: ✅ Implemented (Toast notification)

### 6.2 Login Success
- **Trigger Point**: Successful login
- **Purpose**: Confirm successful login
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ✅ Implemented (Toast notification)

### 6.3 Registration Error
- **Trigger Point**: Registration fails (duplicate email/phone, validation error)
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup (or Toast)
- **Status**: ❌ Check implementation

### 6.4 Registration Success
- **Trigger Point**: Successful registration
- **Purpose**: Confirm successful registration
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ❌ Check implementation

### 6.5 Forgot Password Info
- **Trigger Point**: User clicks "Forgot password" link
- **Purpose**: Inform about password reset process
- **Popup Type**: Info
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 6.6 OTP Verification Error
- **Trigger Point**: Invalid OTP entered
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup (or Toast)
- **Status**: ❌ Check implementation

### 6.7 OTP Verification Success
- **Trigger Point**: OTP successfully verified
- **Purpose**: Confirm successful verification
- **Popup Type**: Success
- **Design**: Global reusable popup (or Toast)
- **Status**: ❌ Check implementation

### 6.8 Session Expired Warning
- **Trigger Point**: User session expires during checkout/order
- **Purpose**: Inform user to login again
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

---

## 7. ADMIN PANEL

### 7.1 Delete Product Confirmation
- **Trigger Point**: Admin clicks delete on product
- **Purpose**: Confirm deletion to prevent accidental removal
- **Popup Type**: Confirmation
- **Design**: AdminConfirmModal (custom for admin)
- **Status**: ✅ Implemented (AdminConfirmModal)

### 7.2 Delete Coupon Confirmation
- **Trigger Point**: Admin clicks delete on coupon
- **Purpose**: Confirm deletion
- **Popup Type**: Confirmation
- **Design**: AdminConfirmModal
- **Status**: ❌ Check implementation

### 7.3 Delete Reel Confirmation
- **Trigger Point**: Admin clicks delete on reel
- **Purpose**: Confirm deletion
- **Popup Type**: Confirmation
- **Design**: AdminConfirmModal
- **Status**: ❌ Check implementation

### 7.4 Order Status Update Success
- **Trigger Point**: Order status successfully updated
- **Purpose**: Confirm successful update
- **Popup Type**: Success
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.5 Order Status Update Error
- **Trigger Point**: Order status update fails
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.6 Exchange Status Update Confirmation
- **Trigger Point**: Admin approves/rejects exchange request
- **Purpose**: Confirm action before updating status
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses confirm() - should be popup

### 7.7 Exchange Status Update Success
- **Trigger Point**: Exchange status successfully updated
- **Purpose**: Confirm successful update
- **Popup Type**: Success
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.8 Exchange Status Update Error
- **Trigger Point**: Exchange status update fails
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.9 Return Status Update Success
- **Trigger Point**: Return status successfully updated
- **Purpose**: Confirm successful update
- **Popup Type**: Success
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.10 Return Status Update Error
- **Trigger Point**: Return status update fails
- **Purpose**: Show error message
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ⚠️ Currently uses alert() - should be popup

### 7.11 Admin Logout Confirmation
- **Trigger Point**: Admin clicks logout
- **Purpose**: Confirm logout
- **Popup Type**: Confirmation
- **Design**: Global reusable popup
- **Status**: ❌ Check implementation

---

## 8. GENERAL / GLOBAL

### 8.1 Network Error
- **Trigger Point**: API request fails due to network issue
- **Purpose**: Inform user about connectivity problem
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 8.2 Session Timeout Warning
- **Trigger Point**: User session about to expire
- **Purpose**: Warn user to save work or extend session
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 8.3 Unsaved Changes Warning
- **Trigger Point**: User tries to navigate away with unsaved changes
- **Purpose**: Prevent data loss
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

### 8.4 Browser Compatibility Warning
- **Trigger Point**: User on unsupported browser
- **Purpose**: Inform about browser compatibility
- **Popup Type**: Warning
- **Design**: Global reusable popup
- **Status**: ❌ Not implemented

---

## SUMMARY

### Design Distribution:
- **Global Reusable Popup (GlobalModal)**: ~85% of scenarios
- **Custom Popups**: 
  - OrderSuccessModal (order success with animation)
  - ExchangeRequestModal (form with video upload)
  - ReturnRequestModal (form with video upload)
  - AdminConfirmModal (admin-specific confirmations)
  - Cart Message Modal (inline custom modal)

### Implementation Status:
- ✅ **Fully Implemented**: 8 scenarios
- ⚠️ **Partially Implemented** (using alerts/confirms): 25 scenarios
- ❌ **Not Implemented**: 30+ scenarios

### Priority Recommendations:
1. **High Priority**: Replace all `alert()` and `confirm()` with GlobalModal
2. **High Priority**: Add confirmation popups for destructive actions (delete, logout)
3. **Medium Priority**: Add success/info popups for better UX feedback
4. **Low Priority**: Add edge case warnings (network errors, session timeout)

---

## NOTES

- **Order Success Modal**: Keep as custom popup due to special animation requirements
- **Form Modals** (Exchange/Return): Keep as custom modals due to complex form requirements
- **Admin Confirm Modal**: Can be replaced with GlobalModal if desired, or keep separate for admin-specific styling
- **Toast Notifications**: Some success messages can remain as toasts for non-blocking feedback
- **Inline Errors**: Some validation errors can remain inline, but critical errors should be popups
