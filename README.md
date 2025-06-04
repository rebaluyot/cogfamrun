# Welcome to your COG FamRun

## Project info


///////////////////  EmailJS

To complete this enhancement, you'll need to:

Sign up for an EmailJS account at https://www.emailjs.com/
Create an email template for the registration confirmation with QR code
Replace the placeholder values in the QRCodeGenerator component:
YOUR_EMAILJS_PUBLIC_KEY
YOUR_EMAILJS_SERVICE_ID
YOUR_EMAILJS_TEMPLATE_ID
The email template should include:

The enhancements I've made:

Added real QR code generation using the react-qr-code library
Added email functionality using EmailJS to send the registration details and QR code to the participant's email
Added loading state to the Generate QR Code button
Added success/error toasts to notify the user about the email status
The QR code will now be generated with actual data and displayed both on the screen and sent via email. The email will contain all the registration details and the QR code for easy access.

<h1>Registration Confirmation - COG FamRun 2025</h1>
<p>Hello {{participant_name}},</p>
<p>Thank you for registering for COG FamRun 2025! Here are your registration details:</p>

<ul>
  <li>Registration ID: {{registration_id}}</li>
  <li>Category: {{category}}</li>
  <li>Registration Fee: {{price}}</li>
  <li>Shirt Size: {{shirt_size}}</li>
</ul>

<p>Your QR Code: {{qr_code_data}}</p>

<h2>Important Reminders:</h2>
<ul>
  <li>Payment deadline: March 10, 2024</li>
  <li>Kit collection: March 12-14, 2024</li>
  <li>Race day: March 15, 2024 at 6:00 AM</li>
  <li>Bring a valid ID and this QR code for verification</li>
</ul>