import { JobApplication } from '../types/application';
import { getStoredApplications, saveApplication } from './storage';
import { checkDuplicateApplication } from './duplicate';

export function exportApplicationsToJson(applications: JobApplication[]): string {
  const exportPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    itemCount: applications.length,
    applications,
  };
  return JSON.stringify(exportPayload, null, 2);
}

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportApplicationsToCsv(applications: JobApplication[]): string {
  const headers = [
    'Company',
    'Role',
    'Applied Date',
    'Status',
    'CTC / Salary',
    'Location',
    'End Date',
    'Vacancies',
    'Source',
    'URL',
    'Skills',
    'Notes',
  ];

  const rows = applications.map((app) => [
    escapeCsvField(app.company),
    escapeCsvField(app.role),
    escapeCsvField(app.appliedAt ? app.appliedAt.slice(0, 10) : ''),
    escapeCsvField(app.status),
    escapeCsvField(app.salary || 'Not specified'),
    escapeCsvField(app.location || ''),
    escapeCsvField(app.endDate ? app.endDate.slice(0, 10) : ''),
    escapeCsvField(app.vacancies || ''),
    escapeCsvField(app.source || ''),
    escapeCsvField(app.jobUrl || ''),
    escapeCsvField((app.skills || []).join(', ')),
    escapeCsvField(app.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export interface ImportAnalysis {
  isValid: boolean;
  error?: string;
  totalParsed: number;
  newCount: number;
  updateCount: number;
  duplicateCount: number;
  applicationsToImport: JobApplication[];
}

export function analyzeImportData(
  jsonText: string,
  existingList: JobApplication[]
): ImportAnalysis {
  try {
    const parsed = JSON.parse(jsonText);
    let rawList: any[] = [];

    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.applications)) {
      rawList = parsed.applications;
    } else {
      return {
        isValid: false,
        error: 'JSON must contain an array of applications or an object with an "applications" array.',
        totalParsed: 0,
        newCount: 0,
        updateCount: 0,
        duplicateCount: 0,
        applicationsToImport: [],
      };
    }

    const validated: JobApplication[] = [];
    let newCount = 0;
    let updateCount = 0;
    let duplicateCount = 0;

    for (const item of rawList) {
      if (!item.company || !item.role) {
        continue; // Skip invalid records missing essentials
      }

      const app: JobApplication = {
        id: item.id || 'job_' + Math.random().toString(36).substring(2, 9),
        company: String(item.company).trim(),
        role: String(item.role).trim(),
        location: item.location ? String(item.location).trim() : undefined,
        salary: item.salary ? String(item.salary).trim() : 'Not specified',
        appliedAt: item.appliedAt || new Date().toISOString(),
        endDate: item.endDate || item.deadline || null,
        vacancies: item.vacancies ? String(item.vacancies).trim() : undefined,
        status: item.status || 'Applied',
        source: item.source || 'Other',
        jobUrl: item.jobUrl || '',
        description: item.description || '',
        summary: item.summary || '',
        skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
        recruiter: item.recruiter || '',
        notes: item.notes || '',
        timeline: Array.isArray(item.timeline) ? item.timeline : [],
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        metadata: item.metadata || {},
      };

      const dup = checkDuplicateApplication(
        { url: app.jobUrl, company: app.company, role: app.role },
        existingList
      );

      if (dup.isDuplicate) {
        duplicateCount++;
        updateCount++;
      } else {
        newCount++;
      }

      validated.push(app);
    }

    return {
      isValid: true,
      totalParsed: validated.length,
      newCount,
      updateCount,
      duplicateCount,
      applicationsToImport: validated,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `JSON parse error: ${err.message}`,
      totalParsed: 0,
      newCount: 0,
      updateCount: 0,
      duplicateCount: 0,
      applicationsToImport: [],
    };
  }
}

export async function executeImport(
  appsToImport: JobApplication[],
  overwriteExisting: boolean = true
): Promise<{ importedCount: number }> {
  const existingList = await getStoredApplications();
  let count = 0;

  for (const app of appsToImport) {
    const dup = checkDuplicateApplication(
      { url: app.jobUrl, company: app.company, role: app.role },
      existingList
    );

    if (dup.isDuplicate && dup.existingApp) {
      if (overwriteExisting) {
        await saveApplication({
          ...app,
          id: dup.existingApp.id, // preserve existing ID
          createdAt: dup.existingApp.createdAt,
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    } else {
      await saveApplication(app);
      count++;
    }
  }

  return { importedCount: count };
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
