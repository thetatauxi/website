import { 
  readRawSheetValues, 
  getGoogleSheetsClient, 
  writeSheetValues, 
  appendSheetRows, 
  clearSheetValues,
  batchClearSheetRanges,
  syncSheetToSupabase, 
  syncAllSheetsToSupabase,
  processNewAccountIntake,
  type AccountIntakeResult
} from './sheets/sync-engine';
import { parseBooleanValue, parseNumberValue, extractSpreadsheetId } from './sheets/utils';
export * from '@/config/sheets';
export { 
  readRawSheetValues, 
  getGoogleSheetsClient, 
  writeSheetValues, 
  appendSheetRows, 
  clearSheetValues,
  batchClearSheetRanges,
  syncSheetToSupabase, 
  syncAllSheetsToSupabase, 
  processNewAccountIntake,
  type AccountIntakeResult,
  extractSpreadsheetId 
};

export interface MemberRecord {
  username: string;
  password?: string;
  role: 'member' | 'eboard' | 'rush' | 'admin';
}

export async function getMembersFromSheet(spreadsheetIdOrUrl?: string): Promise<MemberRecord[]> {
  try {
    const spreadsheetId = extractSpreadsheetId(
      spreadsheetIdOrUrl || process.env.GOOGLE_MEMBER_STATUS_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || ''
    );
    if (!spreadsheetId) return [];

    const { values } = await readRawSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      range: 'A2:C',
    });

    if (!values || values.length === 0) {
      return [];
    }

    return values.map((row) => ({
      username: String(row[1] || ''),
      password: String(row[0] || ''),
      role: (String(row[2] || 'member') as 'member' | 'eboard' | 'rush' | 'admin') || 'member',
    }));
  } catch (error) {
    console.error('Error fetching members from Google Sheet:', error);
    return [];
  }
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  details: string;
}

export async function getCalendarFromSheet(spreadsheetIdOrUrl?: string): Promise<CalendarEvent[]> {
  try {
    const spreadsheetId = extractSpreadsheetId(
      spreadsheetIdOrUrl || process.env.GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || ''
    );
    if (!spreadsheetId) return [];

    const { values } = await readRawSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      sheetName: 'Calendar',
      range: 'A1:D',
    });

    if (!values || values.length <= 1) {
      return [];
    }

    // Dynamic header lookup to support: event_name, time, location, details (or title, date, etc.)
    const headers = (values[0] || []).map((h: unknown) => String(h || '').toLowerCase().trim());
    const titleIndex = headers.findIndex((h) => h.includes('event') || h.includes('title') || h.includes('name'));
    const dateIndex = headers.findIndex((h) => h.includes('time') || h.includes('date'));
    const locationIndex = headers.findIndex((h) => h.includes('location') || h.includes('place') || h.includes('room'));
    const detailsIndex = headers.findIndex((h) => h.includes('detail') || h.includes('desc') || h.includes('note'));

    const effectiveTitleIdx = titleIndex !== -1 ? titleIndex : 0;
    const effectiveDateIdx = dateIndex !== -1 ? dateIndex : 1;
    const effectiveLocIdx = locationIndex !== -1 ? locationIndex : 2;
    const effectiveDetIdx = detailsIndex !== -1 ? detailsIndex : 3;

    const dataRows = values.slice(1);
    return dataRows.map((row, index) => ({
      id: String(index + 1),
      title: String(row[effectiveTitleIdx] || ''),
      date: String(row[effectiveDateIdx] || ''),
      location: String(row[effectiveLocIdx] || ''),
      details: String(row[effectiveDetIdx] || ''),
    }));
  } catch (error) {
    console.error('Error fetching calendar from Google Sheet:', error);
    return [];
  }
}

export interface MemberLink {
  id: string;
  title: string;
  url: string;
}

