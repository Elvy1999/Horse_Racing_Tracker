# DECOO Reclamo Payment Calculator

A mobile-first web application for calculating horse race claim payouts for `DECOO Stable`.

This project is built with React, TypeScript, and Vite. It allows users to calculate race payouts, view the breakdown for each party involved, group multiple races into a running session total, and review saved calculations from browser history.

## Overview

The application is designed to support a specific horse racing payment workflow based on fixed purse tables and distribution percentages. Users can enter a horse name, select the age group and category, provide the number of horses in the race and the finishing position, and instantly see:

- Base purse amount
- Position-based payout
- Trainer payment
- Groom payment
- Jockey payment
- Profit / take-home amount

The app also supports multi-race accumulation so a user can build a session and see total distributions across several races.

To simplify repeat use, horse names can now be saved locally and reused from a selector in future calculations.

## Key Features

- Mobile-first responsive interface
- Spanish-first user interface with DECOO branding
- Fixed purse tables for:
  - `3 years or less`
  - `4 years or more`
- Position payout rules for:
  - `3 horses`
  - `4 horses`
  - `5 or more horses`
- Automatic distribution of race winnings to:
  - `Trainer`
  - `Groom`
  - `Jockey`
  - `Profit`
- Saved horse list stored in browser local storage
- Horse selector that uses only saved names for new calculations
- Session accumulator for multiple races
- Local history for:
  - Individual race calculations
  - Saved sessions
- Expandable history records that show the payment breakdown for each saved race

## Business Rules Implemented

### Categories

The calculator supports the following categories:

- `100`
- `200`
- `300`
- `400`
- `500`
- `600`
- `Clasico` with a custom purse amount entered by the user

### Age Groups

- `3 years or less`
- `4 years or more`

### Race Entry Rules

- Races with fewer than `3` horses are not allowed
- Finish positions outside the payout table return a payout of `0`
- All displayed money values are rounded to whole numbers

### Payout Split

Each qualifying position payout is distributed as follows:

- Trainer: `15%`
- Groom: `10%`
- Jockey: `10%`
- Profit: `65%`

## Project Structure

```text
src/
  app/
    App.tsx              Main application flow and UI
    App.css              Component-level styling
  assets/
    HorseLogo.jpeg       Header branding image
  features/
    calculator/
      calculator.ts      Purse tables, payout rules, and session aggregation
      calculator.test.ts Automated tests for calculator behavior
      types.ts           Shared TypeScript types for the calculator domain
  shared/
    format.ts            Currency and label formatting helpers
    storage.ts           localStorage persistence helpers
  index.css              Global styling
  main.tsx               React entry point
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

## Deployment

The repository includes a GitHub Pages deployment workflow. The Vite base path is configured for the repository site:

- Production URL: [https://elvy1999.github.io/Horse_Racing_Tracker/](https://elvy1999.github.io/Horse_Racing_Tracker/)

If GitHub Pages has not refreshed yet, allow a short delay after pushing changes and then reload the site.

## Data Storage

This project does not use a backend database in its current version.

- Calculation history is stored in `localStorage`
- Saved horse names are stored in `localStorage`
- Saved data remains in the current browser only
- Clearing browser storage will remove the saved history and saved horse names

## Current Scope

This version is intentionally focused on a single payment ruleset and a streamlined workflow. It does not currently include:

- User accounts
- Cloud sync
- Editable admin payout tables
- Multiple race rule systems
- Server-side storage

## Verification

The project is currently verified with:

- `npm run test`
- `npm run lint`
- `npm run build`

## License / Usage

This repository is currently intended for DECOO Stable project use and internal iteration unless you decide to publish it under a separate license later.
