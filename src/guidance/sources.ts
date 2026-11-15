import type { SourceRef } from '@/contracts/types';

// External references are linked to primary NASA, publisher, or agency records.

export const SOURCES: Record<string, SourceRef> = {
  src_hrp_hazards: {
    id: 'src_hrp_hazards',
    title: 'NASA Human Research Program: 5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
    status: 'verified',
  },
  src_hrp_risks: {
    id: 'src_hrp_risks',
    title: 'NASA Human Research Program: Risks of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/risks/',
    status: 'verified',
  },
  src_hrp_ongoing: {
    id: 'src_hrp_ongoing',
    title: 'NASA Human Research Program: Ongoing Research in Space',
    url: 'https://www.nasa.gov/hrp/ongoing-hrp-research/',
    status: 'verified',
  },
  src_csa_radiation: {
    id: 'src_csa_radiation',
    title: 'Canadian Space Agency: Monitoring Radiation for Astronaut Health',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    status: 'verified',
  },
  src_csa_science: {
    id: 'src_csa_science',
    title: 'Canadian Space Agency: Why Do We Conduct Science Experiments in Space?',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    status: 'verified',
  },
  src_aha_acc_bp: {
    id: 'src_aha_acc_bp',
    title: 'AHA/ACC Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults (Whelton et al.)',
    url: 'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065',
    status: 'verified',
  },
  src_ada_glucose: {
    id: 'src_ada_glucose',
    title: 'American Diabetes Association (ADA) Standards of Care: Diagnosis and Classification of Diabetes',
    url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
    status: 'verified',
  },
  src_aasm_sleep: {
    id: 'src_aasm_sleep',
    title: 'American Academy of Sleep Medicine (AASM) & Sleep Research Society Consensus Statement on Adult Sleep Duration',
    url: 'https://doi.org/10.5664/jcsm.4758',
    status: 'verified',
  },
  src_general_clinical: {
    id: 'src_general_clinical',
    title: 'NASA-STD-3001 Space Flight Human-System Standard Vol 1 (Crew Health) & ExMC Evidence Library (HRP-48036)',
    url: 'https://www.nasa.gov/reference/nasa-std-3001v1/',
    status: 'verified',
  },
  src_nasa_msl_rad: {
    id: 'src_nasa_msl_rad',
    title: 'Zeitlin et al., Measurements of Energetic Particle Radiation in Transit to Mars on the Mars Science Laboratory',
    url: 'https://doi.org/10.1126/science.1235989',
    status: 'verified',
  },
  src_lunar_lnd: {
    id: 'src_lunar_lnd',
    title: 'Wimmer-Schweingruber et al., First measurements of the radiation dose on the lunar surface (LND)',
    url: 'https://doi.org/10.1126/sciadv.aaz1334',
    status: 'verified',
  },
  src_iss_padles: {
    id: 'src_iss_padles',
    title: 'NASA ISS Technical Publication: PADLES space radiation measurements',
    url: 'https://www.nasa.gov/sites/default/files/atoms/files/iss_technical_publication_030116.pdf',
    status: 'verified',
  },
  src_nasa_osdr: {
    id: 'src_nasa_osdr',
    title: 'NASA Open Science Data Repository (OSDR)',
    url: 'https://science.nasa.gov/biological-physical/data/osdr/',
    status: 'verified',
  },
  src_nasa_sleep_actigraphy: {
    id: 'src_nasa_sleep_actigraphy',
    title: 'NASA OCHMO Technical Brief OCHMO-TB-041: Sleep Accommodations (sleep-wake actigraphy during spaceflight)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-041-sleep-accommodations.pdf',
    status: 'verified',
  },
  src_nasa_circa: {
    id: 'src_nasa_circa',
    title: 'NASA ISS Technical Publication: 24-Hour Pattern of Blood Pressure and Heart Rate in Weightlessness (CIRCA)',
    url: 'https://www.nasa.gov/wp-content/uploads/2022/03/iss_technical_publication_030116.pdf',
    status: 'verified',
  },
  src_osd_530: {
    id: 'src_osd_530',
    title: 'NASA OSDR OSD-530: JAXA Cell-Free Epigenome study',
    url: 'https://osdr.nasa.gov/osdr/data/osd/meta/530',
    status: 'verified',
  },
  src_soma_atlas: {
    id: 'src_soma_atlas',
    title: 'Space Omics and Medical Atlas (SOMA)',
    url: 'https://soma.weill.cornell.edu/',
    status: 'verified',
  },
  src_nasa_twins_i4: {
    id: 'src_nasa_twins_i4',
    title: 'NASA: Inspiration4 OSDR datasets and the 340-day NASA Twins Study',
    url: 'https://www.nasa.gov/osdr-latest-news-i4-mission-datasets/',
    status: 'verified',
  },
  src_csa_biomonitor: {
    id: 'src_csa_biomonitor',
    title: 'Canadian Space Agency Bio-Monitor wearable system',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp',
    status: 'verified',
  },
  src_eimo_cdss: {
    id: 'src_eimo_cdss',
    title: 'Russell et al., The value of a spaceflight clinical decision support system for earth-independent medical operations',
    url: 'https://doi.org/10.1038/s41526-023-00284-1',
    status: 'verified',
  },
  src_exmc_hrp_48036: {
    id: 'src_exmc_hrp_48036',
    title: 'NASA ExMC Evidence Library Methods (HRP-48036 Revision B)',
    url: 'https://ntrs.nasa.gov/api/citations/20240004774/downloads/HRP-48036%20RevB_ExMC%20Evidence%20Library%20Methods.pdf',
    status: 'verified',
  },
  src_nasa_mars_owlt: {
    id: 'src_nasa_mars_owlt',
    title: 'NASA: Mars rover communication and one-way light time',
    url: 'https://www.nasa.gov/podcasts/on-a-mission/how-to-drive-a-mars-rover-s4e8/',
    status: 'verified',
  },
};

