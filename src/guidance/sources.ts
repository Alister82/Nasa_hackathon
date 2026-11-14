import type { SourceRef } from '@/contracts/types';

// Source URLs: the five organizer sources use the exact URLs from ARCHITECTURE.md 7.2.
// All other sources have url: null and status: 'unverified' until a human fills them.
// See docs/SOURCES_TODO.md for the list of items needing human verification.

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
    title: 'American Heart Association / American College of Cardiology blood pressure guideline (2017)',
    url: 'https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065',
    status: 'verified',
  },
  src_ada_glucose: {
    id: 'src_ada_glucose',
    title: 'American Diabetes Association, Standards of Care: glucose criteria',
    url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
    status: 'verified',
  },
  src_aasm_sleep: {
    id: 'src_aasm_sleep',
    title: 'American Academy of Sleep Medicine and Sleep Research Society adult sleep recommendation',
    url: 'https://jcsm.aasm.org/doi/10.5664/jcsm.4758',
    status: 'verified',
  },
  src_general_clinical: {
    id: 'src_general_clinical',
    title: 'General adult clinical reference ranges (NASA-STD-3001 Space Flight Human-System Standard)',
    url: 'https://www.nasa.gov/ochmo/health-and-medical/nasa-std-3001/',
    status: 'verified',
  },
};

