export interface Resume {
  about: string;
  azureStartYear: number;
  manufacturingStartYear: number;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  skills: Skills;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  date: string;
  location: string;
  details: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  graduationYear: string;
  location: string;
  honors: string[];
  courses: string[];
}

export interface CertificationEntry {
  title: string;
  affiliation: string;
  date: string;
}

export interface Skills {
  languages: string[];
  tools: string[];
  practices: string[];
}
