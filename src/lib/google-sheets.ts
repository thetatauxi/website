import { google } from 'googleapis';

export interface MemberRecord {
  username: string;
  password?: string;
  role: 'member' | 'eboard' | 'rush' | 'admin';
}

export async function getMembersFromSheet(): Promise<MemberRecord[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // The private key from the .env file might have escaped literal \n strings, so we replace them with actual newlines
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // The long ID found in your Google Sheet URL
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // First, fetch the spreadsheet info to dynamically get the name of the first tab
    const sheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const firstSheetName = sheetInfo.data.sheets?.[0]?.properties?.title || 'Sheet1';

    // Dynamically use the first sheet's name instead of hardcoding "Members"
    const range = `'${firstSheetName}'!A2:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Map rows to an array of useful objects
    return rows.map((row) => ({
      username: row[1] || '',
      password: row[0] || '',
      // Default to 'member' if the role column is empty or invalid
      role: (row[2] as 'member' | 'eboard' | 'rush' | 'admin') || 'member',
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

export async function getCalendarFromSheet(): Promise<CalendarEvent[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = `'Calendar'!A2:D`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows.map((row, index) => ({
      id: String(index + 1),
      title: row[0] || '',
      date: row[1] || '',
      location: row[2] || '',
      details: row[3] || '',
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

export async function getLinksFromSheet(): Promise<MemberLink[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = `'Links'!A1:B`; // Get all rows including header

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const urlIndex = headers.indexOf('url');
    const titleIndex = headers.indexOf('label');

    // Parse data rows
    const dataRows = rows.slice(1);
    return dataRows.map((row, index) => {
      const title = row[titleIndex] || 'Link';
      const url = row[urlIndex] || '#';
      return {
        id: String(index + 1),
        title,
        url
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
  attendancePoints: number;
  concessionsDone: boolean;
}

export async function getMemberStatusFromSheet(): Promise<MemberStatusRecord[]> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = `'MemberStatus'!A1:G`; // username, dues_paid, brotherhood_met, prof_dev_met, comm_service_met, attendance_points, concessions_done

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    
    // Find column indexes dynamically
    const usernameIndex = headers.findIndex(h => h === 'username' || h === 'email' || h === 'user');
    const duesPaidIndex = headers.findIndex(h => h.includes('dues'));
    const brotherhoodIndex = headers.findIndex(h => h.includes('brotherhood'));
    const profDevIndex = headers.findIndex(h => h.includes('prof') || h.includes('pd'));
    const commServiceIndex = headers.findIndex(h => h.includes('community') || h.includes('cs') || h.includes('comm') || h.includes('service'));
    const attendanceIndex = headers.findIndex(h => h.includes('attendance') || h.includes('point'));
    const concessionsIndex = headers.findIndex(h => h.includes('concession'));

    const isTrue = (val: string) => {
      if (!val) return false;
      const lower = val.toLowerCase().trim();
      return lower === 'true' || lower === 'yes' || lower === 'y' || lower === 'x' || lower === '1';
    };

    const dataRows = rows.slice(1);
    return dataRows
      .filter(row => row[usernameIndex]) // only include rows with a username
      .map((row) => {
        let rawUsername = row[usernameIndex] || '';
        // If it's a full email like "john@wisc.edu", extract the username part
        if (rawUsername.includes('@')) {
          rawUsername = rawUsername.split('@')[0];
        }
        rawUsername = rawUsername.trim().toLowerCase();

        const duesPaid = duesPaidIndex !== -1 ? isTrue(row[duesPaidIndex]) : false;
        const brotherhoodMet = brotherhoodIndex !== -1 ? isTrue(row[brotherhoodIndex]) : false;
        const profDevMet = profDevIndex !== -1 ? isTrue(row[profDevIndex]) : false;
        const commServiceMet = commServiceIndex !== -1 ? isTrue(row[commServiceIndex]) : false;
        const attendancePoints = attendanceIndex !== -1 ? parseInt(row[attendanceIndex], 10) || 0 : 0;
        const concessionsDone = concessionsIndex !== -1 ? isTrue(row[concessionsIndex]) : false;

        return {
          username: rawUsername,
          duesPaid,
          brotherhoodMet,
          profDevMet,
          commServiceMet,
          attendancePoints,
          concessionsDone,
        };
      });

  } catch (error) {
    console.error('Error fetching member status from Google Sheet:', error);
    return [];
  }
}