export async function getLinksFromSheet(spreadsheetIdOrUrl?: string): Promise<MemberLink[]> {
  try {
    const spreadsheetId = extractSpreadsheetId(
      spreadsheetIdOrUrl || process.env.GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || ''
    );
    if (!spreadsheetId) return [];

    const { values } = await readRawSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      sheetName: 'Links',
      range: 'A1:B',
    });

    if (!values || values.length <= 1) {
      return [];
    }

    // Dynamic header lookup: label, url
    const headers = values[0].map((h: unknown) => String(h || '').toLowerCase().trim());
    const titleIndex = headers.findIndex((h) => h.includes('label') || h.includes('title') || h.includes('name'));
    const urlIndex = headers.findIndex((h) => h.includes('url') || h.includes('link'));

    const effectiveTitleIdx = titleIndex !== -1 ? titleIndex : 0;
    const effectiveUrlIdx = urlIndex !== -1 ? urlIndex : 1;

    const dataRows = values.slice(1);
    return dataRows.map((row, index) => {
      const title = row[effectiveTitleIdx] !== undefined ? String(row[effectiveTitleIdx]) : 'Link';
      const url = row[effectiveUrlIdx] !== undefined ? String(row[effectiveUrlIdx]) : '#';
      return {
        id: String(index + 1),
        title,
        url,
      };
    });
  } catch (error) {
    console.error('Error fetching links from Google Sheet:', error);
    return [];
  }
}

export interface MemberStatusRecord {
  username: string;
  duesPaid: boolean;
  brotherhoodMet: boolean;
  profDevMet: boolean;
  commServiceMet: boolean;
  concessionsDone: boolean;
  attendancePoints: number;
}

export async function getMemberStatusFromSheet(spreadsheetIdOrUrl?: string): Promise<MemberStatusRecord[]> {
  try {
    const spreadsheetId = extractSpreadsheetId(
      spreadsheetIdOrUrl || process.env.GOOGLE_MEMBER_STATUS_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID || ''
    );
    if (!spreadsheetId) return [];

    const { values } = await readRawSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      sheetName: 'MemberStatus',
      range: 'A1:G',
    });

    if (!values || values.length === 0) {
      return [];
    }

    const headers = values[0].map((h: unknown) => String(h || '').toLowerCase().trim());

    const usernameIndex = headers.findIndex((h: string) => h === 'username' || h === 'email' || h === 'user');
    const duesPaidIndex = headers.findIndex((h: string) => h.includes('dues'));
    const brotherhoodIndex = headers.findIndex((h: string) => h.includes('brotherhood'));
    const profDevIndex = headers.findIndex((h: string) => h.includes('prof') || h.includes('pd'));
    const commServiceIndex = headers.findIndex((h: string) =>
      h.includes('community') || h.includes('cs') || h.includes('comm') || h.includes('service')
    );
    const concessionsIndex = headers.findIndex((h: string) => h.includes('concession'));
    const attendanceIndex = headers.findIndex((h: string) => h.includes('attendance') || h.includes('point'));

    const dataRows = values.slice(1);
    return dataRows
      .filter((row) => usernameIndex !== -1 && row[usernameIndex] !== undefined && row[usernameIndex] !== null && String(row[usernameIndex]).trim() !== '')
      .map((row) => {
        let rawUsername = String(row[usernameIndex] || '');
        if (rawUsername.includes('@')) {
          rawUsername = rawUsername.split('@')[0];
        }
        rawUsername = rawUsername.trim().toLowerCase();

        return {
          username: rawUsername,
          duesPaid: duesPaidIndex !== -1 ? parseBooleanValue(row[duesPaidIndex]) : false,
          brotherhoodMet: brotherhoodIndex !== -1 ? parseBooleanValue(row[brotherhoodIndex]) : false,
          profDevMet: profDevIndex !== -1 ? parseBooleanValue(row[profDevIndex]) : false,
          commServiceMet: commServiceIndex !== -1 ? parseBooleanValue(row[commServiceIndex]) : false,
          concessionsDone: concessionsIndex !== -1 ? parseBooleanValue(row[concessionsIndex]) : false,
          attendancePoints: attendanceIndex !== -1 ? parseNumberValue(row[attendanceIndex], 0) : 0,
        };
      });
  } catch (error) {
    console.error('Error fetching member status from Google Sheet:', error);
    return [];
  }
}
