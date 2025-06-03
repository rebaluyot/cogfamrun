# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7c3aa552-d519-4178-b0b4-fc391db96661

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7c3aa552-d519-4178-b0b4-fc391db96661) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7c3aa552-d519-4178-b0b4-fc391db96661) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
"# famrun" 


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