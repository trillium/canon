# Module: Email

## Check

- [ ] `resend` in dependencies
- [ ] `@react-email/components` in devDependencies
- [ ] Email utility in `src/lib/email.ts` or similar
- [ ] At least one email template in `src/emails/` or `emails/`
- [ ] Environment variable: `RESEND_API_KEY`

## Apply

1. Run `pnpm add resend`
2. Run `pnpm add -D @react-email/components react-email`
3. Create `src/lib/email.ts`:
   ```ts
   import { Resend } from "resend";
   export const resend = new Resend(process.env.RESEND_API_KEY);
   ```
4. Create `src/emails/` directory with starter templates:
   - `welcome.tsx` — new user welcome
   - `password-reset.tsx` — password reset
   - `feedback-notification.tsx` — feedtack submission notification
5. Add to `.env.local.example`:
   ```
   RESEND_API_KEY=
   ```
6. Add script to `package.json`:
   ```json
   "email:dev": "email dev"
   ```

## Conflicts

- If project uses a different email provider (SendGrid, Mailgun, SES), flag for review
- If project has existing email templates in a different format, preserve them
