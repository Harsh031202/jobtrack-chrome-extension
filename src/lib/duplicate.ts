import { JobApplication } from '../types/application';
import { normalizeJobUrl } from './normalizer';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingApp?: JobApplication;
  matchType?: 'url' | 'company_role';
}

function cleanStringForComparison(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function checkDuplicateApplication(
  candidate: { url?: string; company?: string; role?: string },
  existingList: JobApplication[]
): DuplicateCheckResult {
  if (!existingList || existingList.length === 0) {
    return { isDuplicate: false };
  }

  // 1. Primary Check: Normalized URL match
  if (candidate.url) {
    const candidateNormalized = normalizeJobUrl(candidate.url);
    const urlMatch = existingList.find((item) => {
      if (!item.jobUrl) return false;
      return normalizeJobUrl(item.jobUrl) === candidateNormalized;
    });

    if (urlMatch) {
      return {
        isDuplicate: true,
        existingApp: urlMatch,
        matchType: 'url',
      };
    }
  }

  // 2. Secondary Check: Company + Role match
  if (candidate.company && candidate.role) {
    const cleanCandidateCompany = cleanStringForComparison(candidate.company);
    const cleanCandidateRole = cleanStringForComparison(candidate.role);

    if (cleanCandidateCompany.length > 1 && cleanCandidateRole.length > 2) {
      const match = existingList.find((item) => {
        const itemComp = cleanStringForComparison(item.company);
        const itemRole = cleanStringForComparison(item.role);
        return itemComp === cleanCandidateCompany && itemRole === cleanCandidateRole;
      });

      if (match) {
        return {
          isDuplicate: true,
          existingApp: match,
          matchType: 'company_role',
        };
      }
    }
  }

  return { isDuplicate: false };
}
