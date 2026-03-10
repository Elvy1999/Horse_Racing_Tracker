# DECOO Tabla De Pago

This is a web app I made for `DECOO Stable` to calculate how race money gets divided up.

The idea is simple:

- pick the horse
- choose the horse age
- choose the category
- choose how many horses were in the race
- choose the finishing position
- see how much goes to the trainer, groom, jockey, and profit

The app also lets you save horses, add multiple races into one session, and keep a local history in the browser.

## What the app does

This project is for calculating `reclamo` race payments using the payout rules we defined for the app.

It can:

- calculate one race at a time
- show the payment breakdown
- save horse names in the browser
- let you pick saved horses from a dropdown
- add several races into one accumulated session
- save race history and saved sessions
- show details when you click a history item

## Main rules in the app

### Horse age groups

- `3 anos o menos`
- `4 anos o mas`

### Categories

- `100`
- `200`
- `300`
- `400`
- `500`
- `No Reclamable`
- `Clasico`

For `Clasico`, the user types the purse amount manually.

### Number of horses

The app only allows:

- `3`
- `4`
- `5 o mas`

### Finishing position

The position options change depending on how many horses are in the race:

- `3 horses` -> positions `1` to `3`
- `4 horses` -> positions `1` to `4`
- `5 or more horses` -> positions `1` to `5`

If a position does not pay, the result is `0`.

### Payment split

Once the race payout is calculated, the money is split like this:

- `Entrenador` -> `15%`
- `Groom` -> `10%`
- `Jockey` -> `10%`
- `Ganancia` -> `65%`

All money is rounded to whole numbers.

## Saved data

Right now this app does not use a database.

Everything is saved in browser `localStorage`, including:

- saved horse names
- individual race history
- saved accumulated sessions

That means the data stays on the same browser/device unless browser storage is cleared.

## Project structure

```text
src/
  app/
    App.tsx
    App.css
  assets/
    HorseLogo.jpeg
  features/
    calculator/
      calculator.ts
      calculator.test.ts
      types.ts
  shared/
    format.ts
    storage.ts
    storage.test.ts
  index.css
  main.tsx
```

## Running it locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build it:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

## Deployment

The repo is set up for GitHub Pages.

Live URL:

[https://elvy1999.github.io/Horse_Racing_Tracker/](https://elvy1999.github.io/Horse_Racing_Tracker/)

If GitHub Pages does not update right away after a push, wait a little and refresh again.

## Current scope

This version is focused on keeping things simple.

It does not have:

- user accounts
- cloud sync
- a backend database
- editable payout rules from the UI
- multiple rule systems

## Verification

The project is checked with:

- `npm run lint`
- `npm run test`
- `npm run build`
