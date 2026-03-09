# DECOO Reclamo Payment Calculator

Web application built with React, TypeScript, and Vite to calculate horse race claim payments.

## Features

- Calculates the payout for a race using the fixed `3 years or less` and `4 years or more` purse tables
- Splits the position payout between `Trainer`, `Groom`, `Jockey`, and `Profit`
- Lets users accumulate multiple races into a single session total
- Stores local browser history for both individual races and saved sessions
- Allows users to open a saved race from history and view the payment breakdown

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Implemented Rules

- Categories: `100`, `200`, `300`, `400`, `500`, `600`
- Fewer than `3` horses: not allowed
- Finish positions outside the payout table return `0`
- Payout split:
  - Trainer: `15%`
  - Groom: `10%`
  - Jockey: `10%`
  - Profit: `65%`

## History

The application stores history in `localStorage`, so the saved data lives in the current browser.
