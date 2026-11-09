# Ladder × Edge Medicine

**Decided at home, seen in clinic.** An interactive prototype for the [Edge Medicine Innovation Challenge 2026](https://edgemedicine.org/innovate).

Patients change their own treatment between visits, often after a video that stretches a real study. Ladder gives them an honest answer about the claim and, with their consent, sends the decision to their care team through [JupyterHealth](https://jupyterhealth.org). The clinician’s reply comes back in days, not at the next visit.

A 2½-minute captioned video at the top of the page shows the whole story (`assets/ladder-edge-demo.mp4`, captions also in `assets/ladder-edge-demo.vtt`). The interactive demo below it walks through Edge Medicine’s loop with two screens side by side:

| Stage | Alex’s phone (patient) | Dr. Lee’s EHR (clinician) |
|---|---|---|
| Capture | Checks a “berberine is nature’s Ozempic” video with Ladder | Chart says: supplements, none documented |
| Share | Chooses to tell his care team; consents per data type on the JupyterHealth Exchange | A new Ladder signal arrives |
| Interpret | | Opens the Ladder card in the EHR (SMART on FHIR, Voilà on JupyterHub) |
| Act | | Replies |
| Close the loop | Hears back three days after his decision | |

Turn the **Guide** switch off to explore freely, or pick another path: saying no, sharing less, withdrawing, a claim nobody has reviewed (no verdict), or another patient.

## What is real and what is simulated
- **Real:** research findings and statistics (DOIs checked on Crossref, wording matched to PubMed abstracts); LOINC and RxNorm codes; the openly licensed photographs (credits on the page and in `assets/credits.json`).
- **Fictional or synthetic:** Alex, Dr. Lee, Bayside Primary Care, the EHR, videos, medicines, lab values and messages. Alex is borrowed from the Edge Medicine site’s story.
- **Illustrative:** FHIR R5 resources and API calls. Nothing leaves your browser. Not medical advice.

## Run locally
A static site with no build step:
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.
