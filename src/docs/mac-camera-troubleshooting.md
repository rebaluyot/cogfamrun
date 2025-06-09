# macOS Camera Troubleshooting Guide

## Quick Fix Steps

If your camera isn't working with the Kit Distribution Scanner:

1. **Check for the "Camera detected but labels are empty" message**
   - This is a common macOS permission issue
   - Click the "Request Camera Permission" button when you see this

2. **When prompted by your browser:**
   - Click "Allow" to grant camera access
   - If no prompt appears, check your browser's address bar for a camera icon

3. **If camera still doesn't work:**
   - Open System Preferences
   - Go to Security & Privacy > Privacy > Camera
   - Ensure your browser is checked in the list
   - **Restart your browser** after making changes

## Browser-Specific Tips

### Safari
- Best integrated with macOS permissions
- Try Safari if other browsers aren't working
- Check Safari > Preferences > Websites > Camera

### Chrome
- Click the camera icon in the address bar
- Select "Always allow" for this site
- Restart Chrome after changing system permissions

### Firefox
- Check the doorhanger notification in the address bar
- Go to Preferences > Privacy & Security > Permissions > Camera

## HTTPS Requirement

Cameras require a secure (HTTPS) context. Make sure:

- You're using `https://` or `localhost`
- If using HTTP, switch to manual QR entry mode
- For production deployment, always use HTTPS

## When All Else Fails

1. **Try manual entry mode**
   - Click "Manual QR Entry" to enter codes without using the camera

2. **Try a different browser**
   - Safari works best with macOS permissions

3. **Reset browser permissions**
   - In System Preferences, uncheck and recheck your browser
   - Clear browser data/cache
   - Restart your computer

4. **Check recent macOS updates**
   - Some macOS updates can reset permission settings
