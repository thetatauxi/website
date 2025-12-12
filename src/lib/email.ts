'use server'

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { cookies } from 'next/headers';

// Load credentials from environment variables
const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Emails';

// Rate limiting: Allow 3 submissions per hour
const RATE_LIMIT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_SUBMISSIONS = 3;

// Store rate limiting data
type RateLimitData = {
  timestamp: number;
  count: number;
};

const rateLimitStore = new Map<string, RateLimitData>();

// Clean up old rate limit data every hour
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((data, key) => {
    if (now - data.timestamp > RATE_LIMIT_DURATION) {
      rateLimitStore.delete(key);
    }
  });
}, RATE_LIMIT_DURATION);

async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now();
  const data = rateLimitStore.get(identifier);

  if (!data || now - data.timestamp > RATE_LIMIT_DURATION) {
    // First submission or rate limit period expired
    rateLimitStore.set(identifier, { timestamp: now, count: 1 });
    return true;
  }

  if (data.count >= MAX_SUBMISSIONS) {
    return false; // Rate limit exceeded
  }

  // Increment submission count
  rateLimitStore.set(identifier, { timestamp: data.timestamp, count: data.count + 1 });
  return true;
}

async function findAndDeleteExistingEntries(sheets: any, email: string, categories: string[]) {
  try {
    // Get all entries
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return; // No data or only headers

    // Find rows to delete (matching email and categories)
    const rowsToDelete = [];
    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
      const rowEmail = rows[i][0]?.toLowerCase();
      const rowCategory = rows[i][2]?.toLowerCase();
      
      if (rowEmail === email.toLowerCase() && 
          categories.some(cat => cat.toLowerCase() === rowCategory)) {
        rowsToDelete.push(i + 1); // +1 because sheets are 1-indexed
      }
    }

    // Delete rows if any found
    if (rowsToDelete.length > 0) {
      // Sort in descending order to avoid shifting issues
      rowsToDelete.sort((a, b) => b - a);

      // Delete each row
      for (const rowIndex of rowsToDelete) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // Assumes first sheet
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex
                }
              }
            }]
          }
        });
      }
    }
  } catch (error) {
    console.error('Error deleting existing entries:', error);
    // Continue with the process even if deletion fails
  }
}

export async function addEmailToSheet(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const source = formData.get('source') as string;
    const categories = (formData.get('categories') as string || 'general').split(',');

    // Basic validation
    if (!email || !source) {
      throw new Error('Email and source are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check rate limit using IP or email as identifier
    const identifier = email.toLowerCase(); // Use email as identifier
    const isAllowed = await checkRateLimit(identifier);
    if (!isAllowed) {
      throw new Error('Too many subscription attempts. Please try again later.');
    }

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Delete existing entries for this email and categories
    await findAndDeleteExistingEntries(sheets, email, categories);

    // Create new rows
    const rows = categories.map(category => [
      email,
      source,
      category.trim(),
      new Date().toISOString()
    ]);

    // Append the new entries
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    return { 
      success: true,
      message: 'Successfully subscribed!'
    };
  } catch (error) {
    console.error('Error:', error);
    throw error instanceof Error ? error : new Error('Failed to save email');
  }
}
