# Shalinee Kumari · Portfolio

A static portfolio site (plain HTML, CSS and a little JavaScript) with one serverless function that emails contact-form messages to shalineekt@gmail.com.

## What is here
- `index.html` and eleven case-study pages
- `assets/` fonts (self-hosted), images, `css/site.css`, `js/site.js`
- `api/contact.js` the contact-form endpoint (Vercel serverless function, sends through Resend)
- `test/contact.test.js` tests for the endpoint (`npm test`)

## Deploy on Vercel (recommended; the contact form needs it)
1. Go to vercel.com, sign in with GitHub, choose **Add New → Project**, and import `shalineektt/shalinee-portfolio`.
2. Leave the framework preset as **Other**. No build command and no output directory are needed.
3. Open **Settings → Environment Variables** and add:
   - `RESEND_API_KEY`: your key from resend.com (create the Resend account with shalineekt@gmail.com).
   - `CONTACT_TO`: `shalineekt@gmail.com` (optional, this is the default).
4. Deploy. Submit the contact form once and check your inbox and spam folder.

GitHub Pages also works for the pages, but it cannot run `api/contact.js`, so the form would not send.

## After you know your live address
The pages contain `https://shalinee-portfolio.vercel.app` in the canonical and social-preview tags. Replace it with your real domain:

    grep -rl "shalinee-portfolio.vercel.app" --include=*.html . | xargs sed -i 's#https://shalinee-portfolio.vercel.app#https://YOUR-DOMAIN#g'

## Before sharing widely
- Add a public résumé link if you want one (the résumé PDF contains a phone number, so it is not included).
- Check that every Google Drive and Notion link opens without a sign-in.
- Several figures need a definition and period you can defend in an interview: −30% turnaround time, 63% repeat research rate, 80% adoption.

## Motion (all in `assets/js/site.js` and `assets/css/site.css`)
- A thin scroll-progress rail on wide screens: 01 Think, 02 Build, 03 Launch, 04 Scale.
- Sections fade up 16px as they arrive (about 550ms). Cards lift 2px on hover (220ms).
- Headline numbers resolve from zero to their value in about 650ms when they scroll into view.
- Product cards on the home page reveal Problem, My role and Impact one after another.
- Product decisions on the case studies light up as you read through them.
- Screenshots drift at most 12px slower than the page, inside a quiet violet shadow.
- Primary buttons move up to 3px toward the cursor; arrows move only on hover.
- Everything is switched off for visitors who prefer reduced motion, and the rail is hidden on phones.
