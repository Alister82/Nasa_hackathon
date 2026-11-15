# Source verification notes

The clinical and NASA references displayed by Vigil are linked from
`src/guidance/sources.ts`. The four clinical/NASA entries previously marked
unverified now link to their guideline, publisher, or NASA standard pages. The
NASA radiation, OSDR/SOMA, Bio-Monitor, and ExMC references are also listed
there.

## Interpretation notes

- Mission radiation constants (0.5, 1.0, and 1.8 mSv/day) remain simulator
  settings. They are rounded/illustrative comparisons, not current forecasts or
  individual crew dosimetry.
- The 1.84 ± 0.33 mSv/day MSL RAD value is cruise GCR dose equivalent and does
  not include solar particle events.
- The lunar LND result is from Chang'E-4, not Artemis: 1.369 mSv/day dose
  equivalent for the measurement period.
- NASA OSDR OSD-530 is the JAXA Cell-Free Epigenome study. It is not a source of
  continuous wearable cardiovascular telemetry.
- The simulator's 2% ordinary-indicator and 1% radiation missingness rates are
  synthetic assumptions. They are not claimed as Bio-Monitor motion-artifact
  rates.
- The EIMO/IMPACT citations inform design context; Vigil does not implement a
  NASA-validated clinical decision support system or IMPACT logic.
