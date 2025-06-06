# macOS Camera Permissions Guide

## Troubleshooting Camera Issues on macOS

When using the Kit Distribution system on macOS, you might encounter camera access issues even though you're running on HTTPS or localhost. This guide will help you resolve these issues.

## Step-by-Step Guide

### 1. Check System Preferences

1. **Open System Preferences**
   - Click on the Apple menu (🍎) in the top-left corner
   - Select "System Preferences" (or "System Settings" on newer macOS)

2. **Navigate to Privacy Settings**
   - Select "Security & Privacy" (or "Privacy & Security" on newer macOS)
   - Click on the "Privacy" tab
   - Select "Camera" from the left sidebar

3. **Enable Camera Access for Your Browser**
   - Find your web browser in the list (Chrome, Safari, Firefox, etc.)
   - Make sure the checkbox next to your browser is checked
   - If you don't see your browser in the list, you may need to add it by clicking the "+" button

### 2. Restart Your Browser

After enabling permissions, you must completely restart your browser:

1. Quit your browser completely (not just close the window)
2. Reopen your browser and navigate back to the Kit Distribution page
3. Try using the camera scanner again

### 3. Empty Labels Detection Issue

If you see the message "Camera detected but labels are empty - likely permission issue", this typically means:

- macOS has identified your cameras
- Your browser can see that cameras exist, but can't access specific details about them
- You need to explicitly grant camera permission when prompted by your browser

When this happens:

1. Click the "Request Camera Permission" button
2. When your browser shows a permission prompt, click "Allow"
3. If no prompt appears, check your browser's address bar for permission indicators

### 4. Browser-Specific Tips

#### Safari
- Safari has the best integration with macOS permissions
- Try using Safari if other browsers are not working

#### Chrome
- Check chrome://settings/content/camera
- Make sure the site is not blocked

#### Firefox
- Check about:preferences#privacy
- Look under "Permissions" > "Camera" 

### 5. Using Manual Entry Mode

If camera issues persist, you can always use Manual QR Entry mode as a reliable alternative:

1. Click the "Manual QR Entry" button
2. Enter the QR code value from the participant's registration confirmation
3. The format should be: `CogFamRun2025|REG123|...`

## Still Having Issues?

If you continue experiencing camera access problems:

- Make sure no other applications are using your camera
- Check if your camera works in other applications
- Make sure your camera is not physically covered or disabled
- Consider using a different browser
- As a last resort, use the Manual Entry mode, which works reliably regardless of camera accessibility
